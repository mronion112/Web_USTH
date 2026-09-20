"""LangGraph: mot graph tool-calling, khong tach subgraph theo role."""

from __future__ import annotations

from typing import Any

from langgraph.graph import END, START, StateGraph

from app.core.nodes import AgentDeps, LunaraNodes
from app.core.state import AgentState


def _route_after_agent(state: AgentState) -> str:
    if state.get("terminated"):
        return "finalize"
    messages = state.get("messages") or []
    if not messages:
        return "finalize"
    last = messages[-1]
    if getattr(last, "tool_calls", None):
        return "policy_guard"
    return "finalize"


def build_graph(deps: AgentDeps, checkpointer: Any):
    nodes = LunaraNodes(deps)
    graph = StateGraph(AgentState)

    graph.add_node("load_context", nodes.load_context)
    graph.add_node("agent", nodes.agent)
    graph.add_node("policy_guard", nodes.policy_guard)
    graph.add_node("execute_tool", nodes.execute_tool)
    graph.add_node("finalize", nodes.finalize)

    graph.add_edge(START, "load_context")
    graph.add_edge("load_context", "agent")
    graph.add_conditional_edges(
        "agent",
        _route_after_agent,
        {"policy_guard": "policy_guard", "finalize": "finalize"},
    )
    graph.add_edge("policy_guard", "execute_tool")
    graph.add_edge("execute_tool", "agent")
    graph.add_edge("finalize", END)

    return graph.compile(checkpointer=checkpointer)
