"""Lay JWT Lunara cho tai khoan seed (chi dung khi backend bat dev-login).

Chay: uv run python -m scripts.dev_token --email customer9@lunara-spa.demo
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys

import httpx

from app.config import get_settings


async def fetch_token(email: str, base_url: str) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(f"{base_url.rstrip('/')}/api/auth/dev-login", json={"email": email})
    response.raise_for_status()
    payload = response.json()
    return payload.get("data") or payload


async def main() -> int:
    parser = argparse.ArgumentParser(description="Lay JWT dev cho Lunara backend")
    parser.add_argument("--email", required=True, help="Email tai khoan seed")
    parser.add_argument("--backend", default=None, help="Mac dinh lay tu BACKEND_BASE_URL")
    parser.add_argument("--json", action="store_true", help="In ca refresh token")
    args = parser.parse_args()

    settings = get_settings()
    tokens = await fetch_token(args.email, args.backend or settings.backend_base_url)

    if not tokens.get("accessToken"):
        print(f"Khong lay duoc accessToken: {json.dumps(tokens, ensure_ascii=False)[:300]}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(tokens, ensure_ascii=False))
    else:
        print(tokens["accessToken"])
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
