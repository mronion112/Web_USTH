"""PolicyGuard - lop kiem tra deterministic giua Agent va ExecuteTool.

Thu tu kiem tra (fail-closed). Bat ky buoc nao khong dat thi tool call bi tu choi:
1. tool co trong registry?
2. tool co trong allow-list cua actor?
3. tool co phai read-only? (v0 khong ho tro write)
4. model co tu them field dinh danh khong? (actor luon lay tu trusted context)
5. tham so co vuot schema/bound khong?
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from pydantic import ValidationError

from app.core.errors import AgentErrorCode, safe_message
from app.tools.registry import ToolSpec

logger = logging.getLogger(__name__)

FORBIDDEN_ARGUMENT_KEYS = frozenset(
    {
        "account_id",
        "accountid",
        "actor_account_id",
        "actoraccountid",
        "actor",
        "role",
        "permissions",
        "token",
        "access_token",
        "authorization",
    }
)


@dataclass(frozen=True)
class GuardDecision:
    call_id: str
    tool_name: str
    allowed: bool
    spec: ToolSpec | None = None
    args: dict = field(default_factory=dict)
    error_code: AgentErrorCode | None = None
    message: str | None = None

    def as_trace(self) -> dict:
        return {
            "tool": self.tool_name,
            "allowed": self.allowed,
            "errorCode": str(self.error_code) if self.error_code else None,
        }


class PolicyGuard:
    def __init__(self, registry: dict[str, ToolSpec]):
        self._registry = registry

    def check(
        self,
        *,
        call_id: str,
        tool_name: str,
        raw_args: dict | None,
        allowed_names: set[str],
    ) -> GuardDecision:
        spec = self._registry.get(tool_name)
        if spec is None:
            return self._deny(call_id, tool_name, AgentErrorCode.UNKNOWN_TOOL)

        if tool_name not in allowed_names:
            logger.info("policy tu choi tool ngoai allow-list", extra={"context": {"tool": tool_name}})
            return self._deny(call_id, tool_name, AgentErrorCode.PERMISSION_DENIED, spec=spec)

        if not spec.read_only:
            return self._deny(call_id, tool_name, AgentErrorCode.WRITE_NOT_ENABLED, spec=spec)

        raw_args = raw_args or {}
        forbidden = FORBIDDEN_ARGUMENT_KEYS.intersection(raw_args)
        if forbidden:
            logger.warning(
                "model tu them field dinh danh", extra={"context": {"tool": tool_name, "keys": sorted(forbidden)}}
            )
            return self._deny(
                call_id,
                tool_name,
                AgentErrorCode.INVALID_ARGUMENT,
                spec=spec,
                message="Tham so khong duoc phep: " + ", ".join(sorted(forbidden)),
            )

        try:
            validated = spec.input_model.model_validate(raw_args)
        except ValidationError as error:
            fields = sorted({str(item["loc"][0]) for item in error.errors() if item.get("loc")})
            return self._deny(
                call_id,
                tool_name,
                AgentErrorCode.INVALID_ARGUMENT,
                spec=spec,
                message="Tham so chua hop le: " + (", ".join(fields) if fields else "khong xac dinh"),
            )

        return GuardDecision(
            call_id=call_id,
            tool_name=tool_name,
            allowed=True,
            spec=spec,
            args=validated.model_dump(by_alias=True, exclude_none=True, mode="json"),
        )

    @staticmethod
    def _deny(
        call_id: str,
        tool_name: str,
        code: AgentErrorCode,
        *,
        spec: ToolSpec | None = None,
        message: str | None = None,
    ) -> GuardDecision:
        return GuardDecision(
            call_id=call_id,
            tool_name=tool_name,
            allowed=False,
            spec=spec,
            error_code=code,
            message=message or safe_message(code),
        )
