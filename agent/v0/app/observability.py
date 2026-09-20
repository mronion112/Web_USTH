"""Structured logging: JSON mot dong, co correlation id va che PII."""

from __future__ import annotations

import json
import logging
import re
import sys
import uuid
from collections.abc import Mapping
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any

_correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)

_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_PHONE_RE = re.compile(r"(?<!\d)(?:\+84|0)\d{8,10}(?!\d)")
_BEARER_RE = re.compile(r"(Bearer\s+)[A-Za-z0-9._\-]+", re.IGNORECASE)
_APIKEY_RE = re.compile(r"(sk-|apikey_)[A-Za-z0-9._\-]{8,}")


def new_correlation_id() -> str:
    return uuid.uuid4().hex[:16]


def set_correlation_id(value: str) -> str:
    _correlation_id.set(value)
    return value


def get_correlation_id() -> str:
    current = _correlation_id.get()
    if current is None:
        current = new_correlation_id()
        _correlation_id.set(current)
    return current


def redact(value: Any) -> Any:
    """Che email, so dien thoai va token truoc khi ghi log."""
    if isinstance(value, str):
        value = _BEARER_RE.sub(r"\1[redacted]", value)
        value = _APIKEY_RE.sub("[redacted-key]", value)
        value = _EMAIL_RE.sub("[redacted-email]", value)
        return _PHONE_RE.sub("[redacted-phone]", value)
    if isinstance(value, Mapping):
        return {key: redact(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [redact(item) for item in value]
    return value


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.now(UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": redact(record.getMessage()),
            "correlationId": get_correlation_id(),
        }
        extra = getattr(record, "context", None)
        if isinstance(extra, Mapping):
            payload.update(redact(dict(extra)))
        if record.exc_info:
            payload["exception"] = redact(self.formatException(record.exc_info))
        return json.dumps(payload, ensure_ascii=False)


def setup_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level.upper())
    for noisy in ("httpx", "httpcore", "openai", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def log_event(logger: logging.Logger, message: str, **context: Any) -> None:
    logger.info(message, extra={"context": context})
