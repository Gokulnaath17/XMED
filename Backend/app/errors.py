"""
app/errors.py
=============
Custom ApiError exception and FastAPI exception handlers.
Call register_error_handlers(app) in main.py to wire everything up.
"""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.models import ErrorResponse, model_dump


# ---------------------------------------------------------------------------
# Custom exception
# ---------------------------------------------------------------------------

class ApiError(Exception):
    """Raised anywhere in the app to produce a structured JSON error response."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        detail: Any = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.detail = detail
        super().__init__(message)


# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------

async def _api_error_handler(_: Any, exc: ApiError) -> JSONResponse:
    payload = ErrorResponse(code=exc.code, message=exc.message, detail=exc.detail)
    return JSONResponse(status_code=exc.status_code, content=model_dump(payload))


async def _validation_error_handler(_: Any, exc: RequestValidationError) -> JSONResponse:
    payload = ErrorResponse(
        code="INVALID_REQUEST",
        message="Request validation failed.",
        detail=exc.errors(),
    )
    return JSONResponse(status_code=422, content=model_dump(payload))


async def _http_exception_handler(_: Any, exc: StarletteHTTPException) -> JSONResponse:
    payload = ErrorResponse(code="HTTP_ERROR", message=str(exc.detail), detail=None)
    return JSONResponse(status_code=exc.status_code, content=model_dump(payload))


async def _unhandled_exception_handler(_: Any, exc: Exception) -> JSONResponse:
    payload = ErrorResponse(
        code="INTERNAL_ERROR",
        message="Unexpected server error.",
        detail=None,
    )
    return JSONResponse(status_code=500, content=model_dump(payload))


# ---------------------------------------------------------------------------
# Registration helper
# ---------------------------------------------------------------------------

def register_error_handlers(app: FastAPI) -> None:
    """Attach all exception handlers to a FastAPI application instance."""
    app.add_exception_handler(ApiError, _api_error_handler)                    # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, _validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _unhandled_exception_handler)
