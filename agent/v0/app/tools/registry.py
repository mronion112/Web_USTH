"""ToolSpec, ToolContext, ToolOutcome va tien ich sinh schema cho LLM."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel

from app.config import Settings
from app.core.actor import ActorContext

if TYPE_CHECKING:  # pragma: no cover
    from app.clients.backend import BackendClient
    from app.core.typesafe import TypeSafeJudge
    from app.knowledge.search import KnowledgeIndex


@dataclass(frozen=True)
class ToolContext:
    actor: ActorContext
    backend: BackendClient
    knowledge: KnowledgeIndex
    judge: TypeSafeJudge
    settings: Settings
    correlation_id: str

    @property
    def timezone(self) -> str:
        return self.settings.agent_timezone


@dataclass
class ToolOutcome:
    ok: bool = True
    data: dict | None = None
    error: dict | None = None
    citations: list[dict] = field(default_factory=list)
    meta: dict = field(default_factory=dict)

    @classmethod
    def success(cls, data: dict, *, citations: list[dict] | None = None, meta: dict | None = None) -> ToolOutcome:
        return cls(ok=True, data=data, citations=citations or [], meta=meta or {})

    @classmethod
    def failure(cls, code: str, message: str, *, meta: dict | None = None) -> ToolOutcome:
        return cls(ok=False, error={"code": code, "message": message}, meta=meta or {})

    def as_tool_message_payload(self) -> dict:
        if self.ok:
            payload: dict[str, Any] = {"ok": True, "data": self.data}
            if self.citations:
                payload["citations"] = self.citations
            return payload
        return {"ok": False, "error": self.error}


Handler = Callable[[ToolContext, Any], Awaitable[ToolOutcome]]


@dataclass(frozen=True)
class ToolSpec:
    name: str
    group: str
    description: str
    input_model: type[BaseModel]
    handler: Handler
    required_permissions: frozenset[str] = frozenset()
    allowed_roles: frozenset[str] | None = None
    component: str | None = None
    read_only: bool = True

    def is_available_to(self, actor: ActorContext) -> bool:
        if not self.read_only:
            return False
        if self.allowed_roles is not None and actor.role not in self.allowed_roles:
            return False
        return all(actor.has(permission) for permission in self.required_permissions)

    def json_schema(self) -> dict[str, Any]:
        schema = self.input_model.model_json_schema(by_alias=True)
        schema.pop("title", None)
        return schema


def select_specs(registry: dict[str, ToolSpec], actor: ActorContext) -> list[ToolSpec]:
    return [spec for spec in registry.values() if spec.is_available_to(actor)]


def openai_tool_definitions(specs: list[ToolSpec]) -> list[dict[str, Any]]:
    """Dinh dang tool cho LLM: khong bao gio truyen callable, chi schema."""
    return [
        {
            "type": "function",
            "function": {
                "name": spec.name,
                "description": spec.description,
                "parameters": spec.json_schema(),
            },
        }
        for spec in specs
    ]


def describe_tools(specs: list[ToolSpec]) -> str:
    return "\n".join(f"- {spec.name}: {spec.description.splitlines()[0]}" for spec in specs)


def spec_groups(specs: list[ToolSpec]) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = {}
    for spec in specs:
        groups.setdefault(spec.group, []).append(spec.name)
    return groups
