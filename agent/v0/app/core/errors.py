"""Ma loi dung chung cho agent core (theo agent/PLAN.md muc 6.4)."""

from __future__ import annotations

from enum import StrEnum


class AgentErrorCode(StrEnum):
    UNAUTHENTICATED = "UNAUTHENTICATED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    OWNERSHIP_VIOLATION = "OWNERSHIP_VIOLATION"
    INVALID_ARGUMENT = "INVALID_ARGUMENT"
    UNKNOWN_TOOL = "UNKNOWN_TOOL"
    WRITE_NOT_ENABLED = "WRITE_NOT_ENABLED"
    RATE_LIMITED = "RATE_LIMITED"
    DOWNSTREAM_UNAVAILABLE = "DOWNSTREAM_UNAVAILABLE"
    AGENT_TIMEOUT = "AGENT_TIMEOUT"
    AGENT_ERROR = "AGENT_ERROR"
    POLICY_DENIED = "POLICY_DENIED"


# Thong diep an toan tra cho nguoi dung / model, khong chua chi tiet noi bo.
SAFE_MESSAGES: dict[AgentErrorCode, str] = {
    AgentErrorCode.UNAUTHENTICATED: "Phien dang nhap khong hop le hoac da het han.",
    AgentErrorCode.PERMISSION_DENIED: "Tai khoan cua ban khong co quyen cho thao tac nay.",
    AgentErrorCode.RESOURCE_NOT_FOUND: "Khong tim thay du lieu duoc yeu cau.",
    AgentErrorCode.OWNERSHIP_VIOLATION: "Du lieu nay khong thuoc pham vi truy cap cua ban.",
    AgentErrorCode.INVALID_ARGUMENT: "Tham so yeu cau chua hop le.",
    AgentErrorCode.UNKNOWN_TOOL: "Khong ho tro yeu cau nay.",
    AgentErrorCode.WRITE_NOT_ENABLED: "Phien ban nay chi ho tro tra cuu, chua ho tro thay doi du lieu.",
    AgentErrorCode.RATE_LIMITED: "He thong dang qua tai, vui long thu lai sau.",
    AgentErrorCode.DOWNSTREAM_UNAVAILABLE: "He thong Lunara tam thoi khong phan hoi.",
    AgentErrorCode.AGENT_TIMEOUT: "Yeu cau xu ly qua lau, vui long thu lai.",
    AgentErrorCode.AGENT_ERROR: "Da co loi khi xu ly yeu cau.",
    AgentErrorCode.POLICY_DENIED: "Yeu cau nay khong duoc phep thuc hien.",
}


def safe_message(code: AgentErrorCode | str, fallback: str | None = None) -> str:
    try:
        return SAFE_MESSAGES[AgentErrorCode(code)]
    except (KeyError, ValueError):
        return fallback or SAFE_MESSAGES[AgentErrorCode.AGENT_ERROR]


class AgentError(Exception):
    def __init__(self, code: AgentErrorCode, message: str | None = None, *, detail: str | None = None):
        self.code = code
        self.detail = detail
        super().__init__(message or safe_message(code))
