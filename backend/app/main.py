import logging
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.routers.auth import router as auth_router
from app.routers.groups import router as groups_router
from app.routers.tags import router as tags_router
from app.routers.prompts import router as prompts_router
from app.routers.dashboard import router as dashboard_router
from app.core.config import CORS_ORIGINS, ENABLE_DOCS

app = FastAPI(
    title="PromptNest",
    version="1.0.0",
    description="PromptNest — personal AI prompt management platform.",
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_DOCS else None,
)

logger = logging.getLogger("promptnest.api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(tags_router)
app.include_router(prompts_router)
app.include_router(dashboard_router)


@app.middleware("http")
async def security_headers(request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    request.state.request_id = request_id
    started = perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled request error method=%s path=%s request_id=%s", request.method, request.url.path, request_id)
        raise
    duration_ms = (perf_counter() - started) * 1000
    logger.info("request method=%s path=%s status=%s duration_ms=%.2f request_id=%s", request.method, request.url.path, response.status_code, duration_ms, request_id)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.path in ("/docs", "/redoc"):
        # Swagger UI / ReDoc load assets from the jsDelivr CDN and use inline
        # init scripts, so the strict app CSP would blank the page. Relax it
        # only for these two documentation endpoints.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https://fastapi.tiangolo.com; "
            "worker-src 'self' blob:; "
            "frame-ancestors 'none'"
        )
    else:
        response.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'"
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


def error_payload(request: Request, code: str, message: str):
    return {"detail": message, "error": {"code": code, "message": message}, "request_id": getattr(request.state, "request_id", None)}


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    message = str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content=error_payload(request, "http_error", message), headers=exc.headers or {})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content=error_payload(request, "validation_error", "Request validation failed"))


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Database error request_id=%s", request.headers.get("X-Request-ID"))
    return JSONResponse(status_code=503, content=error_payload(request, "database_error", "Database operation failed"))


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server error request_id=%s", request.headers.get("X-Request-ID"))
    return JSONResponse(status_code=500, content=error_payload(request, "server_error", "Internal server error"))


@app.get("/")
def root():
    return {"message": "PromptNest backend is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"message": "Database connection successful"}
