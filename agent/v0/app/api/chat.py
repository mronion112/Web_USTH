"""Endpoint chat cua agent v0 (channel WEB)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Request
from pydantic import BaseModel, ConfigDict, Field

from app.api.deps import resolve_actor
from app.core.actor import ActorContext
from app.core.contract import ResponseContract

router = APIRouter(prefix="/api/agent", tags=["agent"])


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str = Field(min_length=1, max_length=4000, description="Tin nhan cua nguoi dung")
    conversation_id: str | None = Field(
        default=None,
        alias="conversationId",
        max_length=64,
        pattern=r"^[A-Za-z0-9_-]+$",
        description="Id hoi thoai do client giu; bo trong de tao moi",
    )


class ResetResponse(BaseModel):
    conversationId: str
    deleted: bool


def _runtime(request: Request):
    return request.app.state.runtime


@router.post("/chat", response_model=ResponseContract)
async def chat(payload: ChatRequest, request: Request) -> ResponseContract:
    runtime = _runtime(request)
    actor: ActorContext = await resolve_actor(request, runtime.backend)
    conversation_id = payload.conversation_id or uuid.uuid4().hex[:12]
    actor = ActorContext(
        account_id=actor.account_id,
        email=actor.email,
        display_name=actor.display_name,
        role=actor.role,
        token=actor.token,
        channel="WEB",
        conversation_id=conversation_id,
        permissions=actor.permissions,
    )
    return await runtime.chat(actor, payload.message)


@router.delete("/conversations/{conversation_id}", response_model=ResetResponse)
async def reset_conversation(conversation_id: str, request: Request) -> ResetResponse:
    runtime = _runtime(request)
    actor: ActorContext = await resolve_actor(request, runtime.backend)
    scoped = ActorContext(
        account_id=actor.account_id,
        email=actor.email,
        display_name=actor.display_name,
        role=actor.role,
        token=actor.token,
        channel="WEB",
        conversation_id=conversation_id,
        permissions=actor.permissions,
    )
    deleted = await runtime.reset(scoped)
    return ResetResponse(conversationId=conversation_id, deleted=deleted)
