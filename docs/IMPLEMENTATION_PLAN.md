# Redstring Implementation Plan - MVP Phase 1

**Document Version:** 1.0
**Last Updated:** November 26, 2024
**Estimated Duration:** 20 days
**Status:** Ready to Begin

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Foundation](#phase-1-foundation-days-1-2)
3. [Phase 2: Electron + Python Bridge](#phase-2-electron--python-bridge-days-3-4)
4. [Phase 3: Database & Data Pipeline](#phase-3-database--data-pipeline-days-5-8)
5. [Phase 4: Basic API & Frontend Skeleton](#phase-4-basic-api--frontend-skeleton-days-9-12)
6. [Phase 5: Clustering Algorithm](#phase-5-clustering-algorithm-days-13-16)
7. [Phase 6: Testing & Polish](#phase-6-testing--polish-days-17-20)
8. [Success Criteria](#success-criteria)
9. [File Creation Checklist](#file-creation-checklist)

---

## Overview

This document provides a detailed implementation roadmap for building the Murder Accountability Project Case Analyzer MVP (Phase 1). The application is an Electron + React + Python desktop application that analyzes 894,636 homicide records to identify suspicious clusters of unsolved murders.

### Current Project Status

✅ **Completed:**
- Phase 1: Foundation (Directory structure, configs, dependencies)
- Phase 2: Electron + Python Bridge (Main process, IPC, FastAPI backend)
- Python dependencies installed in backend environment
- React frontend skeleton with backend status display

🎯 **Next Steps:** Begin Phase 3 - Database & Data Pipeline

---

## Phase 1: Foundation (Days 1-2)

**Status:** ✅ COMPLETED

### Accomplishments

1. ✅ Created complete directory structure
2. ✅ Initialized package.json with all frontend dependencies
3. ✅ Set up TypeScript configs (root, electron, renderer)
4. ✅ Created Vite and Vitest build/test configurations
5. ✅ Initialized Python backend with requirements.txt
6. ✅ Configured code quality tools (ESLint, Prettier, Black)
7. ✅ Reorganized data files into resources/ directory
8. ✅ Updated README with comprehensive setup instructions
9. ✅ Committed initial project structure

### Files Created

- `package.json`
- `tsconfig.json`, `tsconfig.node.json`
- `electron/tsconfig.json`
- `vite.config.ts`, `vitest.config.ts`
- `backend/requirements.txt`, `backend/requirements-dev.txt`
- `backend/pyproject.toml`
- `.gitignore`, `.eslintrc.json`, `.prettierrc`
- `index.html`
- `tests/frontend/setup.ts`

---

## Phase 2: Electron + Python Bridge (Days 3-4)

**Status:** ✅ COMPLETED

**Goal:** Get Electron launching Python backend and communicating via IPC

### Accomplishments

1. ✅ Created Electron main process with window management
2. ✅ Implemented Python subprocess manager with health checks
3. ✅ Built secure IPC bridge with context isolation
4. ✅ Created FastAPI backend with health endpoint
5. ✅ Developed React frontend with backend status display
6. ✅ Configured platform-specific paths (dev vs production)
7. ✅ Implemented auto-restart on crash (max 3 attempts)
8. ✅ Added graceful shutdown handling

### Files Created

- `backend/config.py` - Configuration with platform-specific paths
- `backend/main.py` - FastAPI application with health check
- `electron/python-manager.ts` - Python subprocess lifecycle manager
- `electron/preload.ts` - Secure IPC bridge
- `electron/main.ts` - Main process orchestration
- `src/App.tsx` + `src/App.css` - Root component with status display
- `src/index.tsx` + `src/index.css` - React entry point
- `src/types/electron.d.ts` - TypeScript declarations

### Testing Completed

- ✅ Python backend starts successfully (port 5000)
- ✅ Health endpoint returns correct response
- ✅ Electron window opens (1200x800px)
- ✅ IPC communication works
- ✅ TypeScript compilation successful
- ✅ All security features enabled (context isolation, sandbox, no node integration)

### Tasks

#### Task 2.1: Create Electron Main Process (`electron/main.ts`)
**Estimated Time:** 3 hours

Create the Electron main process that manages the application window and spawns the Python backend.

**Key Responsibilities:**
- Create application window (1200x800px, with dev tools in dev mode)
- Spawn Python subprocess via python-manager
- Handle window lifecycle events
- Graceful shutdown (kill Python on app quit)
- IPC communication setup

**Code Structure:**
```typescript
// electron/main.ts
import { app, BrowserWindow } from 'electron'
import { PythonManager } from './python-manager'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let pythonManager: PythonManager | null = null

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Start Python backend
  pythonManager = new PythonManager()
  await pythonManager.start()

  // Load renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.on('ready', createWindow)

app.on('quit', () => {
  pythonManager?.stop()
})
```

**Testing:**
- Verify window opens
- Check that dev tools open in development
- Confirm clean shutdown

---

#### Task 2.2: Create Python Process Manager (`electron/python-manager.ts`)
**Estimated Time:** 4 hours

Implement robust Python subprocess management with health checks and auto-restart.

**Key Responsibilities:**
- Spawn Python FastAPI process
- Port detection (5000-5099 range)
- Health check polling (`/health` endpoint)
- Auto-restart on crash (max 3 attempts)
- Proper cleanup on exit

**Code Structure:**
```typescript
// electron/python-manager.ts
import { spawn, ChildProcess } from 'child_process'
import axios from 'axios'

export class PythonManager {
  private process: ChildProcess | null = null
  private port: number = 5000
  private restartAttempts: number = 0
  private maxRestarts: number = 3

  async start(): Promise<void> {
    // Find available port
    this.port = await this.findAvailablePort()

    // Spawn Python process
    const pythonPath = this.getPythonPath()
    this.process = spawn(pythonPath, [
      '-m', 'uvicorn',
      'main:app',
      '--port', this.port.toString(),
      '--host', '127.0.0.1'
    ], {
      cwd: this.getBackendPath(),
      env: { ...process.env, DATA_PATH: this.getDataPath() }
    })

    // Wait for health check
    await this.waitForHealth()

    // Monitor for crashes
    this.process.on('exit', this.handleCrash.bind(this))
  }

  private async waitForHealth(timeout = 10000): Promise<void> {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      try {
        await axios.get(`http://127.0.0.1:${this.port}/health`)
        return
      } catch {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    throw new Error('Python backend failed to start')
  }

  stop(): void {
    if (this.process) {
      this.process.kill('SIGTERM')
    }
  }
}
```

**Testing:**
- Verify Python spawns successfully
- Test health check polling
- Simulate crash and verify restart
- Test graceful shutdown

---

#### Task 2.3: Create Preload Script (`electron/preload.ts`)
**Estimated Time:** 1 hour

Create the IPC bridge with context isolation enabled.

**Key Responsibilities:**
- Expose safe API to renderer
- Type-safe IPC communication
- No direct Node.js access from renderer

**Code Structure:**
```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getApiPort: () => ipcRenderer.invoke('get-api-port'),
  onBackendReady: (callback: () => void) => {
    ipcRenderer.on('backend-ready', callback)
  },
})
```

**Testing:**
- Verify API exposed to renderer
- Test IPC communication
- Confirm context isolation working

---

#### Task 2.4: Create Minimal FastAPI App (`backend/main.py`)
**Estimated Time:** 2 hours

Create the FastAPI entry point with health check endpoint.

**Key Responsibilities:**
- FastAPI application initialization
- `/health` endpoint
- CORS configuration for Electron
- Port selection logic
- Logging setup

**Code Structure:**
```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Redstring API",
    description="Murder Accountability Project Case Analyzer",
    version="0.1.0"
)

# CORS for Electron
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint for Electron to monitor backend status."""
    return {"status": "healthy", "service": "redstring-api"}

@app.on_event("startup")
async def startup_event():
    logger.info("Redstring API starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Redstring API shutting down...")
```

**Testing:**
- Start FastAPI manually: `uvicorn main:app --reload --port 5000`
- Verify `/health` endpoint responds
- Test CORS headers present

---

#### Task 2.5: Test the Full Bridge
**Estimated Time:** 1 hour

**Testing Steps:**
1. Run `npm run dev` (starts both Electron and Python)
2. Verify Electron window opens
3. Verify Python backend starts (check console logs)
4. Verify health check succeeds
5. Test hot reload for both frontend and backend
6. Test graceful shutdown

**Acceptance Criteria:**
- ✅ Electron spawns and displays window
- ✅ Python backend starts automatically
- ✅ Health check passes within 10 seconds
- ✅ Both processes shut down cleanly
- ✅ Hot reload works for TypeScript changes
- ✅ Hot reload works for Python changes

---

## Phase 3: Database & Data Pipeline (Days 5-8)

**Status:** ⏳ PENDING

**Goal:** Import 894,636 CSV records into SQLite with all transformations

### Tasks

#### Task 3.1: Create Database Schema (`backend/database/schema.py`)
**Estimated Time:** 3 hours

Define the complete SQLite schema for all tables.

**Tables to Create:**
1. **cases** - Main table (894,636 rows)
   - All original CSV columns (id, state, year, victim demographics, weapon, etc.)
   - Transformed columns (solved INTEGER, month INTEGER, vic_sex_code, weapon_code)
   - Geographic enrichment (county_fips_code, latitude, longitude)

2. **collections** - User-created case lists
3. **collection_cases** - Many-to-many relationship
4. **case_notes** - User notes on cases
5. **saved_queries** - Saved filter configurations
6. **cluster_results** - Cluster analysis results
7. **cluster_membership** - Cases in each cluster
8. **saved_analyses** - Persistent cluster analyses

**Critical Indexes:**
```sql
CREATE INDEX idx_state ON cases(state);
CREATE INDEX idx_year ON cases(year);
CREATE INDEX idx_solved ON cases(solved);
CREATE INDEX idx_county_fips_code ON cases(county_fips_code);
CREATE INDEX idx_weapon_code ON cases(weapon_code);
CREATE INDEX idx_vic_sex_code ON cases(vic_sex_code);
CREATE INDEX idx_latitude ON cases(latitude);
CREATE INDEX idx_longitude ON cases(longitude);
```

**Testing:**
- Run schema creation script
- Verify all tables exist
- Verify all indexes created
- Check database file size (~500MB expected after import)

---

#### Task 3.2: Implement Data Transformation Mappings (`backend/utils/mappings.py`)
**Estimated Time:** 2 hours

Create all transformation constants and lookup dictionaries.

**Required Mappings:**
```python
SOLVED_MAP = {"Yes": 1, "No": 0}

VIC_SEX_CODE = {"Male": 1, "Female": 2, "Unknown": 9}

MONTH_MAP = {
    "January": 1, "February": 2, ..., "December": 12
}

WEAPON_CODE_MAP = {
    "Handgun - pistol, revolver, etc": 12,
    "Rifle": 13,
    "Shotgun": 14,
    # ... 18 weapon types total
}
```

**Load FIPS Lookups:**
```python
def load_state_fips() -> Dict[str, int]:
    # Load from resources/data/State FIPS Lookout.csv
    pass

def load_county_fips() -> Dict[str, int]:
    # Load from resources/data/County FIPS Lookout.csv
    pass

def load_county_centroids() -> Dict[int, Tuple[float, float]]:
    # Load from resources/data/US County Centroids.csv
    # Returns {county_fips: (latitude, longitude)}
    pass
```

**Testing:**
- Verify all mappings have correct values
- Test FIPS lookup functions
- Validate centroid data loads correctly

---

#### Task 3.3: Create Data Loader (`backend/services/data_loader.py`)
**Estimated Time:** 6 hours

Implement CSV import with Pandas, applying all transformations.

**Key Responsibilities:**
- Load 894,636 records in chunks (10,000 rows at a time)
- Apply all transformations from mappings.py
- Enrich with geographic data (latitude/longitude)
- Handle NULL values per PRD specification
- Report progress (for UI progress bar)
- Atomic transactions (rollback on failure)

**Code Structure:**
```python
# backend/services/data_loader.py
import pandas as pd
from pathlib import Path
from database.connection import get_db_connection
from utils.mappings import *

class DataLoader:
    def __init__(self, data_path: Path):
        self.data_path = data_path
        self.progress_callback = None

    def import_murder_data(self) -> None:
        """Import Murder Data SHR65 2023.csv into database."""
        # Load lookup tables
        state_fips = load_state_fips()
        county_fips = load_county_fips()
        centroids = load_county_centroids()

        csv_path = self.data_path / "Murder Data SHR65 2023.csv"
        total_rows = 894636
        processed = 0

        # Read in chunks for memory efficiency
        for chunk in pd.read_csv(csv_path, chunksize=10000):
            # Apply transformations
            chunk['solved'] = chunk['Solved'].map(SOLVED_MAP)
            chunk['month'] = chunk['Month'].map(MONTH_MAP)
            chunk['vic_sex_code'] = chunk['VicSex'].map(VIC_SEX_CODE)
            chunk['weapon_code'] = chunk['Weapon'].map(WEAPON_CODE_MAP)

            # Map FIPS codes
            chunk['county_fips_code'] = chunk['CNTYFIPS'].map(county_fips)

            # Enrich with geography
            chunk[['latitude', 'longitude']] = chunk['county_fips_code'].apply(
                lambda fips: centroids.get(fips, (None, None))
            ).apply(pd.Series)

            # Insert into database
            with get_db_connection() as conn:
                chunk.to_sql('cases', conn, if_exists='append', index=False)

            # Report progress
            processed += len(chunk)
            if self.progress_callback:
                self.progress_callback(processed, total_rows)
```

**Performance Target:** < 60 seconds for full import

**Testing:**
- Test with small CSV subset (100 rows)
- Verify all transformations applied correctly
- Test full import with performance timing
- Verify record count: 894,636 rows
- Spot-check random records for correctness

---

#### Task 3.4: Create First-Run Setup Flow
**Estimated Time:** 3 hours

Detect if database exists and run import on first launch.

**Backend: Setup Endpoint**
```python
# backend/routes/setup.py
@app.get("/setup/status")
async def get_setup_status():
    """Check if database is initialized."""
    db_path = get_database_path()
    if not db_path.exists():
        return {"initialized": False}

    # Check setup_complete flag
    with get_db_connection() as conn:
        result = conn.execute("SELECT setup_complete FROM metadata").fetchone()
        return {"initialized": result[0] if result else False}

@app.post("/setup/initialize")
async def initialize_database():
    """Run first-time database setup."""
    try:
        # Create schema
        create_schema()

        # Import data with progress reporting
        loader = DataLoader(get_data_path())

        async def progress_callback(current, total):
            # Emit progress via WebSocket or polling
            pass

        loader.import_murder_data()

        # Mark setup complete
        with get_db_connection() as conn:
            conn.execute("UPDATE metadata SET setup_complete = 1")

        return {"status": "success"}
    except Exception as e:
        # Rollback and clean up
        return {"status": "error", "message": str(e)}
```

**Testing:**
- Delete database and restart app
- Verify setup detection works
- Monitor progress reporting
- Verify setup completes successfully
- Test interrupted setup (crash mid-import)

---

#### Task 3.5: Build Setup Progress UI (`src/components/onboarding/SetupProgress.tsx`)
**Estimated Time:** 2 hours

Create React component showing import progress.

**Features:**
- Progress bar (0-100%)
- "Processing record X of 894,636..."
- Tip carousel during wait
- Error handling with retry option

**Testing:**
- Visual QA on progress display
- Test error state UI
- Verify tips rotate properly

---

## Phase 4: Basic API & Frontend Skeleton (Days 9-12)

**Status:** ⏳ PENDING

**Goal:** Basic filtering UI connected to working API

### Tasks Overview

1. **Create Case API Routes** (`backend/routes/cases.py`)
   - `GET /cases` - Filter and paginate
   - `GET /cases/:id` - Case details
   - `GET /stats/summary` - Count by filters

2. **Set Up State Management** (frontend)
   - Zustand filter store
   - Zustand UI store
   - TanStack Query configuration

3. **Create API Service Layer** (`src/services/`)
   - Axios instance with base URL
   - Case API calls
   - Type definitions

4. **Build Layout Components** (`src/components/Layout/`)
   - Main app shell
   - Sidebar
   - Header with tabs

5. **Create Filter Components** (`src/components/filters/`)
   - State filter (multi-select)
   - Year range filter (dual slider)
   - Victim filters (sex, age, race)
   - Weapon filter (multi-select)
   - Filter panel container

6. **Build Case Table** (`src/components/cases/CaseTable.tsx`)
   - TanStack Table with virtualization
   - Pagination controls
   - Column sorting
   - Row selection

7. **Create Case Detail Modal** (`src/components/cases/CaseDetail.tsx`)
   - Display all case fields
   - Formatted display
   - Export button

### Detailed Task Breakdown

[Full implementation details available in PRD sections F2 and F6]

---

## Phase 5: Clustering Algorithm (Days 13-16)

**Status:** ⏳ PENDING

**Goal:** Working cluster analysis with custom algorithm

### Tasks Overview

1. **Implement Similarity Calculation** (`backend/analysis/clustering.py`)
   - Multi-factor weighted scoring
   - Geographic proximity (35% weight)
   - Weapon match (25% weight)
   - Victim demographics (20% weight)
   - Temporal proximity (7% weight)

2. **Implement Cluster Detection**
   - Group cases by county
   - Calculate pairwise similarities
   - Identify clusters above threshold
   - Filter by solve rate ≤ 33%
   - Rank by unsolved count

3. **Create Cluster API Endpoints**
   - `POST /clusters/analyze`
   - `GET /clusters/:cluster_id/cases`
   - `GET /clusters/export`

4. **Build Cluster UI** (`src/components/clusters/`)
   - Configuration panel
   - Results table with sorting
   - Drill-down view
   - Export button

### Clustering Algorithm Pseudocode

```python
def calculate_similarity(case_a, case_b, weights):
    """Calculate weighted similarity score (0-100)"""
    scores = {}

    # Geographic (35%)
    if same_county(case_a, case_b):
        scores['geographic'] = 100
    else:
        distance = haversine_distance(case_a, case_b)
        scores['geographic'] = max(0, 100 - (distance / 50 * 50))

    # Weapon (25%)
    if case_a.weapon_code == case_b.weapon_code:
        scores['weapon'] = 100
    elif same_weapon_category(case_a, case_b):
        scores['weapon'] = 70
    else:
        scores['weapon'] = 0

    # Victim sex (20%)
    scores['victim_sex'] = 100 if case_a.vic_sex == case_b.vic_sex else 0

    # Victim age (10%)
    age_diff = abs(case_a.vic_age - case_b.vic_age)
    scores['victim_age'] = max(0, 100 - (age_diff * 5))

    # Temporal (7%)
    year_diff = abs(case_a.year - case_b.year)
    scores['temporal'] = max(0, 100 - (year_diff * 10))

    # Victim race (3%)
    scores['victim_race'] = 100 if case_a.vic_race == case_b.vic_race else 0

    # Weighted average
    total = sum(scores[k] * weights[k] for k in scores)
    return round(total / sum(weights.values()), 1)
```

**Performance Target:** < 5 seconds for full dataset clustering

---

## Phase 6: Testing & Polish (Days 17-20)

**Status:** ⏳ PENDING

**Goal:** Production-ready MVP Phase 1

### Tasks Overview

1. **Write Backend Tests** (`tests/backend/`)
   - Data transformation tests
   - Clustering algorithm tests
   - API endpoint tests
   - Database query tests
   - Target: 90% coverage

2. **Write Frontend Tests** (`tests/frontend/`)
   - Component tests
   - Store tests
   - Hook tests
   - Target: 80% coverage

3. **Add Code Quality Tools**
   - ESLint + Prettier for frontend
   - Black + Flake8 for backend
   - Pre-commit hooks

4. **Implement Theme System**
   - CSS custom properties
   - Light/dark mode toggle
   - Persist preference

5. **Add Error Handling**
   - Error boundaries in React
   - API error handling
   - User-friendly messages
   - Logging to files

6. **Performance Optimization**
   - Query optimization
   - React memoization
   - Debounce filters
   - Lazy load components

7. **Documentation**
   - Update README
   - Add DEVELOPMENT.md
   - Document API endpoints
   - Add code comments

---

## Success Criteria

### Functional Requirements

- [ ] Application starts and spawns Python backend
- [ ] Database setup completes in <60 seconds (894,636 records)
- [ ] All data transformations correct (FIPS, weapon codes, month, etc.)
- [ ] Filters work: state, year, solved status, victim demographics, weapon
- [ ] Case table displays with virtualization
- [ ] Cluster analysis runs in <5 seconds
- [ ] Cluster results sortable by unsolved count
- [ ] CSV export works for cases and clusters
- [ ] Dark/light mode toggle works

### Performance Targets

| Operation | Target |
|-----------|--------|
| Database setup (894,636 records) | < 60 seconds |
| Single filter query | < 500ms |
| Multi-filter query (3-5 filters) | < 2 seconds |
| Cluster analysis (full dataset) | < 5 seconds |
| Table rendering (50k rows) | Smooth scrolling |

### Code Quality

- [ ] Frontend test coverage: 80%+
- [ ] Backend test coverage: 90%+
- [ ] No ESLint/TypeScript errors
- [ ] All code formatted with Prettier/Black
- [ ] TypeScript strict mode passes

---

## File Creation Checklist

### Phase 2: Electron + Python Bridge

- [x] `electron/main.ts`
- [x] `electron/python-manager.ts`
- [x] `electron/preload.ts`
- [x] `backend/main.py`
- [x] `backend/config.py`
- [x] `src/App.tsx` + `src/App.css`
- [x] `src/index.tsx` + `src/index.css`
- [x] `src/types/electron.d.ts`

### Phase 3: Database & Data Pipeline

- [ ] `backend/database/connection.py`
- [ ] `backend/database/schema.py`
- [ ] `backend/utils/mappings.py`
- [ ] `backend/services/data_loader.py`
- [ ] `backend/routes/setup.py`
- [ ] `src/components/onboarding/SetupProgress.tsx`
- [ ] `src/components/onboarding/Welcome.tsx`

### Phase 4: Basic API & Frontend

- [ ] `backend/routes/cases.py`
- [ ] `backend/routes/stats.py`
- [ ] `backend/database/queries/cases.py`
- [ ] `src/stores/useFilterStore.ts`
- [ ] `src/stores/useUIStore.ts`
- [ ] `src/services/api.ts`
- [ ] `src/services/cases.ts`
- [ ] `src/types/case.ts`
- [ ] `src/types/filter.ts`
- [ ] `src/components/Layout/Layout.tsx`
- [ ] `src/components/Layout/Sidebar.tsx`
- [ ] `src/components/Layout/Header.tsx`
- [ ] `src/components/filters/FilterPanel.tsx`
- [ ] `src/components/filters/StateFilter.tsx`
- [ ] `src/components/filters/YearRangeFilter.tsx`
- [ ] `src/components/filters/VictimFilters.tsx`
- [ ] `src/components/filters/WeaponFilter.tsx`
- [ ] `src/components/cases/CaseTable.tsx`
- [ ] `src/components/cases/CaseDetail.tsx`
- [ ] `src/hooks/useCases.ts`
- [ ] `src/index.tsx`
- [ ] `src/App.tsx`

### Phase 5: Clustering

- [ ] `backend/analysis/clustering.py`
- [ ] `backend/utils/geo.py`
- [ ] `backend/routes/clusters.py`
- [ ] `backend/services/cluster_service.py`
- [ ] `src/services/clusters.ts`
- [ ] `src/types/cluster.ts`
- [ ] `src/components/clusters/ClusterConfig.tsx`
- [ ] `src/components/clusters/ClusterTable.tsx`
- [ ] `src/components/clusters/ClusterDetails.tsx`
- [ ] `src/hooks/useClusters.ts`

### Phase 6: Testing & Polish

- [ ] `tests/backend/test_database/test_schema.py`
- [ ] `tests/backend/test_analysis/test_clustering.py`
- [ ] `tests/backend/test_routes/test_cases.py`
- [ ] `tests/backend/test_services/test_data_loader.py`
- [ ] `tests/backend/conftest.py`
- [ ] `tests/frontend/components/CaseTable.test.tsx`
- [ ] `tests/frontend/stores/useFilterStore.test.ts`
- [ ] `src/styles/theme.css`
- [ ] `src/styles/index.css`
- [ ] `docs/DEVELOPMENT.md`
- [ ] `docs/API.md`

---

## Notes & Reminders

### Critical Data Transformations

All transformations must match the mappings in PRD Section "Data Transformation Requirements":
- Solved: Yes→1, No→0
- Victim Sex: Male→1, Female→2, Unknown→9
- Month: January→1, ..., December→12
- Weapon: 18 categories mapped to codes 11-99
- FIPS codes loaded from lookup tables

### NULL Value Handling

Per PRD specification:
- VicAge=999: Excluded from age filters unless "Include Unknown" checked
- Missing FIPS: Set to NULL, log warning, exclude from geographic clustering
- Missing lat/long: Set to NULL, exclude from radius clustering (county-based uses FIPS directly)

### Performance Considerations

- Use Pandas chunking (10,000 rows) for CSV import
- Create indexes AFTER bulk insert (faster)
- Use TanStack Virtual for table virtualization
- Debounce filter changes (300ms)
- Implement cursor-based pagination for large result sets

### Git Workflow

- Commit after each major task completion
- Use descriptive commit messages
- Reference task numbers in commits (e.g., "feat: implement Task 2.1 - Electron main process")
- Run tests before committing

---

## Quick Reference

### Start Development

```bash
npm run dev  # Starts both Electron and Python backend
```

### Run Tests

```bash
npm test                # All tests
npm run test:frontend   # Frontend only
npm run test:backend    # Backend only
```

### Code Quality

```bash
npm run lint        # Check linting
npm run format      # Format code
cd backend && black .   # Format Python
```

### Build

```bash
npm run build      # Build all components
npm run package:mac  # Package for macOS
```

---

**Last Updated:** November 26, 2024
**Next Review:** After Phase 2 completion
