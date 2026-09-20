"""Cac node cua graph: LoadContext -> Agent -> PolicyGuard -> ExecuteTool -> Contract."""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime
from string import Template
from typing import Any
from zoneinfo import ZoneInfo

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage, ToolMessage

from app.config import PROMPT_VERSION, Settings
from app.core.contract import ResponseContract, build_citations, build_components, fallback_text
from app.core.errors import AgentErrorCode, safe_message
from app.core.policy import PolicyGuard
from app.core.state import AgentState
from app.core.typesafe import ALWAYS_AVAILABLE_GROUPS, GROUP_PREREQUISITES, TypeSafeJudge
from app.knowledge.search import KnowledgeIndex
from app.observability import get_correlation_id
from app.tools.registry import (
    ToolContext,
    ToolSpec,
    describe_tools,
    openai_tool_definitions,
    select_specs,
    spec_groups,
)

logger = logging.getLogger(__name__)

MAX_TOOL_PAYLOAD_CHARS = 6000
SYSTEM_MESSAGE_FLAG = "lunara_system"


@dataclass
class AgentDeps:
    settings: Settings
    guard: PolicyGuard
    judge: TypeSafeJudge
    knowledge: KnowledgeIndex
    registry: dict[str, ToolSpec]
    model: Any
    prompt_template: str
    backend: Any


def _last_human_text(messages: list[AnyMessage]) -> str:
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return str(message.content)
    return ""


def _render_prompt(deps: AgentDeps, actor, specs: list[ToolSpec], narrow_note: str) -> str:
    now = datetime.now(ZoneInfo(deps.settings.agent_timezone))
    return Template(deps.prompt_template).safe_substitute(
        display_name=actor.display_name or actor.email,
        role=actor.role,
        today=now.strftime("%d/%m/%Y %H:%M"),
        timezone=deps.settings.agent_timezone,
        knowledge_audiences=", ".join(sorted(actor.audiences)),
        narrow_note=narrow_note,
        tool_list=describe_tools(specs),
    )


class LunaraNodes:
    def __init__(self, deps: AgentDeps):
        self.deps = deps

    # ---------------------------------------------------------------- LoadContext
    async def load_context(self, state: AgentState) -> dict[str, Any]:
        actor = state["actor"]
        correlation_id = get_correlation_id()
        specs = select_specs(self.deps.registry, actor)
        groups = spec_groups(specs)

        terminated = False
        refusal: str | None = None
        narrow_note = ""
        preflight_trace: dict[str, Any] = {"used": False, "degraded": False, "decision": "allow"}

        if not actor.is_known_role:
            terminated = True
            refusal = "Tai khoan cua ban chua duoc cau hinh quyen truy cap tro ly. Vui long lien he quan tri vien Lunara."
            preflight_trace = {"used": False, "degraded": False, "decision": "deny", "reason": "unknown_role"}
        else:
            preflight = await self.deps.judge.preflight(
                message=_last_human_text(state["messages"]), actor=actor, groups=groups
            )
            preflight_trace = preflight.as_trace()
            if preflight.decision == "deny":
                terminated = True
                refusal = preflight.message or safe_message(AgentErrorCode.POLICY_DENIED)
            elif preflight.decision == "narrow":
                keep_groups = set(preflight.keep_groups) | ALWAYS_AVAILABLE_GROUPS
                for group in list(keep_groups):
                    keep_groups |= GROUP_PREREQUISITES.get(group, frozenset())
                narrowed = [spec for spec in specs if spec.group in keep_groups]
                if narrowed:
                    specs = narrowed
                    narrow_note = (
                        "\n- Pham vi cua luot nay duoc thu hep theo phan loai y dinh, kem cac cong cu tien quyet "
                        "(tra cuu dich vu, chinh sach). Neu yeu cau thuc su thuoc pham vi khac, hay hoi lai nguoi dung cho ro."
                    )

        messages: list[AnyMessage] = []
        system_content = _render_prompt(self.deps, actor, specs, narrow_note)
        existing = state.get("messages") or []
        previous_system = next(
            (
                message
                for message in reversed(existing)
                if isinstance(message, SystemMessage) and message.additional_kwargs.get(SYSTEM_MESSAGE_FLAG)
            ),
            None,
        )
        if previous_system is None or str(previous_system.content) != system_content:
            messages.append(
                SystemMessage(content=system_content, additional_kwargs={SYSTEM_MESSAGE_FLAG: True})
            )

        logger.info(
            "load_context",
            extra={
                "context": {
                    "correlationId": correlation_id,
                    "role": actor.role,
                    "allowedTools": [spec.name for spec in specs],
                    "preflight": preflight_trace,
                }
            },
        )

        return {
            "messages": messages,
            "allowed_tools": [spec.name for spec in specs],
            "tool_groups": groups,
            "preflight": preflight_trace,
            "decisions": [],
            "tool_results": [],
            "iterations": 0,
            "terminated": terminated,
            "refusal": refusal,
            "contract": None,
            "error": None,
        }

    # ---------------------------------------------------------------------- Agent
    async def agent(self, state: AgentState) -> dict[str, Any]:
        if state.get("terminated"):
            return {"messages": [AIMessage(content=state.get("refusal") or "Yeu cau nay khong duoc phep.")]}

        iterations = int(state.get("iterations", 0))
        specs = [self.deps.registry[name] for name in state.get("allowed_tools", []) if name in self.deps.registry]

        if iterations >= self.deps.settings.llm_max_tool_iterations or not specs:
            model = self.deps.model
        else:
            model = self.deps.model.bind_tools(openai_tool_definitions(specs))

        response = await model.ainvoke(state["messages"])
        return {"messages": [response], "iterations": iterations + 1}

    # ---------------------------------------------------------------- PolicyGuard
    async def policy_guard(self, state: AgentState) -> dict[str, Any]:
        last = state["messages"][-1]
        allowed_names = set(state.get("allowed_tools", []))
        decisions: list[dict[str, Any]] = []

        for call in getattr(last, "tool_calls", []) or []:
            decision = self.deps.guard.check(
                call_id=str(call.get("id") or ""),
                tool_name=str(call.get("name") or ""),
                raw_args=call.get("args") or {},
                allowed_names=allowed_names,
            )
            decisions.append(
                {
                    "callId": decision.call_id,
                    "tool": decision.tool_name,
                    "allowed": decision.allowed,
                    "args": decision.args,
                    "errorCode": str(decision.error_code) if decision.error_code else None,
                    "message": decision.message,
                }
            )

        return {"decisions": decisions}

    # ---------------------------------------------------------------- ExecuteTool
    async def execute_tool(self, state: AgentState) -> dict[str, Any]:
        actor = state["actor"]
        correlation_id = get_correlation_id()
        decisions = state.get("decisions") or []
        ctx = ToolContext(
            actor=actor,
            backend=self.deps.backend,
            knowledge=self.deps.knowledge,
            judge=self.deps.judge,
            settings=self.deps.settings,
            correlation_id=correlation_id,
        )
        timeout = min(self.deps.settings.backend_timeout_seconds * (self.deps.settings.backend_max_retries + 2), 45.0)

        async def run(decision: dict[str, Any]) -> tuple[dict[str, Any], Any]:
            spec = self.deps.registry[decision["tool"]]
            payload = spec.input_model.model_validate(decision["args"])
            outcome = await asyncio.wait_for(spec.handler(ctx, payload), timeout=timeout)
            return decision, outcome

        allowed_decisions = [decision for decision in decisions if decision["allowed"]]
        outcomes = await asyncio.gather(*(run(decision) for decision in allowed_decisions), return_exceptions=True)
        outcome_by_call: dict[str, Any] = {}
        for decision, result in zip(allowed_decisions, outcomes, strict=True):
            if isinstance(result, BaseException):
                logger.exception("tool chay loi", extra={"context": {"tool": decision["tool"]}})
                outcome_by_call[decision["callId"]] = None
                continue
            outcome_by_call[decision["callId"]] = result[1]

        messages: list[ToolMessage] = []
        tool_results: list[dict[str, Any]] = []

        for decision in decisions:
            call_id = decision["callId"]
            if not decision["allowed"]:
                payload = {"ok": False, "error": {"code": decision["errorCode"], "message": decision["message"]}}
                messages.append(
                    ToolMessage(
                        content=json.dumps(payload, ensure_ascii=False),
                        tool_call_id=call_id,
                        name=decision["tool"],
                        status="error",
                    )
                )
                tool_results.append(
                    {"tool": decision["tool"], "ok": False, "error": payload["error"], "args": decision["args"]}
                )
                continue

            outcome = outcome_by_call.get(call_id)
            if outcome is None:
                payload = {
                    "ok": False,
                    "error": {
                        "code": str(AgentErrorCode.AGENT_ERROR),
                        "message": safe_message(AgentErrorCode.AGENT_ERROR),
                    },
                }
            else:
                payload = outcome.as_tool_message_payload()

            messages.append(
                ToolMessage(
                    content=json.dumps(payload, ensure_ascii=False)[:MAX_TOOL_PAYLOAD_CHARS],
                    tool_call_id=call_id,
                    name=decision["tool"],
                    status="success" if payload.get("ok") else "error",
                )
            )
            tool_results.append(
                {
                    "tool": decision["tool"],
                    "ok": bool(payload.get("ok")),
                    "data": (outcome.data if outcome else None) or {},
                    "citations": (outcome.citations if outcome else []) or [],
                    "meta": (outcome.meta if outcome else {}) or {},
                    "error": payload.get("error"),
                    "args": decision["args"],
                }
            )

        return {
            "messages": messages,
            "tool_results": list(state.get("tool_results") or []) + tool_results,
        }

    # ------------------------------------------------------------------- Finalize
    async def finalize(self, state: AgentState) -> dict[str, Any]:
        messages = state.get("messages") or []
        last = messages[-1] if messages else None
        text = ""
        if isinstance(last, AIMessage) and not getattr(last, "tool_calls", None):
            text = last.content if isinstance(last.content, str) else json.dumps(last.content, ensure_ascii=False)

        tool_results = state.get("tool_results") or []
        components = build_components(tool_results)
        citations = build_citations(tool_results)
        if not text.strip():
            text = fallback_text(components)

        actor = state["actor"]
        contract = ResponseContract(
            conversation_id=actor.conversation_id,
            correlation_id=get_correlation_id(),
            prompt_version=PROMPT_VERSION,
            text=text.strip(),
            components=components,
            citations=citations,
            agent_trace={
                "role": actor.role,
                "allowedTools": state.get("allowed_tools") or [],
                "preflight": state.get("preflight") or {},
                "decisions": state.get("decisions") or [],
                "toolMeta": [
                    {"tool": result.get("tool"), "ok": result.get("ok"), "meta": result.get("meta")}
                    for result in tool_results
                ],
            },
            error=state.get("error"),
        )
        return {"contract": contract.model_dump()}
