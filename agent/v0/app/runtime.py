"""Runtime container: khoi tao backend client, knowledge index, LLM, graph, checkpointer."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer

from app.clients.backend import BackendClient
from app.config import BASE_DIR, Settings, get_settings
from app.core.actor import ActorContext
from app.core.contract import ResponseContract
from app.core.errors import AgentError, AgentErrorCode
from app.core.graph import build_graph
from app.core.llm import build_chat_model
from app.core.nodes import AgentDeps
from app.core.policy import PolicyGuard
from app.core.typesafe import TypeSafeJudge
from app.knowledge.search import KnowledgeIndex
from app.tools.catalog import REGISTRY

logger = logging.getLogger(__name__)
CHANNEL_WEB = "WEB"
SYSTEM_PROMPT_PATH = BASE_DIR / "app" / "core" / "prompts" / "system_vi.md"


def _serializer() -> JsonPlusSerializer:
    """Khai bao tuong minh ActorContext duoc phep msgpack trong checkpoint.

    LangGraph mac dinh se chan cac type khong dang ky o ban sau, nen allowlist ngay tu v0.
    """
    return JsonPlusSerializer(allowed_msgpack_modules=[("app.core.actor", "ActorContext")])


@dataclass
class AgentRuntime:
    settings: Settings
    backend: BackendClient
    judge: TypeSafeJudge
    knowledge: KnowledgeIndex
    guard: PolicyGuard
    model: object
    graph: object
    checkpointer: InMemorySaver

    @classmethod
    def create(cls, settings: Settings | None = None, *, model_override=None, knowledge_dir: Path | None = None):
        settings = settings or get_settings()
        knowledge = KnowledgeIndex.from_path(
            knowledge_dir or settings.knowledge_path, include_draft=settings.knowledge_include_draft
        )
        model = model_override or build_chat_model(settings)
        deps = AgentDeps(
            settings=settings,
            guard=PolicyGuard(REGISTRY),
            judge=TypeSafeJudge(settings),
            knowledge=knowledge,
            registry=REGISTRY,
            model=model,
            prompt_template=SYSTEM_PROMPT_PATH.read_text(encoding="utf-8"),
            backend=BackendClient(settings),
        )
        checkpointer = InMemorySaver(serde=_serializer())
        graph = build_graph(deps, checkpointer)
        return cls(
            settings=settings,
            backend=deps.backend,
            judge=deps.judge,
            knowledge=knowledge,
            guard=deps.guard,
            model=model,
            graph=graph,
            checkpointer=checkpointer,
        )

    async def start(self) -> None:
        await self.backend.start()
        logger.info(
            "agent runtime san sang",
            extra={
                "context": {
                    "documents": len(self.knowledge.documents),
                    "typesafe": self.judge.enabled,
                    "model": self.settings.llm_model,
                }
            },
        )

    async def aclose(self) -> None:
        await self.backend.aclose()

    def _config(self, actor: ActorContext) -> dict:
        return {
            "configurable": {"thread_id": actor.thread_id()},
            "recursion_limit": self.settings.llm_max_tool_iterations * 4 + 10,
        }

    async def chat(self, actor: ActorContext, message: str) -> ResponseContract:
        config = self._config(actor)
        await self._ensure_thread_owner(actor, config)
        result = await self.graph.ainvoke({"actor": actor, "messages": [HumanMessage(content=message)]}, config)
        contract = result.get("contract")
        if not contract:
            raise AgentError(AgentErrorCode.AGENT_ERROR, detail="graph khong tra contract")
        return ResponseContract.model_validate(contract)

    async def _ensure_thread_owner(self, actor: ActorContext, config: dict) -> None:
        try:
            snapshot = await self.graph.aget_state(config)
        except Exception:  # thread moi hoac checkpointer chua co du lieu
            return
        existing = (snapshot.values or {}).get("actor")
        if existing is not None and getattr(existing, "account_id", None) not in (None, actor.account_id):
            logger.warning("tu choi truy cap hoi thoai cua tai khoan khac")
            raise AgentError(AgentErrorCode.OWNERSHIP_VIOLATION)

    async def reset(self, actor: ActorContext) -> bool:
        config = self._config(actor)
        await self._ensure_thread_owner(actor, config)
        thread_id = config["configurable"]["thread_id"]
        if hasattr(self.checkpointer, "delete_thread"):
            self.checkpointer.delete_thread(thread_id)
            return True
        return False
