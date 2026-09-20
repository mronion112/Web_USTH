"""Chat CLI voi agent v0 (khong can mo browser).

Chay mot cau:
  uv run python -m scripts.chat_cli --email customer9@lunara-spa.demo --message "Cho toi xem dich vu massage"

Che do hoi thoai:
  uv run python -m scripts.chat_cli --token <jwt>
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys

import httpx

from app.config import get_settings
from scripts.dev_token import fetch_token


async def call_agent(base_url: str, token: str, message: str, conversation_id: str | None) -> dict:
    body: dict = {"message": message}
    if conversation_id:
        body["conversationId"] = conversation_id
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{base_url.rstrip('/')}/api/agent/chat",
            json=body,
            headers={"Authorization": f"Bearer {token}"},
        )
    if response.status_code >= 400:
        raise RuntimeError(f"HTTP {response.status_code}: {response.text[:400]}")
    return response.json()


def render(payload: dict) -> None:
    print("\n=== TRA LOI ===")
    print(payload.get("text"))
    components = payload.get("components") or []
    if components:
        print("\n=== COMPONENTS ===")
        for component in components:
            print(f"- {component['type']}: {json.dumps(component['data'], ensure_ascii=False)[:300]}")
    citations = payload.get("citations") or []
    if citations:
        print("\n=== CITATIONS ===")
        for citation in citations:
            flag = "" if citation.get("approved") else " (BAN NHAP)"
            print(f"- {citation['title']} v{citation['version']} [{citation['audience']}]{flag}")
    trace = payload.get("agentTrace") or {}
    preflight = trace.get("preflight") or {}
    if preflight:
        print(
            f"\n[trace] preflight={preflight.get('decision')} intent={preflight.get('intent')} "
            f"conf={preflight.get('intentConfidence')} bypass={preflight.get('bypass')} "
            f"sensitive={preflight.get('sensitiveData')} tools={trace.get('allowedTools')}"
        )


async def main() -> int:
    settings = get_settings()
    parser = argparse.ArgumentParser(description="Chat voi Lunara agent v0")
    parser.add_argument("--message", help="Tin nhan; bo trong de vao che do hoi thoai")
    parser.add_argument("--token", help="JWT Lunara")
    parser.add_argument("--email", help="Lay JWT bang dev-login voi email nay")
    parser.add_argument("--base-url", default=f"http://localhost:{settings.agent_port}")
    parser.add_argument("--conversation", default=None)
    args = parser.parse_args()

    if not args.token and not args.email:
        parser.error("Can --token hoac --email")

    token = args.token or (await fetch_token(args.email, settings.backend_base_url))["accessToken"]
    conversation_id = args.conversation

    if args.message:
        payload = await call_agent(args.base_url, token, args.message, conversation_id)
        render(payload)
        return 0

    print(f"Che do hoi thoai voi {args.base_url}. Go 'exit' de thoat.")
    while True:
        try:
            message = input("\nban> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return 0
        if not message:
            continue
        if message.lower() in {"exit", "quit", "thoat"}:
            return 0
        try:
            payload = await call_agent(args.base_url, token, message, conversation_id)
        except Exception as error:  # noqa: BLE001
            print(f"loi: {error}")
            continue
        conversation_id = payload.get("conversationId") or conversation_id
        render(payload)


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
