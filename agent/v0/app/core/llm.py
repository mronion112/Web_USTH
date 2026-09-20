"""LLM factory: 9router proxy qua giao thuc OpenAI-compatible."""

from __future__ import annotations

import logging

from langchain_openai import ChatOpenAI

from app.config import Settings

logger = logging.getLogger(__name__)


def build_chat_model(settings: Settings, *, max_tokens: int | None = None) -> ChatOpenAI:
    kwargs: dict = {
        "model": settings.llm_model,
        "base_url": settings.llm_base_url,
        "api_key": settings.llm_api_key or "not-needed",
        "temperature": settings.llm_temperature,
        "timeout": settings.llm_timeout_seconds,
        "max_retries": 1,
    }
    tokens = settings.llm_max_tokens if max_tokens is None else max_tokens
    if tokens and tokens > 0:
        kwargs["max_tokens"] = tokens

    logger.info(
        "khoi tao LLM",
        extra={"context": {"baseUrl": settings.llm_base_url, "model": settings.llm_model}},
    )
    return ChatOpenAI(**kwargs)
