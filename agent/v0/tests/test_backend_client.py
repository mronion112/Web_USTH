"""BackendClient: mo envelope, map loi, retry chi voi GET."""

from __future__ import annotations

import httpx
import pytest
import respx

from app.clients.backend import BackendClient
from app.core.errors import AgentError, AgentErrorCode
from tests.conftest import make_settings


@pytest.fixture
async def client():
    backend = BackendClient(make_settings())
    await backend.start()
    yield backend
    await backend.aclose()


@respx.mock
async def test_unwraps_success_envelope(client: BackendClient) -> None:
    respx.get("http://backend.test/api/services").mock(
        return_value=httpx.Response(200, json={"success": True, "status": 200, "message": "Success", "data": [{"id": 1}]})
    )
    assert await client.request("GET", "/api/services", token="t") == [{"id": 1}]


@respx.mock
async def test_maps_403_to_permission_denied(client: BackendClient) -> None:
    respx.get("http://backend.test/api/bookings/X").mock(
        return_value=httpx.Response(403, json={"success": False, "status": 403, "message": "Forbidden"})
    )
    with pytest.raises(AgentError) as excinfo:
        await client.request("GET", "/api/bookings/X", token="t")
    assert excinfo.value.code == AgentErrorCode.PERMISSION_DENIED
    assert str(excinfo.value) == "Forbidden"


@respx.mock
async def test_maps_security_writer_401_without_envelope(client: BackendClient) -> None:
    respx.get("http://backend.test/api/auth/me").mock(
        return_value=httpx.Response(401, json={"success": False, "status": 401, "message": "Unauthorized"})
    )
    with pytest.raises(AgentError) as excinfo:
        await client.request("GET", "/api/auth/me", token="t")
    assert excinfo.value.code == AgentErrorCode.UNAUTHENTICATED


@respx.mock
async def test_error_code_from_payload_is_preserved(client: BackendClient) -> None:
    respx.get("http://backend.test/api/bookings/my").mock(
        return_value=httpx.Response(400, json={"success": False, "status": 400, "error": "INVALID_ARGUMENT"})
    )
    with pytest.raises(AgentError) as excinfo:
        await client.request("GET", "/api/bookings/my", token="t")
    assert excinfo.value.code == AgentErrorCode.INVALID_ARGUMENT


@respx.mock
async def test_get_is_retried_on_server_error(client: BackendClient) -> None:
    route = respx.get("http://backend.test/api/services").mock(
        side_effect=[
            httpx.Response(500, json={"message": "boom"}),
            httpx.Response(200, json={"success": True, "data": []}),
        ]
    )
    assert await client.request("GET", "/api/services", token="t") == []
    assert route.call_count == 2


@respx.mock
async def test_post_is_not_retried(client: BackendClient) -> None:
    route = respx.post("http://backend.test/api/availability").mock(
        return_value=httpx.Response(500, json={"message": "boom"})
    )
    with pytest.raises(AgentError):
        await client.request("POST", "/api/availability", token="t", json_body={})
    assert route.call_count == 1


@respx.mock
async def test_session_cookie_is_never_reused_between_users(client: BackendClient) -> None:
    """JSESSIONID cua nguoi dung truoc khong duoc dinh sang request cua nguoi dung sau."""
    route = respx.get("http://backend.test/api/auth/me").mock(
        side_effect=[
            httpx.Response(
                200,
                json={"success": True, "data": {"id": 29}},
                headers={"set-cookie": "JSESSIONID=abc123; Path=/; HttpOnly"},
            ),
            httpx.Response(200, json={"success": True, "data": {"id": 2}}),
        ]
    )
    await client.request("GET", "/api/auth/me", token="token-customer")
    await client.request("GET", "/api/auth/me", token="token-manager")

    second_headers = {key.lower(): value for key, value in route.calls[1].request.headers.items()}
    assert "cookie" not in second_headers
    assert second_headers["authorization"] == "Bearer token-manager"


@respx.mock
async def test_unreachable_backend_maps_to_downstream_unavailable(client: BackendClient) -> None:
    respx.get("http://backend.test/api/services").mock(side_effect=httpx.ConnectError("no route"))
    with pytest.raises(AgentError) as excinfo:
        await client.request("GET", "/api/services", token="t")
    assert excinfo.value.code == AgentErrorCode.DOWNSTREAM_UNAVAILABLE
