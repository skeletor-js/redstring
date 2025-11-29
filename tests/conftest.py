"""Root conftest.py for all tests.

Sets up Python path for backend imports.
"""

import sys
from pathlib import Path

# Add the project root and backend directory to the Python path
project_root = Path(__file__).parent.parent
backend_dir = project_root / "backend"

# Insert at the beginning to ensure our paths take precedence
# We need both paths: project_root for 'backend.x' imports and backend_dir for 'analysis.x' imports
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(backend_dir))