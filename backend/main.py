"""Redstring FastAPI application entry point.

Provides the main FastAPI application with health check endpoint,
CORS configuration for Electron renderer, and structured logging.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routes import cases, clusters, setup
from utils.logger import init_logging

# Initialize logging system with rotation and proper formatting
init_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events.

    Handles startup and shutdown events for the FastAPI application.
    """
    logger.info(f"Starting {settings.api_title} v{settings.api_version}")
    logger.info(f"Log level: {settings.log_level}")
    yield
    logger.info("Shutting down Redstring API")


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    description="Murder Accountability Project Case Analyzer",
    version=settings.api_version,
    lifespan=lifespan,
)

# CORS middleware for Electron renderer
# Electron renderer can be from any origin (file://, http://localhost:3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(setup.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(clusters.router)


@app.get("/health")
async def health_check():
    """Health check endpoint for Electron process monitoring.

    Returns:
        dict: Health status with service name and version
    """
    return {
        "status": "healthy",
        "service": "redstring-api",
        "version": settings.api_version,
    }


@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception):
    """Handle 404 Not Found errors.

    Args:
        request: The incoming request
        exc: The exception that was raised

    Returns:
        JSONResponse with 404 status code
    """
    logger.warning(
        f"404 Not Found: {request.method} {request.url.path}",
        extra={"method": request.method, "path": request.url.path},
    )
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found"},
    )


@app.exception_handler(500)
async def server_error_handler(request: Request, exc: Exception):
    """Handle 500 Internal Server Error.

    Args:
        request: The incoming request
        exc: The exception that was raised

    Returns:
        JSONResponse with 500 status code
    """
    logger.error(
        f"Internal server error: {request.method} {request.url.path} - {exc}",
        exc_info=True,
        extra={
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else None,
        },
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions.

    This is a catch-all handler for any exceptions not caught elsewhere.
    Logs the full error and returns a generic 500 response.

    Args:
        request: The incoming request
        exc: The exception that was raised

    Returns:
        JSONResponse with 500 status code
    """
    logger.error(
        f"Unhandled exception: {request.method} {request.url.path} - {exc}",
        exc_info=True,
        extra={
            "method": request.method,
            "path": request.url.path,
            "exception_type": type(exc).__name__,
        },
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again or contact support if the issue persists."
        },
    )
