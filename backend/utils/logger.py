"""Logging configuration for Redstring backend.

Provides structured logging with:
- File logging with rotation (10MB max, 5 backups)
- Console logging for development
- Different log levels for dev/prod
- Timestamp and context information
"""

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional

from config import get_log_dir, settings


def setup_logger(
    name: str,
    log_file: Optional[str] = None,
    level: Optional[str] = None,
    console_output: bool = True,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
) -> logging.Logger:
    """Configure and return a logger with file and console handlers.

    Args:
        name: Logger name (usually __name__)
        log_file: Log file name (default: name.log)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        console_output: Whether to output to console (default: True)
        max_bytes: Maximum log file size before rotation (default: 10MB)
        backup_count: Number of backup files to keep (default: 5)

    Returns:
        Configured logger instance

    Example:
        >>> logger = setup_logger(__name__)
        >>> logger.info("Starting cluster analysis")
        >>> logger.error("Database connection failed", exc_info=True)
    """
    # Get or create logger
    logger = logging.getLogger(name)

    # Set log level
    log_level = level or settings.log_level
    logger.setLevel(getattr(logging, log_level.upper()))

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    # Create formatters
    file_formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_formatter = logging.Formatter(
        fmt="%(levelname)s - %(name)s - %(message)s"
    )

    # File handler with rotation
    if log_file is None:
        log_file = f"{name.replace('.', '_')}.log"

    log_dir = get_log_dir()
    log_path = log_dir / log_file

    try:
        file_handler = RotatingFileHandler(
            log_path,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding="utf-8",
        )
        file_handler.setLevel(logging.DEBUG)  # Log everything to file
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    except (OSError, IOError) as e:
        # If file logging fails, log to console only
        print(f"Warning: Could not create log file at {log_path}: {e}", file=sys.stderr)

    # Console handler (optional)
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, log_level.upper()))
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance.

    If the logger doesn't exist, it will be created with default settings.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Logger instance

    Example:
        >>> from utils.logger import get_logger
        >>> logger = get_logger(__name__)
        >>> logger.info("Processing request")
    """
    logger = logging.getLogger(name)

    # If logger has no handlers, configure it
    if not logger.handlers:
        return setup_logger(name)

    return logger


class LoggerAdapter(logging.LoggerAdapter):
    """Logger adapter that adds context to log records.

    Useful for adding request IDs, user IDs, or other contextual
    information to all log messages.

    Example:
        >>> logger = get_logger(__name__)
        >>> adapted = LoggerAdapter(logger, {"request_id": "abc123"})
        >>> adapted.info("Processing request")
        # Output: INFO - module - Processing request [request_id=abc123]
    """

    def process(self, msg, kwargs):
        """Add context to log message."""
        if self.extra:
            context = " ".join(f"[{k}={v}]" for k, v in self.extra.items())
            msg = f"{msg} {context}"
        return msg, kwargs


def log_exception(
    logger: logging.Logger,
    message: str,
    exception: Exception,
    level: int = logging.ERROR,
    **context,
) -> None:
    """Log an exception with context information.

    Args:
        logger: Logger instance
        message: Human-readable error message
        exception: Exception that occurred
        level: Log level (default: ERROR)
        **context: Additional context key-value pairs

    Example:
        >>> try:
        ...     result = divide(10, 0)
        ... except ZeroDivisionError as e:
        ...     log_exception(
        ...         logger,
        ...         "Division failed",
        ...         e,
        ...         numerator=10,
        ...         denominator=0
        ...     )
    """
    context_str = " ".join(f"{k}={v}" for k, v in context.items())
    full_message = f"{message} - {context_str}" if context else message

    logger.log(level, full_message, exc_info=exception)


def configure_root_logger() -> None:
    """Configure the root logger for the application.

    This should be called once at application startup.
    Sets up file and console logging with appropriate formatting.
    """
    log_level = settings.log_level.upper()
    log_dir = get_log_dir()
    log_file = log_dir / "redstring.log"

    # Root logger configuration
    logging.basicConfig(
        level=getattr(logging, log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            RotatingFileHandler(
                log_file,
                maxBytes=10 * 1024 * 1024,  # 10MB
                backupCount=5,
                encoding="utf-8",
            ),
            logging.StreamHandler(sys.stdout),
        ],
    )

    # Set log levels for third-party libraries to WARNING
    # (to reduce noise in logs)
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)

    logging.info(f"Root logger configured - Level: {log_level}, File: {log_file}")


# Convenience function for application startup
def init_logging() -> None:
    """Initialize logging for the application.

    This is the main entry point for logging setup.
    Call this once during application startup.

    Example:
        >>> from utils.logger import init_logging
        >>> init_logging()
    """
    configure_root_logger()


# Module-level logger for this file
module_logger = get_logger(__name__)
