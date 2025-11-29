"""Test package initialization - sets up Python path for imports."""
import sys
from pathlib import Path

# Add the project root and backend directory to the Python path
project_root = Path(__file__).parent.parent
backend_dir = project_root / "backend"

sys.path.insert(0, str(project_root))
sys.path.insert(0, str(backend_dir))