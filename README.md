# Redstring - Murder Accountability Project Case Analyzer

A desktop application for analyzing homicide data from the Murder Accountability Project (MAP), featuring custom clustering algorithms, advanced filtering, and visualization capabilities.

## Overview

This Electron + React + Python application enables researchers, journalists, and analysts to explore and analyze 894,636 homicide records spanning 1976-2023, identifying suspicious clusters of unsolved murders that may indicate serial killer activity.

## Tech Stack

**Frontend:**
- Electron 28 - Desktop application framework
- React 18 + TypeScript - UI framework
- Zustand - UI state management
- TanStack Query - Server state & caching
- TanStack Table - Data tables with virtualization
- Vite - Build tool
- MapLibre GL JS - Map visualization
- Recharts - Statistical charts

**Backend:**
- Python 3.11 + FastAPI - REST API
- Pandas + NumPy - Data processing
- scikit-learn - Clustering algorithms
- SQLite - Local database
- Uvicorn - ASGI server

## Project Structure

```
redstring/
├── electron/          # Electron main process (window mgmt, Python bridge)
├── src/               # React renderer process (frontend UI)
│   ├── components/    # UI components
│   ├── stores/        # Zustand state stores
│   ├── services/      # API client layer
│   └── hooks/         # Custom React hooks
├── backend/           # Python FastAPI backend
│   ├── analysis/      # Clustering algorithms
│   ├── database/      # SQLite schema & queries
│   ├── routes/        # API endpoints
│   └── services/      # Business logic
├── resources/         # Bundled data files
│   ├── data/          # CSV datasets (tracked via Git LFS)
│   └── docs/          # PDF documentation
└── tests/             # Test suites (frontend + backend)
```

## Prerequisites

- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **Git LFS**: For large data files

## Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/redstring.git
cd redstring
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Set up Python virtual environment

```bash
cd backend
python3 -m venv venv

# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

pip install -r requirements.txt
pip install -r requirements-dev.txt
cd ..
```

## Development

### Start the development environment

```bash
npm run dev
```

This starts both the Python backend (port 5000) and Electron frontend concurrently.

**Or run separately:**

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate
uvicorn main:app --reload --port 5000

# Terminal 2: Frontend
npm run dev:electron
```

### Code Quality

```bash
# Lint frontend code
npm run lint
npm run lint:fix

# Format code
npm run format

# Format Python code (in backend/)
black .
isort .
```

### Testing

```bash
# Run all tests
npm test

# Frontend tests only
npm run test:frontend

# Backend tests only
npm run test:backend
```

## Building for Production

### Build all components

```bash
npm run build
```

### Package for distribution

```bash
# macOS DMG
npm run package:mac

# Windows MSI/NSIS
npm run package:win

# Linux AppImage/deb
npm run package:linux
```

## Data Files

All data files are stored in `resources/data/` and tracked via Git LFS:

- **Murder Data SHR65 2023.csv** (312MB) - Primary dataset, 894,636 homicide records
- **UCR 2023 Data.csv** (12MB) - Agency-level statistics
- **State FIPS Lookout.csv** - State FIPS code mapping
- **County FIPS Lookout.csv** - County FIPS code mapping
- **US County Centroids.csv** - Geographic coordinates for counties

## Key Features (MVP Phase 1)

✅ **Data Pipeline**
- Import 894,636 records into local SQLite database
- Transform and enrich data with FIPS codes and geographic coordinates
- First-run setup with progress indicator

✅ **Advanced Filtering**
- Filter by state, year, solved status, victim demographics, weapon type
- Full-text search across case details
- Virtualized tables for handling large result sets

✅ **Custom Clustering Algorithm**
- County-based geographic clustering
- Multi-factor similarity scoring (weapon, victim profile, temporal proximity)
- Identify suspicious clusters with low solve rates
- Drill-down to view all cases in a cluster

✅ **Export Capabilities**
- Export filtered results to CSV
- Export cluster analysis results

## Success Criteria

**Performance:**
- Database setup: < 60 seconds (894,636 records)
- Single filter query: < 500ms
- Multi-filter query: < 2 seconds
- Cluster analysis: < 5 seconds

**Code Quality:**
- Frontend test coverage: 80%+
- Backend test coverage: 90%+
- TypeScript strict mode enabled
- All code linted and formatted

## License

MIT

## Acknowledgments

Data provided by the [Murder Accountability Project](https://www.murderdata.org).
