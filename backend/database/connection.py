"""Database connection management for Redstring.

Provides a context manager for SQLite connections with performance optimizations
and automatic transaction handling.
"""

import logging
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from config import get_database_path

logger = logging.getLogger(__name__)


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Get a database connection with performance optimizations.

    Provides a context manager that automatically handles commits, rollbacks,
    and connection cleanup. Configures SQLite with performance-optimized PRAGMAs.

    Yields:
        sqlite3.Connection: Database connection with row factory set to sqlite3.Row

    Example:
        with get_db_connection() as conn:
            result = conn.execute("SELECT * FROM cases LIMIT 10").fetchall()
            # Auto-commits on success, rollbacks on exception
    """
    db_path: Path = get_database_path()
    conn = sqlite3.connect(str(db_path))

    # Enable dict-like row access
    conn.row_factory = sqlite3.Row

    # Performance optimizations
    conn.execute("PRAGMA journal_mode = WAL")  # Write-Ahead Logging
    conn.execute("PRAGMA synchronous = NORMAL")  # 2-3x faster than FULL
    conn.execute("PRAGMA cache_size = -64000")  # 64MB cache
    conn.execute("PRAGMA temp_store = MEMORY")  # Temp tables in RAM
    conn.execute("PRAGMA busy_timeout = 30000")  # 30 sec timeout
    conn.execute("PRAGMA foreign_keys = ON")  # Enable FK constraints

    try:
        yield conn
        conn.commit()
    except Exception as e:
        logger.error(f"Database error, rolling back transaction: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()
