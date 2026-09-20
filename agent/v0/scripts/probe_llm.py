"""Probe 9router: kiem tra /v1/models va kha nang tool-calling.

Chay: uv run python -m scripts.probe_llm
"""

from __future__ import annotations

import asyncio
import json
import sys

import httpx
from langchain_core.messages import HumanMessage

from app.config import get_settings
from app.core.llm import build_chat_model

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Tra ve thoi tiet hien tai cua mot thanh pho",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string", "description": "Ten thanh pho"}},
                "required": ["city"],
            },
        },
    }
]


async def main() -> int:
    settings = get_settings()
    base_url = settings.llm_base_url.rstrip("/")
    print(f"[1/3] GET {base_url}/models")
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{base_url}/models", headers={"Authorization": f"Bearer {settings.llm_api_key}"}
        )
        print(f"      status={response.status_code}")
        if response.status_code == 200:
            try:
                payload = response.json()
                ids = [item.get("id") for item in (payload.get("data") or [])]
                print(f"      models={ids[:10]}")
            except ValueError:
                print(f"      body={response.text[:200]}")

    model = build_chat_model(settings)
    print(f"[2/3] chat completion voi model {settings.llm_model}")
    reply = await model.ainvoke([HumanMessage(content="Tra loi ngan: 2+2 bang may?")])
    print(f"      content={str(reply.content)[:200]!r}")

    print("[3/3] tool-calling round-trip")
    bound = model.bind_tools(TOOLS)
    message = await bound.ainvoke([HumanMessage(content="Thoi tiet o Ha Noi hom nay the nao?")])
    tool_calls = getattr(message, "tool_calls", None) or []
    print(f"      tool_calls={json.dumps(tool_calls, ensure_ascii=False)}")

    if not tool_calls:
        print("KET QUA: proxy KHONG tra tool_calls -> can ke hoach JSON-mode cho core/llm.py")
        return 1

    print("KET QUA: 9router hoat dong va ho tro tool-calling")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
