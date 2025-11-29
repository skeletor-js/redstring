# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller build specification for Redstring backend.

This spec file bundles the FastAPI backend into a standalone executable
for distribution with the Electron app.

Build command:
    pyinstaller build.spec

Output:
    dist/backend (macOS/Linux) or dist/backend.exe (Windows)
"""

import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Get the backend directory (where this spec file is located)
backend_dir = os.path.dirname(os.path.abspath(SPEC))

# Get the project root (parent of backend)
project_root = os.path.dirname(backend_dir)

# Path to resources/data directory (CSV files)
resources_data_dir = os.path.join(project_root, 'resources', 'data')

block_cipher = None

# Collect all local modules
local_modules = [
    'config',
    'routes',
    'routes.cases',
    'routes.clusters',
    'routes.setup',
    'models',
    'models.case',
    'models.cluster',
    'database',
    'database.connection',
    'database.schema',
    'database.queries',
    'database.queries.cases',
    'analysis',
    'analysis.clustering',
    'utils',
    'utils.logger',
    'utils.mappings',
    'utils.geo',
]

# Hidden imports for packages that use dynamic imports
hidden_imports = [
    # FastAPI and dependencies
    'fastapi',
    'fastapi.encoders',
    'fastapi.responses',
    'fastapi.middleware',
    'fastapi.middleware.cors',
    'fastapi.routing',
    'fastapi.staticfiles',

    # Uvicorn
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',

    # Pydantic
    'pydantic',
    'pydantic.deprecated',
    'pydantic.deprecated.class_validators',
    'pydantic.deprecated.decorator',
    'pydantic_settings',
    'pydantic_core',

    # Starlette (FastAPI dependency)
    'starlette',
    'starlette.applications',
    'starlette.routing',
    'starlette.middleware',
    'starlette.middleware.cors',
    'starlette.responses',
    'starlette.requests',

    # Standard library modules that might be missed
    'sqlite3',
    'csv',
    'json',
    'logging',
    'logging.handlers',
    'multiprocessing',

    # Data science libraries
    'pandas',
    'numpy',
    'sklearn',
    'sklearn.cluster',
]

# Combine local modules with hidden imports
all_hidden_imports = local_modules + hidden_imports

# Data files to include (CSV files from resources/data)
datas = [
    (resources_data_dir, 'resources/data'),
]

# Collect data files from packages if needed
# datas += collect_data_files('fastapi')

a = Analysis(
    ['run.py'],
    pathex=[backend_dir],
    binaries=[],
    datas=datas,
    hiddenimports=all_hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude test modules to reduce size
        'pytest',
        'unittest',
        'test',
        'tests',
        # Exclude development tools
        'IPython',
        'jupyter',
        'notebook',
        # Exclude unnecessary GUI libraries
        'tkinter',
        'matplotlib',
        'PIL',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Console mode for backend server
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
