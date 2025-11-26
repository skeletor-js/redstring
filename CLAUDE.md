# Claude Code Context - Redstring

## Project Overview

**Redstring** is a desktop application for analyzing homicide data from the Murder Accountability Project (MAP). It helps researchers, journalists, and analysts explore 894,636 homicide records (1976-2023) to identify suspicious clusters of unsolved murders.

**Status**: MVP Phase 1 - Phase 5 complete (Clustering Analysis ready)
**Version**: 0.1.0
**License**: MIT

## Tech Stack

**Frontend**: Electron 28 + React 18 + TypeScript + Vite
**Backend**: Python 3.11 + FastAPI + SQLite
**State Management**: Zustand (UI) + TanStack Query (server state)
**Key Libraries**: TanStack Table (data grids), MapLibre GL JS (maps), Recharts (charts)

## Architecture

```
Electron Main Process (window mgmt, Python subprocess spawning)
    ↓ IPC
React Renderer (filters, tables, visualizations)
    ↓ HTTP (localhost:5000)
Python FastAPI Backend (clustering algorithms, SQLite queries)
    ↓
SQLite Database (homicides.db) + Bundled CSV Data
```

## Directory Structure

```
redstring/
├── electron/           # [TO CREATE] Electron main process
├── src/                # React frontend (TypeScript)
│   ├── components/     # Organized by feature (Layout, cases, clusters, filters, etc.)
│   ├── stores/         # Zustand state management
│   ├── services/       # API client layer
│   ├── hooks/          # Custom React hooks
│   └── types/          # TypeScript type definitions
├── backend/            # Python FastAPI backend
│   ├── analysis/       # Clustering & similarity algorithms
│   ├── database/       # SQLite schema & queries
│   ├── models/         # Pydantic data models
│   ├── routes/         # API endpoints
│   └── services/       # Business logic
├── resources/          # Bundled data (Git LFS tracked)
│   ├── data/           # 5 CSV files (~324MB total)
│   └── docs/           # Algorithm & definitions PDFs
└── docs/               # Project documentation
```

## Key Data Files (Git LFS)

All in [resources/data/](resources/data/):
- `Murder Data SHR65 2023.csv` (312MB, 894,636 records) - Primary dataset
- `UCR 2023 Data.csv` (12MB) - Agency statistics (future use)
- `State FIPS Lookout.csv` - State name → FIPS mapping
- `County FIPS Lookout.csv` - County name → FIPS mapping
- `US County Centroids.csv` - Geographic coordinates for counties

## Core Concepts

### Data Pipeline
1. First run: Import CSV → SQLite with transformations
2. Map labels to codes: Month names → 1-12, Weapon text → numeric codes (11-99), County/State labels → FIPS codes
3. Enrich with geography: Join county centroids for latitude/longitude
4. Create indexes on all filterable columns

### Custom Clustering Algorithm
- **Geographic grouping**: County-based (MVP) or radius-based (Phase 2)
- **Multi-factor similarity**: Weighted scoring across weapon, victim demographics, location, temporal proximity
- **Detection thresholds**: Min cluster size (default: 5), max solve rate (default: 33%)
- **Output**: Ranked clusters with similarity scores and matching factors

### Database Schema Highlights
- `cases` table: 894,636 rows with both original labels and numeric codes
- `cluster_results` + `cluster_membership`: Store analysis results (session-ephemeral by default)
- `collections`, `case_notes`, `saved_queries`: User data (persisted)
- Indexed on: state, year, solved, vic_sex, vic_race, vic_age, weapon, county_fips_code, latitude, longitude

## Development Workflow

**Start dev environment**:
```bash
npm run dev  # Runs backend + Electron concurrently
```

**Code quality**:
```bash
npm run lint:fix     # ESLint + auto-fix
npm run format       # Prettier (JS/TS) + Black (Python)
```

**Testing**:
```bash
npm test             # All tests
npm run test:frontend  # Vitest
npm run test:backend   # pytest
```

**Build**:
```bash
npm run build        # TypeScript + Vite + Electron builder
npm run package:mac  # macOS DMG
```

## Key Files to Know

- [redstring PRD.md](redstring%20PRD.md) - Complete product requirements (2,000+ lines)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) - Detailed MVP Phase 1 roadmap
- [package.json](package.json) - Node dependencies & scripts
- [backend/pyproject.toml](backend/pyproject.toml) - Python tooling config
- [vite.config.ts](vite.config.ts) - Vite build config with path aliases

## Current Phase: MVP Phase 1 (In Progress)

**Phase 1 - Foundation** ✅:
- Directory structure created
- Configuration files in place
- Dependencies installed (Node + Python)
- Data files organized with Git LFS
- Documentation complete

**Phase 2 - Electron + Python Bridge** ✅:
- Electron main process with window management
- Python subprocess spawning with health checks
- FastAPI backend with CORS and logging
- Secure IPC bridge with context isolation
- React frontend with backend status display
- Platform-specific path resolution (dev/prod)

**Phase 3 - Database & Data Pipeline** ✅:
- SQLite database schema with 9 tables and 14 indexes
- Data transformation mappings (SOLVED_MAP, VIC_SEX_CODE, MONTH_MAP, WEAPON_CODE_MAP)
- CSV data loader with chunked import (10,000 rows per chunk)
- FIPS code enrichment and geographic coordinate mapping
- Setup API endpoints (status, initialize, progress polling)
- Welcome screen and SetupProgress component with real-time updates
- Database connection manager with performance optimizations

**Phase 4 - Basic API & Frontend Skeleton** ✅:
- Complete backend API with Pydantic models and SQL query builder
- RESTful endpoints: GET /api/cases, GET /api/cases/:id, GET /api/stats/summary
- Zustand stores for filter and UI state management
- TanStack Query hooks for efficient data fetching with caching
- Complete filtering UI with 6 filter components (14 filter types total)
- Case table with TanStack Table + TanStack Virtual for 50k+ rows
- Case detail modal with organized sections and export
- CSV export functionality
- "Forensic Minimalism" design aesthetic with dark/light themes
- Headless UI for accessibility support

**Phase 5 - Clustering Algorithm** ✅:
- Multi-factor similarity calculation algorithm (6 weighted factors)
- County-based cluster detection with connected components (DFS)
- Geographic utilities with Haversine distance calculation
- Complete cluster API: analyze, details, cases, export (4 endpoints)
- Full cluster analysis UI with configuration, results, and detail views
- Configurable similarity weights with real-time validation
- CSV export for cluster results and cases
- TanStack Table with sorting for cluster results
- Responsive Forensic Minimalism design with solve rate visualizations

**Next Steps - Phase 6** 🔄:
1. Write comprehensive backend tests (clustering, API, database)
2. Write frontend tests (components, stores, hooks)
3. Implement dark/light theme toggle
4. Add error boundaries and logging
5. Performance optimization and documentation

## Performance Targets

- Database setup: < 60 seconds (894,636 records)
- Single filter query: < 500ms
- Multi-filter query: < 2 seconds
- Cluster analysis: < 5 seconds

## Code Quality Standards

- **TypeScript**: Strict mode enabled, no unused locals/parameters
- **Python**: Black formatting (line length 88), isort, mypy strict type checking
- **Testing**: Frontend 80%+ coverage, Backend 90%+ coverage
- **Linting**: ESLint (JS/TS), enforced via pre-commit hooks

## Common Patterns

**State Management**:
- **Zustand**: UI state (filter selections, theme, modal state)
- **TanStack Query**: Server state (query results, cluster analysis) with caching

**Data Transformation**:
- All mappings defined in [redstring PRD.md](redstring%20PRD.md) (lines 313-367)
- Original labels preserved for display, numeric codes used for algorithms

**Error Handling**:
- Graceful degradation: Log warnings for lookup failures, continue processing
- User-friendly messages: "Query took too long. Try narrowing your filters."
- Atomic database setup: Rollback on failure, detect incomplete setup on restart

## MVP Scope Boundaries

**Included in Phase 1**:
- ✅ County-based clustering
- ✅ Default similarity weights
- ✅ All filters with pagination
- ✅ CSV export for clusters and results

**Deferred to Later Phases**:
- ❌ Radius-based clustering (Phase 2)
- ❌ Map visualization (Phase 2)
- ❌ Timeline view (Phase 2)
- ❌ Case similarity "Find Similar" (Phase 3)
- ❌ Weight customization (Phase 4)

## Quick Reference

**API Base URL**: `http://localhost:5000` (dev)
**Frontend Dev Port**: 3000 (Vite)
**Database Location**: `{user app data}/data/homicides.db`
**Log Location**: `{user app data}/logs/`

**Git Workflow**:
- Main branch: `main`
- Git LFS enabled for `resources/data/*.csv`
- Conventional commits preferred

## Documentation

- [README.md](README.md) - Quick start guide
- [redstring PRD.md](redstring%20PRD.md) - Complete requirements (authoritative reference)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) - Step-by-step implementation guide
- [resources/docs/Algorithm.pdf](resources/docs/Algorithm.pdf) - MAP clustering algorithm
- [resources/docs/Murder Accountability Project Definitions.pdf](resources/docs/Murder%20Accountability%20Project%20Definitions.pdf) - Data dictionary

---

**For detailed specs, always refer to [redstring PRD.md](redstring%20PRD.md) - it's the source of truth.**
