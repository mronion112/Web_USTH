"""FastAPI app cho Lunara Assistant v0."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.chat import router as chat_router
from app.config import get_settings
from app.core.errors import AgentError, AgentErrorCode
from app.observability import get_correlation_id, log_event, new_correlation_id, set_correlation_id, setup_logging
from app.runtime import AgentRuntime

logger = logging.getLogger(__name__)

_STATUS_BY_CODE: dict[AgentErrorCode, int] = {
    AgentErrorCode.UNAUTHENTICATED: 401,
    AgentErrorCode.PERMISSION_DENIED: 403,
    AgentErrorCode.OWNERSHIP_VIOLATION: 403,
    AgentErrorCode.POLICY_DENIED: 403,
    AgentErrorCode.WRITE_NOT_ENABLED: 403,
    AgentErrorCode.RESOURCE_NOT_FOUND: 404,
    AgentErrorCode.INVALID_ARGUMENT: 400,
    AgentErrorCode.UNKNOWN_TOOL: 400,
    AgentErrorCode.RATE_LIMITED: 429,
    AgentErrorCode.DOWNSTREAM_UNAVAILABLE: 503,
    AgentErrorCode.AGENT_TIMEOUT: 504,
    AgentErrorCode.AGENT_ERROR: 500,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    setup_logging(settings.log_level)
    runtime = AgentRuntime.create(settings)
    await runtime.start()
    app.state.runtime = runtime
    try:
        yield
    finally:
        await runtime.aclose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Lunara Assistant v0",
        version="0.1.0",
        description="Agent core chi doc cho Web Chat (FastAPI + LangGraph + TypeSafe)",
        lifespan=lifespan,
    )

    @app.middleware("http")
    async def correlation_middleware(request: Request, call_next):
        correlation_id = request.headers.get("x-correlation-id") or new_correlation_id()
        set_correlation_id(correlation_id)
        response = await call_next(request)
        response.headers["X-Correlation-Id"] = correlation_id
        return response

    @app.exception_handler(AgentError)
    async def agent_error_handler(_request: Request, exc: AgentError) -> JSONResponse:
        status_code = _STATUS_BY_CODE.get(exc.code, 500)
        log_event(
            logger,
            "agent error",
            code=str(exc.code),
            status=status_code,
            detail=exc.detail,
        )
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "error": {"code": str(exc.code), "message": str(exc)},
                "correlationId": get_correlation_id(),
            },
        )

    app.include_router(chat_router)

    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict:
        return {"status": "ok", "env": settings.agent_env}

    @app.get("/readyz", tags=["health"])
    async def readyz(request: Request) -> JSONResponse:
        runtime: AgentRuntime = request.app.state.runtime
        checks = {
            "knowledgeDocuments": len(runtime.knowledge.documents),
            "typesafeEnabled": runtime.judge.enabled,
            "llmModel": settings.llm_model,
            "backendBaseUrl": settings.backend_base_url,
        }
        return JSONResponse(content={"status": "ready", "checks": checks})

    return app


app = create_app()
