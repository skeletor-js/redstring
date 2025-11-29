"""Path setup for backend tests - imported by conftest.py."""

import sys
from pathlib import Path

# Add the project root and backend directory to the Python path
project_root = Path(__file__).parent.parent.parent
backend_dir = project_root / "backend"

# Insert at the beginning to ensure our paths take precedence
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(backend_dir))