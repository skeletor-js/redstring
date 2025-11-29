# Redstring Development Guide

This guide covers everything you need to contribute to Redstring, including setup, development workflow, testing, and deployment.

**Table of Contents**
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style & Standards](#code-style--standards)
- [Testing Strategy](#testing-strategy)
- [Building & Packaging](#building--packaging)
- [Debugging](#debugging)
- [Contributing Guidelines](#contributing-guidelines)

---

## Development Environment Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([download](https://nodejs.org/))
- **Python** 3.11 or higher ([download](https://www.python.org/))
- **Git** with Git LFS support ([download](https://git-lfs.github.com/))
- **npm** 9.x or higher (comes with Node.js)

### Clone and Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/redstring.git
cd redstring

# Install Git LFS (for large data files)
git lfs install
git lfs pull

# Install Node dependencies
npm install

# Install Python dependencies
cd backend
pip install -r requirements-dev.txt
cd ..
```

### Setting Up IDE

#### VS Code Recommended Extensions

For the best development experience, install these extensions:

- **ESLint** (`dbaeumer.vscode-eslint`) - Real-time linting
- **Prettier - Code formatter** (`esbenp.prettier-vscode`) - Code formatting
- **Python** (`ms-python.python`) - Python language support
- **Pylance** (`ms-python.vscode-pylance`) - Python type checking
- **React** (`dsznajder.es7-react-js-snippets`) - React snippets
- **Thunder Client** or **REST Client** - API testing

#### VS Code Settings

Add this to `.vscode/settings.json` for optimal development:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.python",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  },
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.linting.mypyEnabled": true
}
```

---

## Project Structure

### Directory Overview

```
redstring/
├── electron/                 # Electron main process (TypeScript)
│   ├── main.ts              # Electron app entry point
│   ├── preload.ts           # IPC bridge with context isolation
│   ├── python-manager.ts    # Python subprocess lifecycle
│   └── tsconfig.json        # TypeScript config for Electron
│
├── src/                      # React frontend (TypeScript)
│   ├── components/          # Feature-organized React components
│   │   ├── Layout/          # App shell, sidebar, header
│   │   ├── cases/           # Case table, detail modal, similar cases modal
│   │   ├── clusters/        # Cluster analysis UI
│   │   ├── filters/         # Filter controls
│   │   ├── map/             # Map visualization (Leaflet)
│   │   ├── timeline/        # Timeline visualization (Recharts)
│   │   └── statistics/      # Statistics dashboard
│   ├── hooks/               # Custom React hooks
│   │   ├── useCases.ts      # Query hook for cases
│   │   ├── useClusters.ts   # Query hook for clusters
│   │   ├── useSimilarity.ts # Query hook for similar cases
│   │   └── ...
│   ├── services/            # API client layer
│   │   ├── api.ts           # Axios instance and base config
│   │   ├── cases.ts         # Cases endpoints
│   │   ├── clusters.ts      # Clustering endpoints
│   │   ├── similarity.ts    # Similarity search endpoints
│   │   └── ...
│   ├── stores/              # Zustand state management
│   │   ├── filterStore.ts   # Filter selections (UI state)
│   │   ├── uiStore.ts       # Modal state, theme, etc.
│   │   └── ...
│   ├── types/               # TypeScript interfaces and types
│   │   ├── index.ts         # Common types
│   │   ├── api.ts           # API response types
│   │   └── ...
│   ├── App.tsx              # Root component
│   ├── index.tsx            # React entry point
│   └── index.css            # Global styles
│
├── backend/                  # Python FastAPI backend
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Configuration, paths, logging
│   ├── routes/              # API endpoints
│   │   ├── cases.py         # GET /api/cases, /api/cases/:id
│   │   ├── clusters.py      # POST /api/clusters/analyze, preflight, etc.
│   │   ├── similarity.py    # GET /api/similarity/find/:id
│   │   ├── setup.py         # POST /api/setup/initialize
│   │   ├── map.py           # GET /api/map/*
│   │   ├── timeline.py      # GET /api/timeline/*
│   │   ├── statistics.py    # GET /api/statistics/*
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── cluster_service.py # Clustering with tier system
│   │   ├── map_service.py     # Map aggregation
│   │   ├── timeline_service.py # Timeline aggregation
│   │   ├── statistics_service.py # Statistics dashboard
│   │   └── ...
│   ├── models/              # Pydantic data models
│   │   ├── case.py          # Case DTO
│   │   ├── cluster.py       # Cluster DTO with tier definitions
│   │   └── ...
│   ├── database/            # Database layer
│   │   ├── connection.py    # Connection manager
│   │   ├── schema.py        # SQLite schema creation
│   │   └── ...
│   ├── analysis/            # Analysis algorithms
│   │   ├── clustering.py    # Cluster detection algorithm
│   │   ├── similarity.py    # Case similarity scoring (7-factor)
│   │   └── ...
│   ├── pyproject.toml       # Python tooling configuration
│   ├── requirements.txt      # Production dependencies
│   └── requirements-dev.txt  # Development dependencies
│
├── tests/                    # Test suites
│   ├── frontend/            # Vitest + React Testing Library
│   │   ├── setup.ts         # Test environment configuration
│   │   ├── components/      # Component tests
│   │   └── hooks/           # Hook tests
│   └── backend/             # pytest
│       ├── conftest.py      # Fixtures and configuration
│       ├── test_analysis/   # Algorithm tests
│       ├── test_database/   # Database tests
│       ├── test_routes/     # API endpoint tests
│       └── test_services/   # Service layer tests
│
├── resources/               # Bundled data (Git LFS)
│   ├── data/                # CSV data files (894K+ records)
│   │   ├── Murder Data SHR65 2023.csv (312MB)
│   │   ├── UCR 2023 Data.csv (12MB)
│   │   ├── State FIPS Lookout.csv
│   │   ├── County FIPS Lookout.csv
│   │   └── US County Centroids.csv
│   └── docs/                # Reference PDFs
│       ├── Algorithm.pdf
│       └── Murder Accountability Project Definitions.pdf
│
├── docs/                    # Project documentation
│   ├── DEVELOPMENT.md       # This file
│   └── API.md               # API reference
│
├── build/                   # Electron builder resources
│   └── icon.png             # App icon
│
├── package.json             # Node.js dependencies & scripts
├── tsconfig.json            # Root TypeScript config
├── vite.config.ts           # Vite frontend build config
├── vitest.config.ts         # Vitest test config
├── .eslintrc.json           # ESLint configuration
├── .prettierrc               # Prettier configuration
├── .gitignore               # Git ignore patterns
└── README.md                # Quick start guide
```

### Key Files and Their Purposes

| File | Purpose |
|------|---------|
| `package.json` | Node.js project metadata, dependencies, and npm scripts |
| `vite.config.ts` | Vite build configuration for frontend (dev server, bundling) |
| `vitest.config.ts` | Vitest configuration for unit and component tests |
| `tsconfig.json` | Root TypeScript compiler options |
| `electron/tsconfig.json` | TypeScript config for Electron main process |
| `backend/pyproject.toml` | Python project metadata and tool configs (Black, isort, pytest, mypy) |
| `.eslintrc.json` | ESLint rules for JavaScript/TypeScript linting |
| `.prettierrc` | Prettier code formatter configuration |

### Frontend Architecture

**State Management:**
- **Zustand** (`stores/`) - UI state (filters, modals, theme)
- **TanStack Query** (via `hooks/`) - Server state (query results, clusters)

**Data Flow:**
1. User interacts with components
2. Component updates Zustand store (UI state)
3. Store change triggers API request via React Query hook
4. Hook fetches data from backend via `services/`
5. Results cached and displayed in component

**Component Organization:**
- Organized by feature (cases, clusters, filters)
- Each feature has its own directory with related components
- Shared utilities in `components/shared/`
- Type definitions in `types/`

### Backend Architecture

**Request Handling:**
1. HTTP request arrives at FastAPI app
2. Route handler in `routes/` validates input
3. Handler calls service layer in `services/`
4. Service constructs SQL query using `query_builder.py`
5. Database layer executes query and returns results
6. Results transformed to Pydantic model and returned

**Key Layers:**
- **Routes** - HTTP endpoint definitions and validation
- **Services** - Business logic (filtering, clustering, export)
- **Database** - SQL query execution and schema
- **Models** - Data validation and serialization
- **Analysis** - Algorithm implementations (similarity, geographic)

---

## Development Workflow

### Starting the Dev Environment

```bash
# Start both frontend (Vite dev server) and backend (FastAPI)
npm run dev

# This runs concurrently:
# - Backend: uvicorn on port 5000 with auto-reload
# - Frontend: Vite dev server on port 3000
```

The command output will show:
```
[BACKEND] Uvicorn running on http://127.0.0.1:5000
[ELECTRON] http://localhost:3000
```

Open http://localhost:3000 in your browser to view the app.

### Frontend Hot Reload

Vite provides instant hot module replacement (HMR):
- Save a React component → automatically updates in browser
- Save CSS → updates without full page reload
- Save state management → preserves app state

### Backend Hot Reload

FastAPI auto-reload via Uvicorn:
- Save a Python file → server restarts automatically
- Active connections may temporarily fail
- Refresh browser to reconnect

### Development Servers Details

**Frontend (Vite):**
- Default port: 3000
- Dev server: `http://localhost:3000`
- HMR enabled for instant updates
- Proxies API requests to `http://localhost:5000/api`

**Backend (FastAPI):**
- Default port: 5000
- API base: `http://localhost:5000`
- Swagger docs: `http://localhost:5000/docs`
- ReDoc docs: `http://localhost:5000/redoc`
- Health check: `http://localhost:5000/health`

### Running Tests

```bash
# Run all tests (frontend + backend)
npm test

# Run only frontend tests
npm run test:frontend

# Run only backend tests
npm run test:backend

# Run backend tests with coverage
cd backend && pytest --cov=. --cov-report=html

# Run specific test file
cd backend && pytest tests/backend/test_analysis/test_similarity.py

# Run tests matching pattern
cd backend && pytest -k "test_filter"

# Watch mode for frontend
npm run test:frontend -- --watch
```

### Code Quality

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Format code (JavaScript/TypeScript/CSS/Python)
npm run format

# Full format: runs both ESLint and Prettier/Black
npm run lint:fix && npm run format
```

### Before Committing

The following runs automatically via pre-commit hooks (husky + lint-staged):

```bash
# Staged files automatically formatted with:
# - ESLint (with --fix for TypeScript/JavaScript)
# - Prettier (for CSS)
# - Black & isort (for Python)
```

To skip hooks (not recommended):
```bash
git commit --no-verify
```

---

## Code Style & Standards

### TypeScript Guidelines

**Strict Mode** - Enabled in `tsconfig.json`:
```typescript
// ✅ DO: Provide type annotations
function calculateDistance(lat1: number, lon1: number): number {
  return Math.sqrt(lat1 * lon1);
}

// ❌ DON'T: Implicit any
function calculateDistance(lat1, lon1) {
  return Math.sqrt(lat1 * lon1);
}
```

**No Unused Variables** - Enforced by ESLint:
```typescript
// ✅ DO: Use all parameters
const [filter, setFilter] = useState<FilterState>(initialState);

// ❌ DON'T: Unused variable
const [filter, _] = useState<FilterState>(initialState);

// ✅ DO: Use underscore prefix for intentionally unused params
const handler = (_event: Event) => {
  console.log('Event occurred');
};
```

**Imports** - Organized and deduplicated:
```typescript
// ✅ DO: Group and alphabetize
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCases } from '../services/casesApi';
import type { Case } from '../types';

// ❌ DON'T: Multiple imports from same module
import { useState } from 'react';
import { useEffect } from 'react';
```

### ESLint Configuration

Rules enforced in `.eslintrc.json`:
- `@typescript-eslint/no-unused-vars` - Warns on unused variables (args starting with `_` ignored)
- `@typescript-eslint/no-explicit-any` - Warns on `any` type usage
- `react/react-in-jsx-scope` - Disabled (React 17+)
- `react-hooks/rules-of-hooks` - Enforced via plugin

### Prettier Configuration

Settings in `.prettierrc`:
```json
{
  "semi": false,           // No semicolons
  "singleQuote": true,     // Use single quotes
  "tabWidth": 2,           // 2-space indentation
  "trailingComma": "es5",  // Trailing commas where valid
  "printWidth": 88,        // Match Black's line length
  "arrowParens": "always"  // Always include parens in arrow functions
}
```

### Python Code Style

**Black Formatting** - Line length 88 (configured in `backend/pyproject.toml`):
```python
# ✅ DO: Use Black formatting
def calculate_multi_factor_similarity(
    case_1: dict, case_2: dict, weights: dict
) -> float:
    """Calculate weighted similarity between two cases."""
    return sum(
        weights.get(factor, 1.0) * _calculate_factor(case_1, case_2, factor)
        for factor in weights.keys()
    )


# ❌ DON'T: Exceed line length
def calculate_multi_factor_similarity(case_1: dict, case_2: dict, weights: dict) -> float:
    return sum(weights.get(factor, 1.0) * _calculate_factor(case_1, case_2, factor) for factor in weights.keys())
```

**isort** - Import organization (Black-compatible profile):
```python
# ✅ DO: Standard library, then third-party, then local
import json
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI
from sqlalchemy import create_engine

from .database import query_builder
from .models import Case
```

**Type Hints** - Required (mypy strict mode in `pyproject.toml`):
```python
# ✅ DO: Always provide type hints
def get_cases(
    state: str, min_year: int, max_year: int
) -> list[Case]:
    """Fetch cases matching criteria."""
    query = "SELECT * FROM cases WHERE state = ? AND year BETWEEN ? AND ?"
    return [Case(**row) for row in connection.execute(query, (state, min_year, max_year))]


# ❌ DON'T: Omit return type
def get_cases(state, min_year, max_year):
    query = "SELECT * FROM cases WHERE state = ? AND year BETWEEN ? AND ?"
    return [Case(**row) for row in connection.execute(query, (state, min_year, max_year))]
```

### Git Commit Message Conventions

Commits should follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring without functional changes
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependencies, etc.

**Examples:**
```bash
git commit -m "feat(clustering): add multi-factor similarity calculation"
git commit -m "fix(database): resolve race condition in concurrent queries"
git commit -m "docs(development): add debugging section"
git commit -m "test(cases): add test coverage for filter validation"
```

---

## Testing Strategy

### Frontend Testing

**Framework:** Vitest + React Testing Library

**Configuration:** `vitest.config.ts`
- Environment: jsdom (DOM simulation)
- Globals: true (describe, it, expect available without imports)
- Coverage: c8 reporter with HTML output

**Writing Component Tests:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseTable } from '../components/cases/CaseTable';

describe('CaseTable', () => {
  it('renders table header', () => {
    render(<CaseTable cases={[]} />);
    expect(screen.getByText('Case ID')).toBeInTheDocument();
  });

  it('displays case rows', () => {
    const mockCases = [
      { id: '1', year: 2020, state: 'NY', ... },
    ];
    render(<CaseTable cases={mockCases} />);
    expect(screen.getByText('2020')).toBeInTheDocument();
  });

  it('handles row click', () => {
    const onSelect = vi.fn();
    render(<CaseTable cases={mockCases} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('2020'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

**Running Frontend Tests:**

```bash
# Run all frontend tests
npm run test:frontend

# Watch mode for active development
npm run test:frontend -- --watch

# Coverage report
npm run test:frontend -- --coverage

# Specific test file
npm run test:frontend -- src/components/cases/__tests__/CaseTable.test.tsx

# Match test name pattern
npm run test:frontend -- -t "renders table"
```

**Coverage Targets:**
- Target: 80%+ coverage
- Critical paths: 95%+ (API integration, state management)
- Nice-to-have: 70%+ (utilities, helpers)

### Backend Testing

**Framework:** pytest with pytest-cov

**Configuration:** `backend/pyproject.toml`
- Test directory: `../tests/backend`
- Auto-discovery: `test_*.py` files
- Coverage: HTML + terminal reports

**Writing Backend Tests:**

```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import Case

client = TestClient(app)


class TestCasesAPI:
    """Tests for /api/cases endpoints"""

    def test_get_cases_returns_list(self):
        """GET /api/cases returns list of cases"""
        response = client.get("/api/cases")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_cases_filters_by_state(self):
        """GET /api/cases?state=NY filters by state"""
        response = client.get("/api/cases?state=NY")
        assert response.status_code == 200
        data = response.json()
        assert all(case["state"] == "NY" for case in data)

    @pytest.mark.parametrize("year", [2020, 2021, 2022])
    def test_get_cases_filters_by_year(self, year):
        """GET /api/cases filters by multiple years"""
        response = client.get(f"/api/cases?year={year}")
        assert response.status_code == 200
```

**Database Fixtures:**

```python
# tests/backend/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def db_connection():
    """Provides in-memory SQLite database for tests"""
    engine = create_engine("sqlite:///:memory:")
    # Create schema
    from backend.database.schema import create_tables
    create_tables(engine)

    connection = engine.connect()
    yield connection
    connection.close()
```

**Running Backend Tests:**

```bash
# Run all backend tests
npm run test:backend

# Specific test file
cd backend && pytest tests/backend/test_analysis/test_similarity.py

# Specific test class
cd backend && pytest tests/backend/test_routes/test_cases.py::TestCasesAPI

# Specific test function
cd backend && pytest tests/backend/test_routes/test_cases.py::TestCasesAPI::test_get_cases_returns_list

# Watch mode (requires pytest-watch)
cd backend && pytest-watch

# With coverage report
cd backend && pytest --cov=. --cov-report=html --cov-report=term
```

**Coverage Targets:**
- Target: 90%+ coverage
- Critical paths: 100% (clustering, queries, data transformation)
- API endpoints: 95%+ (all status codes, error cases)

### Test Organization

```
tests/
├── frontend/
│   ├── setup.ts                    # Vitest configuration
│   ├── components/                 # Component tests
│   │   ├── __tests__/
│   │   │   ├── CaseTable.test.tsx
│   │   │   ├── ClusterResults.test.tsx
│   │   │   └── FilterPanel.test.tsx
│   └── hooks/                      # Hook tests
│       └── __tests__/
│           ├── useCases.test.ts
│           └── useClusters.test.ts
└── backend/
    ├── conftest.py                 # Shared fixtures
    ├── test_analysis/              # Algorithm tests
    │   ├── test_similarity.py
    │   └── test_geographic.py
    ├── test_database/              # Database layer tests
    │   ├── test_connection.py
    │   └── test_schema.py
    ├── test_routes/                # API endpoint tests
    │   ├── test_cases.py
    │   ├── test_clusters.py
    │   └── test_stats.py
    └── test_services/              # Service layer tests
        ├── test_query_builder.py
        └── test_clustering.py
```

---

## Building & Packaging

### Development Build

```bash
# Create a dev build (no optimization)
npm run build:frontend

# Builds to dist/
# Fast build time
# Source maps for debugging
```

### Production Build

```bash
# Full production build with Electron packaging
npm run build

# Steps:
# 1. Compile TypeScript (frontend + electron)
# 2. Build frontend with Vite (minified, optimized)
# 3. Run electron-builder to create installers
```

### Packaging for Different Platforms

**macOS (.dmg):**
```bash
npm run package:mac
# Output: release/Redstring-0.1.0.dmg
```

**Windows (.exe/.msi):**
```bash
npm run package:win
# Output: release/Redstring-Setup-0.1.0.exe
```

**Linux (.AppImage/.deb):**
```bash
npm run package:linux
# Output: release/Redstring-0.1.0.AppImage
```

**All Platforms:**
```bash
npm run package
# Creates installers for current platform
```

### Build Configuration

**Electron Builder Config** (in `package.json`):
- App ID: `com.redstring.app`
- Bundles: Frontend React build + Python backend
- Resources: CSV data included in package
- Target formats: DMG (macOS), NSIS/MSI (Windows), AppImage/DEB (Linux)

**Frontend Build** (Vite in `vite.config.ts`):
- React plugin enabled
- Path alias: `@` → `src/`
- CSS minification
- JavaScript minification with Terser

**Python Backend Packaging** (PyInstaller):
- Currently used for building standalone Python executable
- Config: `backend/build.spec`
- Bundled into Electron app in production

### Debugging Builds

```bash
# Analyze bundle size
npm run build:frontend -- --debug

# Check what's included
ls -lh dist/

# View build output
npm run build 2>&1 | tee build.log
```

---

## Debugging

### Frontend Debugging

**React DevTools:**
1. Install React DevTools extension for Chrome/Firefox
2. Open DevTools in dev environment
3. Go to "Components" tab to inspect React component tree
4. Check props, state, hooks in real-time

**Chrome DevTools:**
```
1. Open dev server (http://localhost:3000)
2. Press F12 or Cmd+Option+I
3. Use Console, Sources, Network, Elements tabs
```

**VS Code Debugger:**

Add `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverride": {
        "webpack:///./*": "${webspaceFolder}/*"
      }
    }
  ]
}
```

**Console Logging:**
```typescript
// In React components
console.log('Current filter state:', filters);
console.warn('API request failed:', error);
console.error('Critical error:', error);

// Use debugger statement
const handleFilter = (state: FilterState) => {
  debugger; // Execution pauses here in DevTools
  setFilters(state);
};
```

### Backend Debugging

**FastAPI Swagger UI:**
1. Navigate to `http://localhost:5000/docs`
2. Interactive API documentation and testing
3. Try out endpoints directly in browser

**Python Debugger (pdb):**

```python
# In backend code
import pdb

def complex_calculation(a, b):
    pdb.set_trace()  # Execution pauses here
    result = a + b
    return result
```

Commands in pdb:
- `n` - Next line
- `s` - Step into function
- `c` - Continue
- `p variable` - Print variable
- `l` - List source code

**VS Code Python Debugger:**

Add `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "backend.main:app",
        "--reload",
        "--port",
        "5000"
      ],
      "jinja": true,
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

**Logging:**

```python
import logging

logger = logging.getLogger(__name__)

@app.get("/api/cases")
def get_cases(state: str = None):
    logger.info(f"Fetching cases for state: {state}")
    try:
        cases = database.query_cases(state)
        logger.debug(f"Found {len(cases)} cases")
        return cases
    except Exception as e:
        logger.error(f"Query failed: {e}", exc_info=True)
        raise
```

### Electron Debugging

**DevTools in App:**

During development, Electron includes DevTools. Press:
- Windows/Linux: `Ctrl+Shift+I`
- macOS: `Cmd+Option+I`

**Main Process Debugging:**

```typescript
// In electron/main.ts
console.log('Electron app starting...');
console.log('Python path:', pythonManager.pythonPath);
```

Check console output in terminal where `npm run dev` is running.

### Common Issues and Solutions

**Issue: Frontend can't connect to backend**
```
Error: GET http://localhost:5000/api/cases net::ERR_CONNECTION_REFUSED
```

Solutions:
1. Ensure backend is running: `npm run dev:backend`
2. Check port 5000 is not in use: `lsof -i :5000`
3. Verify proxy config in `vite.config.ts`

**Issue: Hot reload not working**
```
Frontend changes not appearing in browser
```

Solutions:
1. Check Vite server running: `npm run dev:electron`
2. Try hard refresh: `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows)
3. Check `vite.config.ts` HMR settings

**Issue: Tests timeout**
```
FAIL test.ts (5000 ms timeout)
```

Solutions:
1. Increase timeout: `it('test', async () => {...}, 10000)`
2. Check for unresolved promises
3. Use `beforeEach` to setup/cleanup properly

**Issue: Database locked error**
```
sqlite3.OperationalError: database is locked
```

Solutions:
1. Ensure only one process accessing database
2. Check for unclosed connections in code
3. Restart backend: `npm run dev:backend`

---

## Contributing Guidelines

### Branching Strategy

We use GitHub Flow:

```bash
# 1. Create a feature branch
git checkout -b feat/clustering-improvements
git checkout -b fix/query-performance
git checkout -b docs/add-api-guide

# 2. Make commits (see commit conventions above)
git commit -m "feat(clustering): optimize similarity calculation"
git commit -m "fix(database): resolve N+1 query problem"

# 3. Push and create pull request
git push origin feat/clustering-improvements
# Go to GitHub and create PR against main
```

**Branch Naming:**
- Feature: `feat/description`
- Bug fix: `fix/description`
- Documentation: `docs/description`
- Refactoring: `refactor/description`
- Performance: `perf/description`

### Pull Request Process

1. **Create PR with descriptive title:**
   ```
   feat(clustering): implement weighted multi-factor similarity
   ```

2. **Fill out PR template:**
   ```markdown
   ## Description
   Briefly describe what this PR does.

   ## Changes
   - Implemented multi-factor similarity calculation
   - Added geographic distance weighting
   - Updated clustering API response

   ## Testing
   - Added 15 new unit tests
   - Tested with sample dataset (10K+ records)
   - Verified performance < 5 seconds

   ## Checklist
   - [ ] Tests pass locally (`npm test`)
   - [ ] Linting passes (`npm run lint`)
   - [ ] Code formatted (`npm run format`)
   - [ ] Documentation updated
   - [ ] No console warnings/errors
   ```

3. **Review Checklist:**
   - Code follows style guide
   - Tests included for new functionality
   - No hardcoded values (use config)
   - Performance acceptable
   - Documentation complete

4. **Merge:**
   - Requires passing CI checks
   - At least 1 approval
   - All conversations resolved

### Code Review Checklist

When reviewing pull requests, check:

**Functionality:**
- [ ] Feature works as described
- [ ] Edge cases handled
- [ ] Error handling appropriate
- [ ] Performance acceptable

**Code Quality:**
- [ ] TypeScript/Python types correct
- [ ] No unused variables
- [ ] Code follows style guide
- [ ] Functions have single responsibility
- [ ] Comments explain why, not what

**Testing:**
- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Coverage meets targets (80%+ frontend, 90%+ backend)
- [ ] Tests are deterministic (no flakes)

**Documentation:**
- [ ] JSDoc/docstrings provided
- [ ] README updated if needed
- [ ] Commit messages clear
- [ ] Breaking changes documented

### Documentation Requirements

For new features or significant changes:

1. **Code Comments:**
   ```typescript
   /**
    * Calculate weighted similarity between two cases
    * @param case1 - First case object
    * @param case2 - Second case object
    * @param weights - Factor weights for calculation
    * @returns Similarity score 0-1
    */
   function calculateSimilarity(
     case1: Case,
     case2: Case,
     weights: Record<string, number>
   ): number {
     // Implementation...
   }
   ```

2. **Update IMPLEMENTATION_PLAN.md** if affecting roadmap

3. **Update CLAUDE.md** if affecting architecture/approach

4. **Add docstring to API endpoints:**
   ```python
   @app.get("/api/cases")
   def get_cases(state: str = None, year: int = None):
       """
       Retrieve cases with optional filtering.

       Query Parameters:
           state: State FIPS code (optional)
           year: Year of incident (optional)

       Returns:
           List of Case objects matching criteria
       """
   ```

### Performance Benchmarks

Before submitting PR with performance-critical changes:

```bash
# Profile database queries
cd backend && python -m cProfile main.py

# Check bundle size
npm run build:frontend -- --debug

# Memory usage during clustering
# (use py-spy for production profiling)
```

Target performance:
- Single filter query: < 500ms
- Multi-filter query: < 2 seconds
- Cluster analysis: < 5 seconds
- App startup: < 3 seconds

### Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Create commit: `chore(release): v0.1.0`
4. Create tag: `git tag v0.1.0`
5. Push and create GitHub Release
6. Build and upload packages:
   ```bash
   npm run package:mac
   npm run package:win
   npm run package:linux
   ```

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev                 # Start frontend + backend
npm run dev:frontend        # Frontend only
npm run dev:backend         # Backend only

# Testing
npm test                    # All tests
npm run test:frontend       # Frontend tests only
npm run test:backend        # Backend tests only

# Code Quality
npm run lint                # Check linting
npm run lint:fix            # Auto-fix linting
npm run format              # Format code

# Building
npm run build               # Full build
npm run build:frontend      # Frontend only
npm run package:mac         # Create macOS .dmg
npm run package:win         # Create Windows installer
npm run package:linux       # Create Linux packages
```

### Environment Variables

Create `.env` in project root for development:

```bash
# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:5000

# Backend (FastAPI)
PYTHON_ENV=development
DATABASE_PATH=./data/homicides.db
LOG_LEVEL=INFO
```

### Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Frontend (Vite) | 3000 | React dev server |
| Backend (FastAPI) | 5000 | API server |
| Backend (Swagger) | 5000/docs | Interactive API docs |

### Useful Links

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Zustand Documentation](https://zustand-demo.vercel.app)
- [TanStack Query Documentation](https://tanstack.com/query)

---

**Last Updated:** November 2024

For questions or issues, refer to [CLAUDE.md](../CLAUDE.md) for project context or [redstring PRD.md](../redstring%20PRD.md) for detailed specifications.
