"""PolicyGuard: fail-closed cho tool ngoai allow-list, tham so sai, write tool."""

from __future__ import annotations

import pytest

from app.core.errors import AgentErrorCode
from app.core.policy import PolicyGuard
from app.tools.catalog import REGISTRY
from app.tools.registry import ToolSpec
from app.tools.schemas import SearchServicesInput


@pytest.fixture
def guard() -> PolicyGuard:
    return PolicyGuard(REGISTRY)


def test_known_tool_with_permission_is_allowed(guard: PolicyGuard) -> None:
    decision = guard.check(
        call_id="c1", tool_name="search_services", raw_args={"query": "massage"}, allowed_names={"search_services"}
    )
    assert decision.allowed
    assert decision.args == {"query": "massage", "limit": 8}


def test_tool_outside_allow_list_is_denied(guard: PolicyGuard) -> None:
    decision = guard.check(
        call_id="c1", tool_name="search_bookings", raw_args={}, allowed_names={"search_services"}
    )
    assert not decision.allowed
    assert decision.error_code == AgentErrorCode.PERMISSION_DENIED


def test_unknown_tool_is_denied(guard: PolicyGuard) -> None:
    decision = guard.check(call_id="c1", tool_name="drop_table", raw_args={}, allowed_names={"drop_table"})
    assert not decision.allowed
    assert decision.error_code == AgentErrorCode.UNKNOWN_TOOL


def test_actor_identity_argument_is_rejected(guard: PolicyGuard) -> None:
    decision = guard.check(
        call_id="c1",
        tool_name="get_my_bookings",
        raw_args={"account_id": 42},
        allowed_names={"get_my_bookings"},
    )
    assert not decision.allowed
    assert decision.error_code == AgentErrorCode.INVALID_ARGUMENT
    assert "account_id" in (decision.message or "")


def test_invalid_arguments_are_rejected(guard: PolicyGuard) -> None:
    decision = guard.check(
        call_id="c1",
        tool_name="check_availability",
        raw_args={"items": [{"service_id": 1, "duration_minutes": 0}], "from": "bad-date", "to": "bad-date"},
        allowed_names={"check_availability"},
    )
    assert not decision.allowed
    assert decision.error_code == AgentErrorCode.INVALID_ARGUMENT


def test_date_range_limit_is_enforced(guard: PolicyGuard) -> None:
    decision = guard.check(
        call_id="c1",
        tool_name="get_my_bookings",
        raw_args={"from": "2026-09-01T00:00:00", "to": "2026-12-01T00:00:00"},
        allowed_names={"get_my_bookings"},
    )
    assert not decision.allowed
    assert decision.error_code == AgentErrorCode.INVALID_ARGUMENT


def test_write_tool_is_rejected_even_if_allow_listed() -> None:
    write_spec = ToolSpec(
        name="create_booking",
        group="write",
        description="tao booking",
        input_model=SearchServicesInput,
        handler=lambda *_: None,
        read_only=False,
    )
    guard = PolicyGuard({**REGISTRY, "create_booking": write_spec})
    decision = guard.check(call_id="c1", tool_name="create_booking", raw_args={}, allowed_names={"create_booking"})
    assert not decision.allowed
    assert decision.error_code == AgentErrorCode.WRITE_NOT_ENABLED
