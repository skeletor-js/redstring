"""Setup API endpoints for database initialization.

Provides endpoints to check setup status, run initial database setup,
and poll progress during data import.
"""

import logging
import threading
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import get_database_path
from database.schema import get_case_count, is_setup_complete
from services.data_loader import DataLoader

logger = logging.getLogger(__name__)

router = APIRouter(tags=["setup"])

# =============================================================================
# PROGRESS STATE (Thread-safe)
# =============================================================================


class ProgressState:
    """Thread-safe progress state for tracking setup progress."""

    def __init__(self):
        self._lock = threading.Lock()
        self.current = 0
        self.total = 894636
        self.stage = "idle"
        self.error: Optional[str] = None

    def update(self, current: int, total: int, stage: str) -> None:
        """Update progress state (thread-safe)."""
        with self._lock:
            self.current = current
            self.total = total
            self.stage = stage

    def set_error(self, error: str) -> None:
        """Set error state (thread-safe)."""
        with self._lock:
            self.error = error
            self.stage = "error"

    def reset(self) -> None:
        """Reset progress state (thread-safe)."""
        with self._lock:
            self.current = 0
            self.total = 894636
            self.stage = "idle"
            self.error = None

    def get_snapshot(self) -> dict:
        """Get current progress snapshot (thread-safe)."""
        with self._lock:
            percentage = (
                round((self.current / self.total) * 100, 1) if self.total > 0 else 0
            )
            return {
                "current": self.current,
                "total": self.total,
                "stage": self.stage,
                "percentage": percentage,
                "error": self.error,
            }


# Global progress state instance
progress_state = ProgressState()

# =============================================================================
# RESPONSE MODELS
# =============================================================================


class SetupStatusResponse(BaseModel):
    """Response model for setup status check."""

    initialized: bool
    record_count: int
    database_exists: bool


class SetupInitializeResponse(BaseModel):
    """Response model for setup initialization."""

    status: str
    message: str
    record_count: Optional[int] = None


class ProgressResponse(BaseModel):
    """Response model for progress polling."""

    current: int
    total: int
    stage: str
    percentage: float
    error: Optional[str] = None


# =============================================================================
# ENDPOINTS
# =============================================================================


@router.get("/setup/status", response_model=SetupStatusResponse)
async def get_setup_status():
    """Check if database has been initialized.

    Returns:
        SetupStatusResponse with initialization status and record count

    Example:
        GET /api/setup/status
        {
            "initialized": true,
            "record_count": 894636,
            "database_exists": true
        }
    """
    db_path = get_database_path()
    database_exists = db_path.exists()

    if not database_exists:
        return SetupStatusResponse(
            initialized=False, record_count=0, database_exists=False
        )

    try:
        initialized = is_setup_complete()
        record_count = get_case_count() if initialized else 0

        return SetupStatusResponse(
            initialized=initialized,
            record_count=record_count,
            database_exists=database_exists,
        )

    except Exception as e:
        logger.error(f"Error checking setup status: {e}", exc_info=True)
        return SetupStatusResponse(
            initialized=False, record_count=0, database_exists=database_exists
        )


@router.post("/setup/initialize", response_model=SetupInitializeResponse)
async def initialize_database():
    """Run first-time database setup.

    Executes the complete setup pipeline:
    1. Create database schema
    2. Import 894,636 CSV records
    3. Create indexes
    4. Mark setup as complete

    This is a blocking endpoint that may take 30-60 seconds to complete.
    Use /setup/progress to poll for status updates.

    Returns:
        SetupInitializeResponse with success/error status

    Raises:
        HTTPException: If setup is already complete or if setup fails

    Example:
        POST /api/setup/initialize
        {
            "status": "success",
            "message": "Database initialized successfully",
            "record_count": 894636
        }
    """
    # Check if already initialized
    if is_setup_complete():
        raise HTTPException(
            status_code=400, detail="Database is already initialized"
        )

    # Reset progress state
    progress_state.reset()

    try:
        logger.info("Starting database initialization via API...")

        # Create data loader with progress callback
        def progress_callback(current: int, total: int, stage: str) -> None:
            progress_state.update(current, total, stage)

        loader = DataLoader(progress_callback=progress_callback)

        # Run full setup
        loader.run_full_setup()

        record_count = get_case_count()

        logger.info(f"Database initialization complete. Records: {record_count}")

        return SetupInitializeResponse(
            status="success",
            message="Database initialized successfully",
            record_count=record_count,
        )

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Database initialization failed: {error_msg}", exc_info=True)
        progress_state.set_error(error_msg)

        raise HTTPException(
            status_code=500, detail=f"Setup failed: {error_msg}"
        )


@router.get("/setup/progress", response_model=ProgressResponse)
async def get_setup_progress():
    """Get current setup progress.

    Poll this endpoint during setup to get real-time progress updates.

    Returns:
        ProgressResponse with current progress state

    Example:
        GET /api/setup/progress
        {
            "current": 450000,
            "total": 894636,
            "stage": "importing",
            "percentage": 50.3,
            "error": null
        }
    """
    snapshot = progress_state.get_snapshot()

    return ProgressResponse(
        current=snapshot["current"],
        total=snapshot["total"],
        stage=snapshot["stage"],
        percentage=snapshot["percentage"],
        error=snapshot["error"],
    )
