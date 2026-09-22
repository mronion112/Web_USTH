"""Xac thuc request: forward JWT cua Lunara va resolve actor tu /api/auth/me.

Khong tu decode JWT: quyen va account phai den tu backend da verify token.
"""

from __future__ import annotations

from fastapi import Request

from app.clients.backend import BackendClient
from app.core.actor import ActorContext
from app.core.errors import AgentError, AgentErrorCode
from app.observability import get_correlation_id


def extract_bearer(request: Request) -> str:
    header = request.headers.get("authorization") or ""
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise AgentError(AgentErrorCode.UNAUTHENTICATED)
    return token.strip()


async def resolve_actor(request: Request, backend: BackendClient) -> ActorContext:
    token = extract_bearer(request)
    payload = await backend.request(
        "GET",
        "/api/auth/me",
        token=token,
        correlation_id=get_correlation_id(),
    )
    if not isinstance(payload, dict) or not payload.get("id"):
        raise AgentError(AgentErrorCode.UNAUTHENTICATED)

    actor = ActorContext.from_me(payload, token)
    if not payload.get("isActive", True):
        raise AgentError(AgentErrorCode.PERMISSION_DENIED)
    return actor
