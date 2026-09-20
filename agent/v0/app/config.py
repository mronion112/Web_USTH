"""Cau hinh agent v0. Doc tu agent/v0/.env qua pydantic-settings."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
PROMPT_VERSION = "v0.1"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LLM - 9router proxy (OpenAI-compatible)
    llm_base_url: str = "http://localhost:20128/v1"
    llm_api_key: str = ""
    llm_model: str = "cx/gpt-5.6-sol"
    llm_timeout_seconds: float = 60.0
    llm_max_tokens: int = 2000
    llm_temperature: float = 0.2
    llm_max_tool_iterations: int = 6

    # TypeSafe
    typesafe_enabled: bool = True
    typesafe_api_key: str = ""
    typesafe_model: str = "jev-latest"
    typesafe_timeout_seconds: float = 20.0

    # Spring Backend
    backend_base_url: str = "http://localhost:8080"
    backend_timeout_seconds: float = 10.0
    backend_max_retries: int = 2

    # Agent service
    agent_port: int = 8090
    agent_env: str = "local"
    agent_timezone: str = "Asia/Ho_Chi_Minh"
    log_level: str = "INFO"

    # Knowledge
    knowledge_dir: Path = BASE_DIR / "app" / "data" / "knowledge"
    knowledge_include_draft: bool = True
    knowledge_max_results: int = 5

    # Gioi han tool
    max_date_range_days: int = 31
    max_page_size: int = 50
    max_query_chars: int = 200

    @property
    def knowledge_path(self) -> Path:
        raw = self.knowledge_dir
        return raw if raw.is_absolute() else (BASE_DIR / raw)

    @property
    def llm_configured(self) -> bool:
        return bool(self.llm_base_url and self.llm_model)

    @property
    def typesafe_configured(self) -> bool:
        return bool(self.typesafe_enabled and self.typesafe_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
