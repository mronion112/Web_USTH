"""AgentState toi thieu (theo agent/NOTE.md muc 5)."""

from __future__ import annotations

from typing import Annotated, Any, TypedDict

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

from app.core.actor import ActorContext


class AgentState(TypedDict, total=False):
    messages: Annotated[list[AnyMessage], add_messages]
    actor: ActorContext
    allowed_tools: list[str]
    tool_groups: dict[str, list[str]]
    preflight: dict[str, Any]
    decisions: list[dict[str, Any]]
    tool_results: list[dict[str, Any]]
    iterations: int
    terminated: bool
    refusal: str | None
    contract: dict[str, Any] | None
    error: dict[str, Any] | None
