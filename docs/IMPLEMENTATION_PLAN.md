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
- Phase 3: Database & Data Pipeline (Schema, CSV import, setup API, onboarding UI)
- Phase 4: Basic API & Frontend Skeleton (Filters, case table, detail modal, exports)
- Phase 5: Clustering Algorithm (Multi-factor similarity, API, full UI)

🎯 **Next Steps:** Begin Phase 6 - Testing & Polish

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

**Status:** ✅ COMPLETED

**Goal:** Import 894,636 CSV records into SQLite with all transformations

### Accomplishments

1. ✅ Created database connection manager with SQLite PRAGMAs for performance
2. ✅ Implemented complete database schema (9 tables: cases, collections, cluster_results, etc.)
3. ✅ Built data transformation mappings (SOLVED_MAP, VIC_SEX_CODE, MONTH_MAP, WEAPON_CODE_MAP)
4. ✅ Created CSV data loader with chunked import (10,000 rows per chunk)
5. ✅ Implemented FIPS code enrichment from lookup CSVs
6. ✅ Added geographic coordinate mapping (latitude/longitude from county centroids)
7. ✅ Built setup API endpoints (status, initialize, progress polling)
8. ✅ Created Welcome screen for first-time setup
9. ✅ Developed SetupProgress component with real-time updates
10. ✅ Integrated setup flow into main App with state management
11. ✅ Created 14 database indexes for query performance

### Files Created

- `backend/database/connection.py` - Context manager with performance optimizations
- `backend/database/schema.py` - All 9 tables and index definitions
- `backend/utils/mappings.py` - Transformation constants and FIPS lookup loaders
- `backend/services/data_loader.py` - CSV import with progress callbacks
- `backend/routes/setup.py` - Setup API endpoints with thread-safe progress
- `src/components/onboarding/Welcome.tsx` + CSS
- `src/components/onboarding/SetupProgress.tsx` + CSS

### Testing Completed

- ✅ Backend imports successfully (all modules load)
- ✅ Database connection manager works
- ✅ Schema creation is idempotent (IF NOT EXISTS)
- ✅ Transformation mappings load correctly from CSVs
- ✅ Setup API endpoints registered properly

### Performance Achievements

- Chunked import strategy (10,000 rows/chunk) for memory efficiency
- Index creation AFTER bulk insert (3-5x faster)
- SQLite PRAGMAs: WAL mode, NORMAL sync, 64MB cache
- Thread-safe progress tracking for concurrent UI polling

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

**Status:** ✅ COMPLETED

**Goal:** Basic filtering UI connected to working API

### Accomplishments

1. ✅ Created complete backend API with Pydantic models and query builder
2. ✅ Implemented all filter components with Headless UI for accessibility
3. ✅ Built case table with TanStack Table + TanStack Virtual for 50k+ rows
4. ✅ Developed case detail modal with organized sections
5. ✅ Added CSV export functionality for filtered results
6. ✅ Implemented Zustand stores for filter and UI state management
7. ✅ Created TanStack Query hooks for efficient data fetching
8. ✅ Applied "Forensic Minimalism" design aesthetic with clean, technical UI
9. ✅ Fixed all TypeScript compilation errors
10. ✅ Integrated filter auto-apply with 300ms debounce

### Files Created

**Backend:**
- `backend/models/case.py` - Pydantic request/response models
- `backend/database/queries/cases.py` - SQL query builder with pagination
- `backend/routes/cases.py` - RESTful API endpoints (GET /api/cases, GET /api/cases/:id, GET /api/stats/summary)

**Frontend State Management:**
- `src/types/case.ts` - Case type definitions (37 fields)
- `src/types/filter.ts` - Filter state interface and constants
- `src/stores/useFilterStore.ts` - Zustand filter store with localStorage persistence
- `src/stores/useUIStore.ts` - UI state (tabs, sidebar, selected case, theme)
- `src/services/api.ts` - Axios instance with dynamic base URL
- `src/services/cases.ts` - API client methods
- `src/hooks/useCases.ts` - TanStack Query hooks with infinite scroll

**Layout Components:**
- `src/components/Layout/Layout.tsx` - Updated with FilterView and CaseDetail integration
- `src/styles/layout.css` - Updated with export button styles

**Filter Components:**
- `src/components/filters/FilterPanel.tsx` - Main filter container with collapsible sections
- `src/components/filters/PrimaryFilters.tsx` - Case status, year range, states
- `src/components/filters/VictimFilters.tsx` - Victim demographics (age, sex, race, ethnicity)
- `src/components/filters/OffenderFilters.tsx` - Offender demographics
- `src/components/filters/CrimeFilters.tsx` - Weapon, relationship, circumstance, situation
- `src/components/filters/GeographyFilters.tsx` - County and MSA inputs
- `src/components/filters/SearchFilters.tsx` - Case ID and agency search
- `src/components/filters/Filters.css` - Comprehensive filter styling

**Case Components:**
- `src/components/cases/CaseTable.tsx` - Virtualized table with infinite scroll
- `src/components/cases/CaseTable.css` - Monospace table design with status badges
- `src/components/cases/CaseDetail.tsx` - Modal with organized case information
- `src/components/cases/CaseDetail.css` - Modal with backdrop blur and slide-up animation
- `src/components/cases/ExportButton.tsx` - CSV export with loading state
- `src/components/cases/FilterView.tsx` - Integrates FilterPanel and CaseTable
- `src/components/cases/index.ts` - Component exports
- `src/utils/exportUtils.ts` - CSV generation with proper escaping

### Design Decisions

**UI Component Library:** Headless UI (@headlessui/react)
- Chosen for accessibility support and custom styling flexibility
- Provides Dialog, RadioGroup, and form primitives

**Filter Strategy:** Auto-apply with 300ms debounce
- Filters apply automatically as users make selections
- Debounced to prevent excessive API calls
- "Reset All" button for quick clearing

**CSV Export:** Basic implementation in Phase 4
- Exports all fields for filtered cases
- Enhanced export options deferred to Phase 6

**Testing Strategy:** Manual testing in Phase 4
- Comprehensive test suite deferred to Phase 6
- Focus on functionality and integration

### Testing Completed

- ✅ Backend API endpoints registered and accessible
- ✅ TypeScript compilation passes with zero errors
- ✅ Filter state persists across app restarts
- ✅ All filter components render correctly
- ✅ Case table virtualization working
- ✅ Case detail modal displays all fields

### Tasks Overview

1. ✅ **Create Case API Routes** (`backend/routes/cases.py`)
   - `GET /api/cases` - Filter and paginate with cursor-based pagination
   - `GET /api/cases/:id` - Case details by ID
   - `GET /api/stats/summary` - Aggregate statistics for current filters

2. ✅ **Set Up State Management** (frontend)
   - Zustand filter store with 14 filter types
   - Zustand UI store (tabs, sidebar, theme, selected case)
   - TanStack Query configuration with 1min stale time

3. ✅ **Create API Service Layer** (`src/services/`)
   - Axios instance with dynamic base URL from Electron IPC
   - Case API methods with TypeScript types
   - Error handling and 30s timeout

4. ✅ **Build Layout Components** (`src/components/Layout/`)
   - Main app shell with grid layout
   - Sidebar with navigation
   - Header with tabs (Cases & Filters, Clusters, Collections)

5. ✅ **Create Filter Components** (`src/components/filters/`)
   - PrimaryFilters: Case status, year range (1976-2023), 51 states multi-select
   - VictimFilters: Age range, sex, race, ethnicity
   - OffenderFilters: Age range, sex, race, ethnicity
   - CrimeFilters: 18 weapon types, 28 relationships, circumstances, 6 situations
   - GeographyFilters: County and MSA text inputs with chip display
   - SearchFilters: Case ID exact match, agency name substring
   - FilterPanel: Collapsible sections with active filter count badge

6. ✅ **Build Case Table** (`src/components/cases/CaseTable.tsx`)
   - TanStack Table with TanStack Virtual (50k+ row support)
   - 7 columns: Case ID, Year, State, County, Victim, Weapon, Status
   - Infinite scroll with auto-fetch on scroll
   - 48px row height, 10 row overscan for performance
   - Solved/Unsolved status badges

7. ✅ **Create Case Detail Modal** (`src/components/cases/CaseDetail.tsx`)
   - Headless UI Dialog with backdrop blur
   - Organized sections: Incident Info, Victim Details, Offender Details, Crime Details
   - Export single case to CSV
   - Keyboard accessible (ESC to close)

### Performance Achievements

- Query builder uses parameterized queries for SQL injection protection
- Cursor-based pagination for stable result sets
- TanStack Virtual enables smooth 50k+ row scrolling
- 300ms debounce on filter changes reduces API load
- TanStack Query caching minimizes redundant requests

### Next Steps

**Phase 5:** Clustering Algorithm (Days 13-16)
- Implement multi-factor similarity scoring
- Build cluster detection with county-based grouping
- Create cluster API endpoints
- Build cluster analysis UI

---

## Phase 5: Clustering Algorithm (Days 13-16)

**Status:** ✅ COMPLETED

**Goal:** Working cluster analysis with custom algorithm

### Accomplishments

1. ✅ Implemented complete multi-factor similarity calculation algorithm
2. ✅ Built county-based cluster detection with connected components
3. ✅ Created comprehensive cluster API with 4 endpoints
4. ✅ Developed full cluster analysis UI with Forensic Minimalism design
5. ✅ Integrated cluster view into main application layout
6. ✅ Added configurable similarity weights with validation
7. ✅ Implemented CSV export for cluster results
8. ✅ Built responsive cluster detail modal with case table

### Files Created

**Backend:**
- `backend/utils/geo.py` - Haversine distance calculation and geographic scoring
- `backend/analysis/clustering.py` - Complete clustering algorithm (430 lines)
- `backend/models/cluster.py` - Pydantic request/response models
- `backend/services/cluster_service.py` - Service layer with data retrieval and persistence
- `backend/routes/clusters.py` - RESTful API endpoints with full documentation

**Frontend:**
- `src/types/cluster.ts` - TypeScript type definitions and defaults
- `src/services/clusters.ts` - API client methods
- `src/hooks/useClusters.ts` - TanStack Query hooks for cluster operations
- `src/components/clusters/ClusterConfig.tsx` + CSS - Configuration panel with advanced weights
- `src/components/clusters/ClusterTable.tsx` + CSS - Results table with TanStack Table
- `src/components/clusters/ClusterDetail.tsx` + CSS - Detail modal with case list
- `src/components/clusters/ClusterView.tsx` + CSS - Main integration component
- `src/components/clusters/index.ts` - Component exports

### Implementation Details

**Clustering Algorithm:**
- Multi-factor weighted scoring (6 factors: geographic 35%, weapon 25%, victim sex 20%, victim age 10%, temporal 7%, victim race 3%)
- County-based grouping with FIPS code support
- Pairwise similarity calculation within county groups
- Connected component detection using DFS
- Configurable thresholds (min cluster size, max solve rate, similarity threshold)
- Performance-optimized for 894K+ records

**API Endpoints:**
- `POST /api/clusters/analyze` - Run cluster analysis with custom config
- `GET /api/clusters/{id}` - Get cluster detail and statistics
- `GET /api/clusters/{id}/cases` - Get full case details for cluster
- `GET /api/clusters/{id}/export` - Export cluster cases to CSV

**UI Components:**
- ClusterConfig: Detection parameters, advanced weight sliders, filter summary, validation
- ClusterTable: 8-column table with sorting, solve rate bars, click-to-drill-down
- ClusterDetail: Statistics grid (7 metrics), case table, CSV export
- ClusterView: State management, error handling, results display

### Design Decisions

**Algorithm Approach:** County-based grouping (MVP Phase 1)
- Groups cases by state:county_fips before pairwise comparison
- Reduces computational complexity from O(n²) to O(k×m²) where k=counties, m=avg cases per county
- Exact same-county matches score 100%, distance-based decay for different counties

**Performance Optimizations:**
- Connected component detection using adjacency lists and DFS
- Single-pass similarity calculation within county groups
- Database persistence for result reuse
- Chunked data retrieval with filter support

**UI/UX Design:**
- Forensic Minimalism aesthetic matching existing app design
- IBM Plex Mono typography for technical, data-driven feel
- Real-time weight validation (must sum to 100%)
- Collapsible advanced settings to avoid overwhelming users
- Visual solve rate bars with gradient (green→yellow→red)

### Testing Completed

- ✅ Backend imports successfully (all modules load)
- ✅ TypeScript compilation passes with clustering components
- ✅ API endpoints registered in FastAPI router
- ✅ Cluster routes accessible via /api/clusters/*
- ✅ Filter-to-API conversion working (camelCase → snake_case)
- ✅ Component integration in Layout.tsx successful

### Performance Achievements

- Algorithm designed for < 5 second target on full dataset
- Pairwise similarity calculation optimized with early termination
- Database indexing on all clustering-relevant fields
- Frontend virtualization ready for large result sets

### Tasks Overview

1. ✅ **Implement Similarity Calculation** (`backend/analysis/clustering.py`)
   - Multi-factor weighted scoring
   - Geographic proximity (35% weight)
   - Weapon match (25% weight)
   - Victim demographics (20% weight)
   - Temporal proximity (7% weight)

2. ✅ **Implement Cluster Detection**
   - Group cases by county
   - Calculate pairwise similarities
   - Identify clusters above threshold
   - Filter by solve rate ≤ 33%
   - Rank by unsolved count

3. ✅ **Create Cluster API Endpoints**
   - `POST /api/clusters/analyze`
   - `GET /api/clusters/{id}` - Cluster details
   - `GET /api/clusters/{id}/cases` - Case list
   - `GET /api/clusters/{id}/export` - CSV export

4. ✅ **Build Cluster UI** (`src/components/clusters/`)
   - Configuration panel with validation
   - Results table with sorting and drill-down
   - Detail modal with statistics and case table
   - Export functionality

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

- [x] `backend/database/connection.py`
- [x] `backend/database/schema.py`
- [x] `backend/utils/mappings.py`
- [x] `backend/services/data_loader.py`
- [x] `backend/routes/setup.py`
- [x] `src/components/onboarding/SetupProgress.tsx`
- [x] `src/components/onboarding/Welcome.tsx`

### Phase 4: Basic API & Frontend

- [x] `backend/models/case.py`
- [x] `backend/routes/cases.py`
- [x] `backend/database/queries/cases.py`
- [x] `src/stores/useFilterStore.ts`
- [x] `src/stores/useUIStore.ts`
- [x] `src/services/api.ts`
- [x] `src/services/cases.ts`
- [x] `src/types/case.ts`
- [x] `src/types/filter.ts`
- [x] `src/components/Layout/Layout.tsx` (updated)
- [x] `src/components/Layout/Sidebar.tsx` (already existed)
- [x] `src/components/Layout/Header.tsx` (already existed)
- [x] `src/components/filters/FilterPanel.tsx`
- [x] `src/components/filters/PrimaryFilters.tsx`
- [x] `src/components/filters/VictimFilters.tsx`
- [x] `src/components/filters/OffenderFilters.tsx`
- [x] `src/components/filters/CrimeFilters.tsx`
- [x] `src/components/filters/GeographyFilters.tsx`
- [x] `src/components/filters/SearchFilters.tsx`
- [x] `src/components/filters/Filters.css`
- [x] `src/components/cases/CaseTable.tsx`
- [x] `src/components/cases/CaseTable.css`
- [x] `src/components/cases/CaseDetail.tsx`
- [x] `src/components/cases/CaseDetail.css`
- [x] `src/components/cases/ExportButton.tsx`
- [x] `src/components/cases/FilterView.tsx`
- [x] `src/components/cases/index.ts`
- [x] `src/hooks/useCases.ts`
- [x] `src/utils/exportUtils.ts`
- [x] `src/styles/layout.css` (updated)

### Phase 5: Clustering

- [x] `backend/analysis/clustering.py`
- [x] `backend/utils/geo.py`
- [x] `backend/routes/clusters.py`
- [x] `backend/services/cluster_service.py`
- [x] `backend/models/cluster.py`
- [x] `src/services/clusters.ts`
- [x] `src/types/cluster.ts`
- [x] `src/components/clusters/ClusterConfig.tsx` + CSS
- [x] `src/components/clusters/ClusterTable.tsx` + CSS
- [x] `src/components/clusters/ClusterDetail.tsx` + CSS
- [x] `src/components/clusters/ClusterView.tsx` + CSS
- [x] `src/components/clusters/index.ts`
- [x] `src/hooks/useClusters.ts`

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
**Next Review:** After Phase 5 completion - Ready for Phase 6 (Testing & Polish)
