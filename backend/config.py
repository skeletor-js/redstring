"""Configuration management for Redstring backend.

Provides centralized settings with environment variable support and
platform-specific path resolution for development and production environments.
"""

import os
import platform
import sys
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    api_title: str = "Redstring API"
    api_version: str = "0.1.0"
    host: str = "127.0.0.1"
    port: int = 5001
    port_range_start: int = 5001
    port_range_end: int = 5099
    log_level: str = "INFO"

    class Config:
        env_prefix = "REDSTRING_"


def get_app_data_dir() -> Path:
    """Returns platform-specific app data directory.

    Returns:
        Path to app data directory:
        - macOS: ~/Library/Application Support/Redstring
        - Windows: %APPDATA%/Redstring
        - Linux: ~/.local/share/Redstring
    """
    system = platform.system()
    if system == "Darwin":  # macOS
        return Path.home() / "Library/Application Support/Redstring"
    elif system == "Windows":
        appdata = os.environ.get("APPDATA", "")
        if not appdata:
            # Fallback for Windows
            return Path.home() / "AppData/Roaming/Redstring"
        return Path(appdata) / "Redstring"
    else:  # Linux
        return Path.home() / ".local/share/Redstring"


def get_data_path() -> Path:
    """Returns resources/data path (dev: repo, prod: bundled).

    Returns:
        Path to data directory containing CSV files.
        In development: <repo>/resources/data
        In production: <bundled>/resources/data
    """
    if getattr(sys, "frozen", False):
        # Production: bundled with app (PyInstaller sets sys._MEIPASS)
        return Path(sys._MEIPASS) / "resources" / "data"  # type: ignore
    else:
        # Development: relative to repo root
        return Path(__file__).parent.parent / "resources" / "data"


def get_database_path() -> Path:
    """Returns database file path.

    Creates the data directory if it doesn't exist.

    Returns:
        Path to homicides.db in app data directory.
    """
    db_dir = get_app_data_dir() / "data"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir / "homicides.db"


def get_log_dir() -> Path:
    """Returns log directory path.

    Creates the log directory if it doesn't exist.

    Returns:
        Path to logs directory in app data directory.
    """
    log_dir = get_app_data_dir() / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


# Global settings instance
settings = Settings()
