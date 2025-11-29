"""
Entry point for PyInstaller-bundled Redstring backend.

This script is used as the entry point when building with PyInstaller.
It starts the uvicorn server with the FastAPI application.
"""

import sys
import uvicorn

from main import app  # Import the FastAPI app directly
from config import settings


def main():
    """Start the uvicorn server."""
    # Parse command line arguments
    host = "127.0.0.1"
    port = 5001

    # Parse --host and --port from command line
    for i, arg in enumerate(sys.argv):
        if arg == "--host" and i + 1 < len(sys.argv):
            host = sys.argv[i + 1]
        elif arg == "--port" and i + 1 < len(sys.argv):
            port = int(sys.argv[i + 1])

    print(f"[Backend] Starting uvicorn server on {host}:{port}")

    # Start uvicorn with the FastAPI app object (not a string)
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
