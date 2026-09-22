"""HTTP client goi Spring Backend.

- Forward JWT cua actor (khong co service-to-service auth o backend).
- Mo envelope {success, status, message, data} va tra ve `data`.
- Retry chi voi request idempotent (GET).
- Loi duoc map sang AgentErrorCode; chi tiet raw chi vao log.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.config import Settings
from app.core.errors import AgentError, AgentErrorCode

logger = logging.getLogger(__name__)

_IDEMPOTENT_METHODS = frozenset({"GET", "HEAD"})

_STATUS_TO_CODE: dict[int, AgentErrorCode] = {
    400: AgentErrorCode.INVALID_ARGUMENT,
    401: AgentErrorCode.UNAUTHENTICATED,
    403: AgentErrorCode.PERMISSION_DENIED,
    404: AgentErrorCode.RESOURCE_NOT_FOUND,
    409: AgentErrorCode.INVALID_ARGUMENT,
    422: AgentErrorCode.INVALID_ARGUMENT,
    429: AgentErrorCode.RATE_LIMITED,
}


class BackendClient:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._client: httpx.AsyncClient | None = None

    async def start(self) -> None:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self._settings.backend_base_url.rstrip("/"),
                timeout=self._settings.backend_timeout_seconds,
            )

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            raise RuntimeError("BackendClient chua duoc start()")
        return self._client

    async def request(
        self,
        method: str,
        path: str,
        *,
        token: str,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        method = method.upper()
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        if correlation_id:
            headers["X-Correlation-Id"] = correlation_id

        # Backend tra ve JSESSIONID. Neu de cookie ton tai, cac request sau se duoc xac thuc bang
        # session cua nguoi dung truoc do thay vi bang Bearer token cua chinh ho.
        # Agent chi xac thuc bang Bearer token nen khong bao gio dung cookie.
        if self.client.cookies:
            self.client.cookies.clear()

        attempts = 1 + (self._settings.backend_max_retries if method in _IDEMPOTENT_METHODS else 0)
        last_error: Exception | None = None

        for attempt in range(attempts):
            try:
                response = await self.client.request(
                    method,
                    path,
                    params={k: v for k, v in (params or {}).items() if v is not None},
                    json=json_body,
                    headers=headers,
                )
            except httpx.TimeoutException as exc:
                last_error = exc
            except httpx.HTTPError as exc:
                last_error = exc
            else:
                if response.status_code >= 500 and attempt + 1 < attempts:
                    last_error = None
                    await asyncio.sleep(0.2 * (attempt + 1))
                    continue
                return self._unwrap(response, method=method, path=path)

            if attempt + 1 < attempts:
                await asyncio.sleep(0.2 * (attempt + 1))

        logger.warning(
            "backend request that bai",
            extra={
                "context": {
                    "method": method,
                    "path": path,
                    "error": type(last_error).__name__ if last_error else "unknown",
                }
            },
        )
        raise AgentError(
            AgentErrorCode.DOWNSTREAM_UNAVAILABLE,
            detail=f"{method} {path}: {type(last_error).__name__ if last_error else 'unreachable'}",
        )

    def _unwrap(self, response: httpx.Response, *, method: str, path: str) -> Any:
        try:
            payload = response.json()
        except ValueError:
            payload = None

        if response.status_code >= 400:
            code, message = self._error_from(response.status_code, payload)
            logger.info(
                "backend tra loi loi",
                extra={
                    "context": {
                        "method": method,
                        "path": path,
                        "status": response.status_code,
                        "code": str(code),
                    }
                },
            )
            raise AgentError(code, message=message)

        if isinstance(payload, dict) and "success" in payload:
            if payload.get("success") is False:
                code = self._code_from_payload(payload, response.status_code)
                raise AgentError(code, message=str(payload.get("message") or "") or None)
            return payload.get("data")

        return payload

    @staticmethod
    def _code_from_payload(payload: dict, status_code: int) -> AgentErrorCode:
        raw = str(payload.get("error") or "").upper()
        if raw:
            try:
                return AgentErrorCode(raw)
            except ValueError:
                pass
        return _STATUS_TO_CODE.get(status_code, AgentErrorCode.AGENT_ERROR)

    @staticmethod
    def _error_from(status_code: int, payload: Any) -> tuple[AgentErrorCode, str | None]:
        message: str | None = None
        if isinstance(payload, dict):
            message = str(payload.get("message") or "") or None
            raw = str(payload.get("error") or "").upper()
            if raw:
                try:
                    return AgentErrorCode(raw), message
                except ValueError:
                    pass
        return _STATUS_TO_CODE.get(status_code, AgentErrorCode.AGENT_ERROR), message
