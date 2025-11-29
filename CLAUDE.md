# Claude Code Context - Redstring

## Project Overview

**Redstring** is a desktop application for analyzing homicide data from the Murder Accountability Project (MAP). It helps researchers, journalists, and analysts explore 894,636 homicide records (1976-2023) to identify suspicious clusters of unsolved murders.

**Status**: MVP Phase 1 COMPLETE + Phase 2 Features IN PROGRESS
**Version**: 0.1.0
**License**: MIT

## Tech Stack

**Frontend**: Electron 28 + React 18 + TypeScript + Vite
**Backend**: Python 3.11 + FastAPI + SQLite
**State Management**: Zustand (UI) + TanStack Query (server state)
**Key Libraries**: TanStack Table (data grids), Leaflet + React-Leaflet (maps), Recharts (charts)

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
├── electron/           # Electron main process (main.ts, preload.ts, python-manager.ts)
├── src/                # React frontend (TypeScript)
│   ├── components/     # Organized by feature:
│   │   ├── Layout/     # App shell (Header, Sidebar, Layout)
│   │   ├── cases/      # Case table, detail modal, filters
│   │   ├── clusters/   # Cluster analysis (Coming Soon placeholder)
│   │   ├── common/     # Shared components (ComingSoon)
│   │   ├── filters/    # Filter panel and filter components
│   │   ├── map/        # Map visualization (IN PROGRESS)
│   │   ├── onboarding/ # Setup wizard (Welcome, SetupProgress)
│   │   ├── statistics/ # Statistics dashboard (IN PROGRESS)
│   │   ├── timeline/   # Timeline visualization (IN PROGRESS)
│   │   └── ThemeToggle/# Theme switcher
│   ├── stores/         # Zustand state management
│   ├── services/       # API client layer
│   ├── hooks/          # Custom React hooks
│   └── types/          # TypeScript type definitions
├── backend/            # Python FastAPI backend
│   ├── analysis/       # Clustering & similarity algorithms
│   ├── database/       # SQLite schema & queries
│   ├── models/         # Pydantic data models (case, cluster, map, statistics, timeline)
│   ├── routes/         # API endpoints (cases, clusters, map, setup, statistics, timeline)
│   └── services/       # Business logic
├── resources/          # Bundled data (Git LFS tracked)
│   ├── data/           # 5 CSV files (~324MB total)
│   └── docs/           # Algorithm & definitions PDFs
└── docs/               # Project documentation
```

## Key Data Files (Git LFS)

All in [`resources/data/`](resources/data/):
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
- **Note**: Cluster feature currently shows "Coming Soon" placeholder while being refined

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

## Current Development Status

### MVP Phase 1 - COMPLETE ✅

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

**Phase 6 - Testing & Polish** ✅:
- Comprehensive backend tests: 150+ tests across 6 files (90-95% coverage)
- Comprehensive frontend tests: 182 tests across 10 files (88% passing)
- Theme system: Lab Mode (light) & Evidence Room (dark) with distinctive toggle
- Error handling: React ErrorBoundary + retry logic + Python rotating logger
- Pre-commit hooks: Husky + lint-staged with ESLint, Prettier, Black, isort
- Performance optimization review and documentation
- Comprehensive documentation: DEVELOPMENT.md, API.md, PERFORMANCE_OPTIMIZATION_SUMMARY.md

---

### Phase 2 Features - IN PROGRESS 🚧

Per [`docs/MAP_TIMELINE_STATISTICS_PLAN.md`](docs/MAP_TIMELINE_STATISTICS_PLAN.md):

**Feature A - Cluster "Coming Soon" Placeholder** ✅:
- [`ComingSoon`](src/components/common/ComingSoon.tsx:1) component created
- Cluster tab shows friendly placeholder while feature is refined

**Feature B - Map Visualization** 🚧:
- Backend: [`backend/routes/map.py`](backend/routes/map.py:1), [`backend/models/map.py`](backend/models/map.py:1), [`backend/services/map_service.py`](backend/services/map_service.py:1)
- Frontend: [`src/components/map/`](src/components/map/) with MapView, MapControls, MapLegend, CaseMarkers, CountyLayer
- Using Leaflet + React-Leaflet for interactive maps
- Features: County aggregation, case markers, choropleth layers

**Feature C - Timeline Visualization** 🚧:
- Backend: [`backend/routes/timeline.py`](backend/routes/timeline.py:1), [`backend/models/timeline.py`](backend/models/timeline.py:1), [`backend/services/timeline_service.py`](backend/services/timeline_service.py:1)
- Frontend: [`src/components/timeline/`](src/components/timeline/) with TimelineView, TimelineChart, TimelineControls, TrendChart
- Using Recharts for temporal analysis
- Features: Year/month/decade aggregation, trend analysis

**Feature D - Statistics Dashboard** 🚧:
- Backend: [`backend/routes/statistics.py`](backend/routes/statistics.py:1), [`backend/models/statistics.py`](backend/models/statistics.py:1), [`backend/services/statistics_service.py`](backend/services/statistics_service.py:1)
- Frontend: [`src/components/statistics/`](src/components/statistics/) with StatisticsView, SummaryCards, TrendChart, DemographicsChart, WeaponsChart, etc.
- Features: Dashboard metrics, demographic breakdowns, weapon distribution, seasonal patterns

## Performance Targets

- Database setup: < 60 seconds (894,636 records)
- Single filter query: < 500ms
- Multi-filter query: < 2 seconds
- Cluster analysis: < 5 seconds
- Map aggregation: < 2 seconds
- Timeline aggregation: < 1 second
- Statistics dashboard: < 2 seconds

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

## Feature Status

**MVP Phase 1 (COMPLETE)**:
- ✅ County-based clustering algorithm
- ✅ Default similarity weights
- ✅ All 14 filter types with pagination
- ✅ CSV export for clusters and results
- ✅ Theme system (Lab Mode / Evidence Room)
- ✅ Comprehensive test coverage

**Phase 2 Features (IN PROGRESS)**:
- 🚧 Map visualization with Leaflet
- 🚧 Timeline visualization with Recharts
- 🚧 Statistics dashboard
- 🔧 Cluster feature refinement (showing "Coming Soon")

**Future Phases**:
- ❌ Radius-based clustering
- ❌ Case similarity "Find Similar"
- ❌ Custom weight configuration UI
- ❌ Saved analyses

## Quick Reference

**API Base URL**: `http://localhost:5000` (dev)
**Frontend Dev Port**: 3000 (Vite)
**Database Location**: `{user app data}/data/homicides.db`
**Log Location**: `{user app data}/logs/`

**API Endpoints**:
- `/health` - Backend health check
- `/api/setup/*` - Database initialization
- `/api/cases/*` - Case queries and details
- `/api/clusters/*` - Cluster analysis
- `/api/map/*` - Map aggregation data
- `/api/timeline/*` - Timeline aggregation
- `/api/statistics/*` - Statistics dashboard

**Git Workflow**:
- Main branch: `main`
- Git LFS enabled for `resources/data/*.csv`
- Conventional commits preferred

## Documentation

- [`README.md`](README.md) - Quick start guide
- [`redstring PRD.md`](redstring%20PRD.md) - Complete requirements (authoritative reference)
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) - MVP Phase 1 implementation guide
- [`docs/MAP_TIMELINE_STATISTICS_PLAN.md`](docs/MAP_TIMELINE_STATISTICS_PLAN.md) - Phase 2 features plan
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) - Developer guide
- [`docs/API.md`](docs/API.md) - API reference
- [`docs/PERFORMANCE_OPTIMIZATION_SUMMARY.md`](docs/PERFORMANCE_OPTIMIZATION_SUMMARY.md) - Performance guide
- [`resources/docs/Algorithm.pdf`](resources/docs/Algorithm.pdf) - MAP clustering algorithm
- [`resources/docs/Murder Accountability Project Definitions.pdf`](resources/docs/Murder%20Accountability%20Project%20Definitions.pdf) - Data dictionary

## Dependencies

**Frontend** (key packages from [`package.json`](package.json:1)):
- `react` 18.2, `react-dom` 18.2
- `electron` 28.1
- `@tanstack/react-query` 5.17, `@tanstack/react-table` 8.11, `@tanstack/react-virtual` 3.0
- `zustand` 4.4
- `leaflet` 1.9, `react-leaflet` 4.2
- `recharts` 2.10
- `axios` 1.6

**Backend** (from [`backend/requirements.txt`](backend/requirements.txt:1)):
- `fastapi` 0.109, `uvicorn` 0.26
- `pandas` 2.1, `numpy` 1.26
- `scikit-learn` 1.3
- `pydantic` 2.5

---

**For detailed specs, always refer to [`redstring PRD.md`](redstring%20PRD.md) - it's the source of truth.**
