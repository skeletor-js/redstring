# Phase 3 Implementation Plan

**Document Version:** 1.1
**Created:** November 29, 2024
**Last Updated:** November 29, 2024
**Status:** Complete
**Estimated Duration:** 12-15 days

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature A: Phase 2 Test Coverage](#feature-a-phase-2-test-coverage)
3. [Feature B: Find Similar Cases](#feature-b-find-similar-cases)
4. [Feature C: Heatmap Layer](#feature-c-heatmap-layer)
5. [Feature D: Remove Settings Button](#feature-d-remove-settings-button)
6. [Implementation Timeline](#implementation-timeline)
7. [Testing Strategy](#testing-strategy)
8. [Risk Assessment](#risk-assessment)

---

## Executive Summary

This document outlines the implementation plan for four features in the Redstring Murder Accountability Project Case Analyzer:

| Feature | Description | Effort | Priority |
|---------|-------------|--------|----------|
| **A. Phase 2 Test Coverage** | Add comprehensive tests for Map, Timeline, Statistics | 8-10 days | High |
| **B. Find Similar Cases** | Case similarity search with weighted scoring | 4-5 days | Medium |
| **C. Heatmap Layer** | Heat visualization on the map | 1-2 days | Medium |
| **D. Remove Settings Button** | Remove placeholder settings button from header | 0.5 days | Low |

### Current State

- **Phase 1:** Complete with 90%+ test coverage
- **Phase 2:** Map, Timeline, Statistics implemented but **0% test coverage**
- **Similarity Feature:** Specified in PRD (F4.1, F4.2) but not implemented
- **Heatmap:** Referenced in MapView comments but not implemented

### Implementation Progress

| Feature | Status | Notes |
|---------|--------|-------|
| **A.1 Backend Tests** | ✅ Complete | test_map.py, test_timeline.py, test_statistics.py created |
| **A.2.1 MapView Tests** | ✅ Complete | MapView.test.tsx created with ~50 tests |
| **A.2.2 TimelineView Tests** | ✅ Complete | TimelineView.test.tsx created with ~35 tests |
| **A.2.3 StatisticsView Tests** | ✅ Complete | StatisticsView.test.tsx created with 30 tests |
| **B. Find Similar Cases** | ✅ Complete | Backend algorithm, API route, frontend UI implemented |
| **C. Heatmap Layer** | ✅ Complete | HeatmapLayer.tsx implemented |
| **D. Remove Settings Button** | ✅ Complete | Settings button removed from Header |

---

## Feature A: Phase 2 Test Coverage

### Overview

Add comprehensive test coverage for the Map, Timeline, and Statistics features that were implemented in Phase 2 but lack tests.

**Target Coverage:** 85-90% (matching Phase 1 quality)

### A.1 Backend Tests

#### A.1.1 Map Route Tests

**File:** `tests/backend/test_routes/test_map.py`

```python
"""Tests for map API endpoints.

Tests GET /api/map/counties, GET /api/map/cases with various
filter combinations and edge cases.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.main import app


@pytest.fixture
def client(populated_test_db):
    """Create test client with mocked database."""
    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = populated_test_db
        yield TestClient(app)


class TestGetCountyData:
    """Test GET /api/map/counties endpoint."""

    def test_get_county_data_returns_counties(self, client):
        """Test that endpoint returns county aggregations."""
        response = client.get("/api/map/counties")
        assert response.status_code == 200
        data = response.json()
        assert "counties" in data
        assert "bounds" in data
        assert "total_cases" in data
        assert "total_counties" in data

    def test_get_county_data_filters_by_state(self, client):
        """Test filtering by state."""
        response = client.get("/api/map/counties?state=California")
        assert response.status_code == 200
        data = response.json()
        # Verify all counties are from California
        for county in data["counties"]:
            assert "CA" in county["county_name"] or county["state"] == "California"

    def test_get_county_data_filters_by_year_range(self, client):
        """Test filtering by year range."""
        response = client.get("/api/map/counties?year_start=2000&year_end=2010")
        assert response.status_code == 200
        data = response.json()
        assert data["total_cases"] >= 0

    def test_get_county_data_filters_by_solved_status(self, client):
        """Test filtering by solved status."""
        response = client.get("/api/map/counties?solved=false")
        assert response.status_code == 200

    def test_get_county_data_filters_by_victim_demographics(self, client):
        """Test filtering by victim sex and race."""
        response = client.get("/api/map/counties?vic_sex=Female&vic_race=White")
        assert response.status_code == 200

    def test_get_county_data_filters_by_weapon(self, client):
        """Test filtering by weapon type."""
        response = client.get("/api/map/counties?weapon=Strangulation%20-%20hanging")
        assert response.status_code == 200

    def test_get_county_data_returns_valid_bounds(self, client):
        """Test that bounds are valid coordinates."""
        response = client.get("/api/map/counties?state=California")
        assert response.status_code == 200
        data = response.json()
        if data["bounds"]:
            bounds = data["bounds"]
            assert -90 <= bounds["south"] <= 90
            assert -90 <= bounds["north"] <= 90
            assert -180 <= bounds["west"] <= 180
            assert -180 <= bounds["east"] <= 180
            assert bounds["south"] <= bounds["north"]

    def test_get_county_data_empty_result(self, client):
        """Test with filters that return no results."""
        response = client.get("/api/map/counties?state=NonexistentState")
        assert response.status_code == 200
        data = response.json()
        assert data["total_counties"] == 0


class TestGetCasePoints:
    """Test GET /api/map/cases endpoint."""

    def test_get_case_points_returns_cases(self, client):
        """Test that endpoint returns case points."""
        response = client.get("/api/map/cases?limit=100")
        assert response.status_code == 200
        data = response.json()
        assert "cases" in data
        assert "total" in data
        assert "limited" in data

    def test_get_case_points_respects_limit(self, client):
        """Test that limit parameter is respected."""
        response = client.get("/api/map/cases?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["cases"]) <= 10

    def test_get_case_points_filters_by_county(self, client):
        """Test filtering by county FIPS."""
        response = client.get("/api/map/cases?county=06037&limit=100")
        assert response.status_code == 200

    def test_get_case_points_has_coordinates(self, client):
        """Test that returned cases have coordinates."""
        response = client.get("/api/map/cases?limit=10")
        assert response.status_code == 200
        data = response.json()
        for case in data["cases"]:
            assert "latitude" in case
            assert "longitude" in case

    def test_get_case_points_limit_validation(self, client):
        """Test limit parameter validation."""
        # Limit too high
        response = client.get("/api/map/cases?limit=10000")
        assert response.status_code == 422  # Validation error

        # Limit too low
        response = client.get("/api/map/cases?limit=0")
        assert response.status_code == 422
```

**Test Count:** ~15 tests

#### A.1.2 Timeline Route Tests

**File:** `tests/backend/test_routes/test_timeline.py`

```python
"""Tests for timeline API endpoints.

Tests GET /api/timeline/data, GET /api/timeline/trends with various
granularities, filters, and edge cases.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.main import app


@pytest.fixture
def client(populated_test_db):
    """Create test client with mocked database."""
    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = populated_test_db
        yield TestClient(app)


class TestTimelineData:
    """Test GET /api/timeline/data endpoint."""

    def test_timeline_data_year_granularity(self, client):
        """Test timeline data with year granularity."""
        response = client.get("/api/timeline/data?granularity=year")
        assert response.status_code == 200
        data = response.json()
        assert "data_points" in data
        assert "granularity" in data
        assert data["granularity"] == "year"

    def test_timeline_data_month_granularity(self, client):
        """Test timeline data with month granularity."""
        response = client.get("/api/timeline/data?granularity=month")
        assert response.status_code == 200
        data = response.json()
        assert data["granularity"] == "month"

    def test_timeline_data_decade_granularity(self, client):
        """Test timeline data with decade granularity."""
        response = client.get("/api/timeline/data?granularity=decade")
        assert response.status_code == 200
        data = response.json()
        assert data["granularity"] == "decade"

    def test_timeline_data_filters_by_state(self, client):
        """Test filtering by state."""
        response = client.get("/api/timeline/data?granularity=year&state=California")
        assert response.status_code == 200

    def test_timeline_data_filters_by_year_range(self, client):
        """Test filtering by year range."""
        response = client.get(
            "/api/timeline/data?granularity=year&year_start=2000&year_end=2010"
        )
        assert response.status_code == 200
        data = response.json()
        for point in data["data_points"]:
            assert 2000 <= point["period"] <= 2010

    def test_timeline_data_includes_solve_rates(self, client):
        """Test that data points include solve rate."""
        response = client.get("/api/timeline/data?granularity=year")
        assert response.status_code == 200
        data = response.json()
        for point in data["data_points"]:
            assert "total_cases" in point
            assert "solved_cases" in point
            assert "unsolved_cases" in point
            assert "solve_rate" in point

    def test_timeline_data_invalid_granularity(self, client):
        """Test invalid granularity returns error."""
        response = client.get("/api/timeline/data?granularity=invalid")
        assert response.status_code == 422


class TestTimelineTrends:
    """Test GET /api/timeline/trends endpoint."""

    def test_timeline_trends_solve_rate(self, client):
        """Test trends for solve rate metric."""
        response = client.get("/api/timeline/trends?metric=solve_rate")
        assert response.status_code == 200
        data = response.json()
        assert "trend_points" in data
        assert "metric" in data

    def test_timeline_trends_total_cases(self, client):
        """Test trends for total cases metric."""
        response = client.get("/api/timeline/trends?metric=total_cases")
        assert response.status_code == 200

    def test_timeline_trends_moving_average(self, client):
        """Test moving average calculation."""
        response = client.get(
            "/api/timeline/trends?metric=solve_rate&moving_average_window=5"
        )
        assert response.status_code == 200
        data = response.json()
        for point in data["trend_points"]:
            assert "moving_average" in point

    def test_timeline_trends_window_validation(self, client):
        """Test moving average window validation."""
        # Window too small
        response = client.get("/api/timeline/trends?moving_average_window=1")
        assert response.status_code == 422

        # Window too large
        response = client.get("/api/timeline/trends?moving_average_window=20")
        assert response.status_code == 422

    def test_timeline_trends_with_filters(self, client):
        """Test trends with various filters."""
        response = client.get(
            "/api/timeline/trends?metric=solve_rate&state=California&victim_sex=Female"
        )
        assert response.status_code == 200
```

**Test Count:** ~15 tests

#### A.1.3 Statistics Route Tests

**File:** `tests/backend/test_routes/test_statistics.py`

```python
"""Tests for statistics API endpoints.

Tests all 8 statistics endpoints: summary, demographics, weapons,
circumstances, relationships, geographic, trends, and seasonal.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.main import app


@pytest.fixture
def client(populated_test_db):
    """Create test client with mocked database."""
    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = populated_test_db
        yield TestClient(app)


class TestSummaryStatistics:
    """Test GET /api/statistics/summary endpoint."""

    def test_summary_returns_all_metrics(self, client):
        """Test that summary includes all expected metrics."""
        response = client.get("/api/statistics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_cases" in data
        assert "solved_cases" in data
        assert "unsolved_cases" in data
        assert "solve_rate" in data
        assert "total_states" in data
        assert "total_counties" in data

    def test_summary_filters_by_state(self, client):
        """Test summary with state filter."""
        response = client.get("/api/statistics/summary?state=California")
        assert response.status_code == 200

    def test_summary_filters_by_year_range(self, client):
        """Test summary with year range filter."""
        response = client.get(
            "/api/statistics/summary?year_start=2000&year_end=2020"
        )
        assert response.status_code == 200

    def test_summary_solve_rate_calculation(self, client):
        """Test that solve rate is calculated correctly."""
        response = client.get("/api/statistics/summary")
        assert response.status_code == 200
        data = response.json()
        if data["total_cases"] > 0:
            expected_rate = (data["solved_cases"] / data["total_cases"]) * 100
            assert abs(data["solve_rate"] - expected_rate) < 0.1


class TestDemographicsStatistics:
    """Test GET /api/statistics/demographics endpoint."""

    def test_demographics_returns_breakdowns(self, client):
        """Test that demographics includes all breakdowns."""
        response = client.get("/api/statistics/demographics")
        assert response.status_code == 200
        data = response.json()
        assert "sex_breakdown" in data
        assert "race_breakdown" in data
        assert "age_groups" in data

    def test_demographics_with_filters(self, client):
        """Test demographics with filters."""
        response = client.get("/api/statistics/demographics?state=California")
        assert response.status_code == 200


class TestWeaponStatistics:
    """Test GET /api/statistics/weapons endpoint."""

    def test_weapons_returns_distribution(self, client):
        """Test that weapons endpoint returns distribution."""
        response = client.get("/api/statistics/weapons")
        assert response.status_code == 200
        data = response.json()
        assert "weapons" in data
        for weapon in data["weapons"]:
            assert "weapon" in weapon
            assert "count" in weapon
            assert "percentage" in weapon


class TestCircumstanceStatistics:
    """Test GET /api/statistics/circumstances endpoint."""

    def test_circumstances_returns_distribution(self, client):
        """Test that circumstances endpoint returns distribution."""
        response = client.get("/api/statistics/circumstances")
        assert response.status_code == 200
        data = response.json()
        assert "circumstances" in data


class TestRelationshipStatistics:
    """Test GET /api/statistics/relationships endpoint."""

    def test_relationships_returns_distribution(self, client):
        """Test that relationships endpoint returns distribution."""
        response = client.get("/api/statistics/relationships")
        assert response.status_code == 200
        data = response.json()
        assert "relationships" in data


class TestGeographicStatistics:
    """Test GET /api/statistics/geographic endpoint."""

    def test_geographic_returns_state_data(self, client):
        """Test that geographic endpoint returns state-level data."""
        response = client.get("/api/statistics/geographic")
        assert response.status_code == 200
        data = response.json()
        assert "states" in data
        for state in data["states"]:
            assert "state" in state
            assert "total_cases" in state
            assert "solve_rate" in state


class TestTrendStatistics:
    """Test GET /api/statistics/trends endpoint."""

    def test_trends_returns_yearly_data(self, client):
        """Test that trends endpoint returns yearly data."""
        response = client.get("/api/statistics/trends")
        assert response.status_code == 200
        data = response.json()
        assert "trends" in data


class TestSeasonalStatistics:
    """Test GET /api/statistics/seasonal endpoint."""

    def test_seasonal_returns_monthly_patterns(self, client):
        """Test that seasonal endpoint returns monthly patterns."""
        response = client.get("/api/statistics/seasonal")
        assert response.status_code == 200
        data = response.json()
        assert "monthly_patterns" in data
        assert len(data["monthly_patterns"]) == 12  # 12 months
```

**Test Count:** ~20 tests

### A.2 Frontend Tests

#### A.2.1 MapView Component Tests

**File:** `tests/frontend/components/MapView.test.tsx`

```typescript
/**
 * Test suite for MapView component.
 *
 * Tests map rendering, controls, legend, loading states,
 * error handling, and filter integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapView } from '../../../src/components/map/MapView'
import * as mapService from '../../../src/services/map'

// Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  useMap: () => ({
    getZoom: () => 4,
    fitBounds: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
}))

vi.mock('leaflet', () => ({
  default: {
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
    latLngBounds: vi.fn(),
  },
}))

vi.mock('../../../src/services/map')

const mockCountyData = {
  counties: [
    {
      county_fips: '06037',
      county_name: 'Los Angeles, CA',
      state: 'California',
      latitude: 34.0522,
      longitude: -118.2437,
      total_cases: 1000,
      solved_cases: 600,
      unsolved_cases: 400,
      solve_rate: 60.0,
    },
  ],
  bounds: { north: 42, south: 32, east: -114, west: -124 },
  total_cases: 1000,
  total_counties: 1,
}

describe('MapView', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  it('renders map container', async () => {
    vi.mocked(mapService.getCountyData).mockResolvedValue(mockCountyData)

    render(
      <QueryClientProvider client={queryClient}>
        <MapView />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching data', () => {
    vi.mocked(mapService.getCountyData).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(
      <QueryClientProvider client={queryClient}>
        <MapView />
      </QueryClientProvider>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error state on fetch failure', async () => {
    vi.mocked(mapService.getCountyData).mockRejectedValue(
      new Error('Network error')
    )

    render(
      <QueryClientProvider client={queryClient}>
        <MapView />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('renders map controls', async () => {
    vi.mocked(mapService.getCountyData).mockResolvedValue(mockCountyData)

    render(
      <QueryClientProvider client={queryClient}>
        <MapView />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })

  it('shows empty state when no data', async () => {
    vi.mocked(mapService.getCountyData).mockResolvedValue({
      counties: [],
      bounds: null,
      total_cases: 0,
      total_counties: 0,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MapView />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/no data/i)).toBeInTheDocument()
    })
  })
})
```

**Test Count:** ~10 tests

#### A.2.2 TimelineView Component Tests

**File:** `tests/frontend/components/TimelineView.test.tsx`

**Status:** ✅ **IMPLEMENTED**

The TimelineView test file has been created with comprehensive test coverage including:

- **Loading State Tests** (~2 tests): Loading spinner, loading text display
- **Error State Tests** (~2 tests): Error message display, error details
- **Empty State Tests** (~2 tests): No data message, filter adjustment hint
- **Timeline Chart Rendering Tests** (~3 tests): Chart container, chart with data, custom className
- **Timeline Header Tests** (~3 tests): Title display, date range, total cases count
- **Granularity Controls Tests** (~3 tests): Year/Month/Decade buttons, granularity switching
- **Chart Type Controls Tests** (~2 tests): Chart type selector, default area chart
- **Timeline Summary Tests** (~2 tests): Summary statistics cards, average solve rate
- **Trend Analysis Tests** (~4 tests): Trend toggle, trend chart, metric selector, moving average slider
- **Filter Info Tests** (~2 tests): Year range display, brush hint
- **CSS Classes Tests** (~4 tests): Container classes, loading/error/empty state classes
- **Accessibility Tests** (~3 tests): Accessible loading/error/empty states
- **Filter Integration Tests** (~2 tests): Data fetching with filters, refetch on granularity change
- **Data Point Display Tests** (~2 tests): Data points in chart, single data point handling

**Test Count:** ~35 tests

The implementation mocks:
- Recharts components (ResponsiveContainer, AreaChart, BarChart, LineChart, etc.)
- Timeline service (fetchTimelineData, fetchTimelineTrends)
- Error handler utility

#### A.2.3 StatisticsView Component Tests

**File:** `tests/frontend/components/StatisticsView.test.tsx`

```typescript
/**
 * Test suite for StatisticsView component.
 *
 * Tests dashboard rendering, summary cards, charts,
 * loading states, and filter integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatisticsView } from '../../../src/components/statistics/StatisticsView'
import * as statisticsService from '../../../src/services/statistics'

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Cell: () => <div />,
}))

vi.mock('../../../src/services/statistics')

const mockSummary = {
  total_cases: 894636,
  solved_cases: 632457,
  unsolved_cases: 262179,
  solve_rate: 70.7,
  total_states: 51,
  total_counties: 3079,
}

const mockDemographics = {
  sex_breakdown: [
    { sex: 'Male', count: 700000, percentage: 78.3 },
    { sex: 'Female', count: 190000, percentage: 21.2 },
  ],
  race_breakdown: [],
  age_groups: [],
}

describe('StatisticsView', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
    vi.mocked(statisticsService.getSummaryStatistics).mockResolvedValue(mockSummary)
    vi.mocked(statisticsService.getDemographics).mockResolvedValue(mockDemographics)
  })

  it('renders summary cards', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <StatisticsView />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/894,636/)).toBeInTheDocument()
      expect(screen.getByText(/70.7%/)).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    vi.mocked(statisticsService.getSummaryStatistics).mockImplementation(
      () => new Promise(() => {})
    )

    render(
      <QueryClientProvider client={queryClient}>
        <StatisticsView />
      </QueryClientProvider>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error state on failure', async () => {
    vi.mocked(statisticsService.getSummaryStatistics).mockRejectedValue(
      new Error('Network error')
    )

    render(
      <QueryClientProvider client={queryClient}>
        <StatisticsView />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

**Test Count:** ~10 tests

### A.3 Test File Summary

| File | Type | Tests | Status | Coverage Target |
|------|------|-------|--------|-----------------|
| `test_map.py` | Backend | ~15 | ✅ Complete | Map routes |
| `test_timeline.py` | Backend | ~15 | ✅ Complete | Timeline routes |
| `test_statistics.py` | Backend | ~20 | ✅ Complete | Statistics routes |
| `MapView.test.tsx` | Frontend | ~50 | ✅ Complete | Map component |
| `TimelineView.test.tsx` | Frontend | ~35 | ✅ Complete | Timeline component |
| `StatisticsView.test.tsx` | Frontend | 30 | ✅ Complete | Statistics component |
| **Total** | | **~145** | | 85-90% |

---

## Feature B: Find Similar Cases

### Overview

Implement the "Find Similar Cases" feature as specified in PRD F4.1 and F4.2. This allows users to find cases with similar characteristics to a selected case.

### B.1 Backend Implementation

#### B.1.1 Similarity Algorithm

**File:** `backend/analysis/similarity.py`

```python
"""Case similarity scoring algorithm.

Implements weighted multi-factor similarity scoring to find cases
similar to a reference case.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import math

from database.connection import get_db_connection


@dataclass
class SimilarityWeights:
    """Configurable weights for similarity factors."""
    weapon: float = 0.30          # Strong indicator of MO pattern
    geographic: float = 0.25      # Serial offenders operate in defined areas
    victim_age: float = 0.20      # Victim selection pattern
    temporal: float = 0.15        # Active period clustering
    victim_race: float = 0.05     # Secondary demographic indicator
    circumstance: float = 0.03    # Contextual pattern
    relationship: float = 0.02   # Contextual pattern


@dataclass
class SimilarCase:
    """A case similar to the reference case."""
    case_id: str
    similarity_score: float
    matching_factors: Dict[str, float]
    case_data: Dict


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in miles."""
    R = 3959  # Earth's radius in miles

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def calculate_similarity(
    reference_case: Dict,
    candidate_case: Dict,
    weights: SimilarityWeights,
    radius_miles: float = 100.0,
    age_range: int = 10,
    year_range: int = 5,
) -> Tuple[float, Dict[str, float]]:
    """Calculate similarity score between two cases.

    Args:
        reference_case: The case to compare against
        candidate_case: The case being evaluated
        weights: Similarity factor weights
        radius_miles: Maximum distance for geographic similarity
        age_range: Age difference threshold for full score
        year_range: Year difference threshold for full score

    Returns:
        Tuple of (overall_score, factor_scores)
    """
    factor_scores = {}

    # Weapon match (30% default)
    if reference_case.get("weapon") == candidate_case.get("weapon"):
        factor_scores["weapon"] = 100.0
    elif _same_weapon_category(
        reference_case.get("weapon_code"),
        candidate_case.get("weapon_code")
    ):
        factor_scores["weapon"] = 70.0
    else:
        factor_scores["weapon"] = 0.0

    # Geographic proximity (25% default)
    ref_lat = reference_case.get("latitude")
    ref_lon = reference_case.get("longitude")
    cand_lat = candidate_case.get("latitude")
    cand_lon = candidate_case.get("longitude")

    if all([ref_lat, ref_lon, cand_lat, cand_lon]):
        distance = haversine_distance(ref_lat, ref_lon, cand_lat, cand_lon)
        if distance <= radius_miles:
            factor_scores["geographic"] = max(0, 100 - (distance / radius_miles * 50))
        else:
            factor_scores["geographic"] = 0.0
    else:
        # Same county fallback
        if reference_case.get("county_fips_code") == candidate_case.get("county_fips_code"):
            factor_scores["geographic"] = 100.0
        else:
            factor_scores["geographic"] = 0.0

    # Victim age similarity (20% default)
    ref_age = reference_case.get("vic_age", 999)
    cand_age = candidate_case.get("vic_age", 999)

    if ref_age == 999 or cand_age == 999:
        factor_scores["victim_age"] = 50.0  # Neutral for unknown
    else:
        age_diff = abs(ref_age - cand_age)
        if age_diff <= age_range:
            factor_scores["victim_age"] = 100.0
        else:
            factor_scores["victim_age"] = max(0, 100 - (age_diff - age_range) * 5)

    # Temporal proximity (15% default)
    ref_year = reference_case.get("year", 0)
    cand_year = candidate_case.get("year", 0)
    year_diff = abs(ref_year - cand_year)

    if year_diff <= year_range:
        factor_scores["temporal"] = 100.0
    else:
        factor_scores["temporal"] = max(0, 100 - (year_diff - year_range) * 10)

    # Victim race match (5% default)
    factor_scores["victim_race"] = (
        100.0 if reference_case.get("vic_race") == candidate_case.get("vic_race")
        else 0.0
    )

    # Circumstance match (3% default)
    factor_scores["circumstance"] = (
        100.0 if reference_case.get("circumstance") == candidate_case.get("circumstance")
        else 0.0
    )

    # Relationship match (2% default)
    factor_scores["relationship"] = (
        100.0 if reference_case.get("relationship") == candidate_case.get("relationship")
        else 0.0
    )

    # Calculate weighted overall score
    overall_score = (
        factor_scores["weapon"] * weights.weapon +
        factor_scores["geographic"] * weights.geographic +
        factor_scores["victim_age"] * weights.victim_age +
        factor_scores["temporal"] * weights.temporal +
        factor_scores["victim_race"] * weights.victim_race +
        factor_scores["circumstance"] * weights.circumstance +
        factor_scores["relationship"] * weights.relationship
    )

    return overall_score, factor_scores


def _same_weapon_category(code1: Optional[int], code2: Optional[int]) -> bool:
    """Check if two weapon codes are in the same category."""
    if code1 is None or code2 is None:
        return False

    categories = {
        "firearms": {11, 12, 13, 14, 15},
        "sharp": {20},
        "blunt": {30},
        "personal": {40},
        "asphyxiation": {80, 85},
    }

    for category_codes in categories.values():
        if code1 in category_codes and code2 in category_codes:
            return True

    return False


def find_similar_cases(
    case_id: str,
    vic_sex_filter: Optional[str] = None,
    limit: int = 50,
    min_score: float = 30.0,
) -> List[SimilarCase]:
    """Find cases similar to the specified case.

    Args:
        case_id: ID of the reference case
        vic_sex_filter: Only compare with cases of same victim sex (required)
        limit: Maximum number of similar cases to return
        min_score: Minimum similarity score threshold

    Returns:
        List of similar cases sorted by similarity score
    """
    weights = SimilarityWeights()

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Get reference case
        cursor.execute(
            """
            SELECT id, state, year, month, vic_age, vic_sex, vic_race,
                   weapon, weapon_code, relationship, circumstance,
                   county_fips_code, latitude, longitude, solved
            FROM cases WHERE id = ?
            """,
            (case_id,)
        )
        ref_row = cursor.fetchone()

        if not ref_row:
            raise ValueError(f"Case not found: {case_id}")

        ref_case = dict(ref_row)

        # Get candidate cases (same victim sex, exclude reference case)
        vic_sex = vic_sex_filter or ref_case["vic_sex"]

        cursor.execute(
            """
            SELECT id, state, year, month, vic_age, vic_sex, vic_race,
                   weapon, weapon_code, relationship, circumstance,
                   county_fips_code, latitude, longitude, solved
            FROM cases
            WHERE vic_sex = ? AND id != ?
            LIMIT 50000
            """,
            (vic_sex, case_id)
        )

        similar_cases = []

        for row in cursor.fetchall():
            candidate = dict(row)
            score, factors = calculate_similarity(ref_case, candidate, weights)

            if score >= min_score:
                similar_cases.append(SimilarCase(
                    case_id=candidate["id"],
                    similarity_score=round(score, 1),
                    matching_factors={k: round(v, 1) for k, v in factors.items()},
                    case_data=candidate
                ))

        # Sort by score descending and limit
        similar_cases.sort(key=lambda x: x.similarity_score, reverse=True)
        return similar_cases[:limit]
```

#### B.1.2 API Route

**File:** `backend/routes/similarity.py`

```python
"""Similarity API routes for finding similar cases."""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from analysis.similarity import find_similar_cases, SimilarCase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/similarity", tags=["similarity"])


class SimilarCaseResponse(BaseModel):
    """Response model for a similar case."""
    case_id: str
    similarity_score: float
    matching_factors: dict
    year: int
    state: str
    weapon: str
    vic_age: int
    vic_sex: str
    vic_race: str
    solved: int
    circumstance: Optional[str]
    relationship: Optional[str]


class FindSimilarResponse(BaseModel):
    """Response model for find similar cases endpoint."""
    reference_case_id: str
    similar_cases: List[SimilarCaseResponse]
    total_found: int


@router.get("/find/{case_id}", response_model=FindSimilarResponse)
async def find_similar(
    case_id: str,
    limit: int = Query(default=50, ge=1, le=100, description="Max cases to return"),
    min_score: float = Query(default=30.0, ge=0, le=100, description="Min similarity score"),
) -> FindSimilarResponse:
    """Find cases similar to the specified case.

    Uses weighted multi-factor similarity scoring across:
    - Weapon type (30%)
    - Geographic proximity (25%)
    - Victim age similarity (20%)
    - Temporal proximity (15%)
    - Victim race (5%)
    - Circumstance (3%)
    - Relationship (2%)

    **Path Parameters:**
    - `case_id`: ID of the reference case

    **Query Parameters:**
    - `limit`: Maximum cases to return (default 50, max 100)
    - `min_score`: Minimum similarity score threshold (default 30)

    **Response:**
    - `reference_case_id`: The case being compared against
    - `similar_cases`: List of similar cases with scores and factors
    - `total_found`: Total number of similar cases found
    """
    logger.info(f"Finding similar cases for {case_id}, limit={limit}, min_score={min_score}")

    try:
        results = find_similar_cases(
            case_id=case_id,
            limit=limit,
            min_score=min_score,
        )

        similar_cases = [
            SimilarCaseResponse(
                case_id=r.case_id,
                similarity_score=r.similarity_score,
                matching_factors=r.matching_factors,
                year=r.case_data["year"],
                state=r.case_data["state"],
                weapon=r.case_data["weapon"],
                vic_age=r.case_data["vic_age"],
                vic_sex=r.case_data["vic_sex"],
                vic_race=r.case_data["vic_race"],
                solved=r.case_data["solved"],
                circumstance=r.case_data.get("circumstance"),
                relationship=r.case_data.get("relationship"),
            )
            for r in results
        ]

        logger.info(f"Found {len(similar_cases)} similar cases for {case_id}")

        return FindSimilarResponse(
            reference_case_id=case_id,
            similar_cases=similar_cases,
            total_found=len(similar_cases),
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error finding similar cases: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
```

#### B.1.3 Register Route

**Update:** `backend/main.py`

```python
# Add import
from routes.similarity import router as similarity_router

# Add router
app.include_router(similarity_router)
```

### B.2 Frontend Implementation

#### B.2.1 Similarity Types

**File:** `src/types/similarity.ts`

```typescript
export interface MatchingFactors {
  weapon: number
  geographic: number
  victim_age: number
  temporal: number
  victim_race: number
  circumstance: number
  relationship: number
}

export interface SimilarCase {
  case_id: string
  similarity_score: number
  matching_factors: MatchingFactors
  year: number
  state: string
  weapon: string
  vic_age: number
  vic_sex: string
  vic_race: string
  solved: number
  circumstance?: string
  relationship?: string
}

export interface FindSimilarResponse {
  reference_case_id: string
  similar_cases: SimilarCase[]
  total_found: number
}
```

#### B.2.2 Similarity Service

**File:** `src/services/similarity.ts`

```typescript
import axios from 'axios'
import type { FindSimilarResponse } from '../types/similarity'

const API_BASE = 'http://localhost:5000'

export async function findSimilarCases(
  caseId: string,
  options?: { limit?: number; minScore?: number }
): Promise<FindSimilarResponse> {
  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', options.limit.toString())
  if (options?.minScore) params.set('min_score', options.minScore.toString())

  const response = await axios.get<FindSimilarResponse>(
    `${API_BASE}/api/similarity/find/${caseId}?${params.toString()}`
  )
  return response.data
}
```

#### B.2.3 Similarity Hook

**File:** `src/hooks/useSimilarity.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { findSimilarCases } from '../services/similarity'

export function useSimilarCases(
  caseId: string | null,
  options?: { limit?: number; minScore?: number }
) {
  return useQuery({
    queryKey: ['similarCases', caseId, options],
    queryFn: () => findSimilarCases(caseId!, options),
    enabled: !!caseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

#### B.2.4 Similar Cases Modal

**File:** `src/components/cases/SimilarCasesModal.tsx`

```typescript
/**
 * Modal displaying cases similar to a reference case.
 */

import React from 'react'
import { useSimilarCases } from '../../hooks/useSimilarity'
import type { SimilarCase } from '../../types/similarity'
import './SimilarCasesModal.css'

interface SimilarCasesModalProps {
  caseId: string
  onClose: () => void
  onSelectCase: (caseId: string) => void
}

export const SimilarCasesModal: React.FC<SimilarCasesModalProps> = ({
  caseId,
  onClose,
  onSelectCase,
}) => {
  const { data, isLoading, error } = useSimilarCases(caseId, { limit: 50 })

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }

  const formatFactor = (name: string, value: number) => {
    const labels: Record<string, string> = {
      weapon: 'Weapon',
      geographic: 'Location',
      victim_age: 'Age',
      temporal: 'Time',
      victim_race: 'Race',
      circumstance: 'Circumstance',
      relationship: 'Relationship',
    }
    return `${labels[name] || name}: ${value.toFixed(0)}%`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="similar-cases-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Similar Cases</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-subheader">
          <p>Cases similar to <strong>{caseId}</strong></p>
        </div>

        <div className="modal-content">
          {isLoading && <div className="loading">Finding similar cases...</div>}

          {error && (
            <div className="error">
              Error finding similar cases. Please try again.
            </div>
          )}

          {data && data.similar_cases.length === 0 && (
            <div className="empty">No similar cases found.</div>
          )}

          {data && data.similar_cases.length > 0 && (
            <div className="similar-cases-list">
              <div className="results-count">
                Found {data.total_found} similar cases
              </div>

              {data.similar_cases.map((similar) => (
                <div
                  key={similar.case_id}
                  className="similar-case-card"
                  onClick={() => onSelectCase(similar.case_id)}
                >
                  <div className="case-header">
                    <span className="case-id">{similar.case_id}</span>
                    <span className={`score ${getScoreColor(similar.similarity_score)}`}>
                      {similar.similarity_score.toFixed(1)}% match
                    </span>
                  </div>

                  <div className="case-details">
                    <span>{similar.year}</span>
                    <span>{similar.state}</span>
                    <span>{similar.weapon}</span>
                    <span>{similar.vic_sex}, age {similar.vic_age}</span>
                    <span className={similar.solved ? 'solved' : 'unsolved'}>
                      {similar.solved ? 'Solved' : 'Unsolved'}
                    </span>
                  </div>

                  <div className="matching-factors">
                    {Object.entries(similar.matching_factors)
                      .filter(([_, value]) => value > 0)
                      .sort(([_, a], [__, b]) => b - a)
                      .slice(0, 4)
                      .map(([name, value]) => (
                        <span key={name} className="factor">
                          {formatFactor(name, value)}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### B.2.5 Update CaseDetail

**Update:** `src/components/cases/CaseDetail.tsx`

Add a "Find Similar Cases" button that opens the SimilarCasesModal:

```typescript
// Add state
const [showSimilarCases, setShowSimilarCases] = useState(false)

// Add button in the actions section
<button
  className="action-button"
  onClick={() => setShowSimilarCases(true)}
>
  🔍 Find Similar Cases
</button>

// Add modal
{showSimilarCases && (
  <SimilarCasesModal
    caseId={case.id}
    onClose={() => setShowSimilarCases(false)}
    onSelectCase={(id) => {
      setShowSimilarCases(false)
      // Navigate to selected case
    }}
  />
)}
```

---

## Feature C: Heatmap Layer

### Overview

Add a heatmap visualization layer to the MapView component using Leaflet.heat.

### C.1 Install Dependencies

```bash
npm install leaflet.heat
npm install -D @types/leaflet.heat
```

### C.2 Heatmap Layer Component

**File:** `src/components/map/HeatmapLayer.tsx`

```typescript
/**
 * HeatmapLayer - Renders a heat map overlay on the Leaflet map.
 */

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

interface HeatmapLayerProps {
  points: Array<{
    latitude: number
    longitude: number
    intensity?: number
  }>
  options?: {
    radius?: number
    blur?: number
    maxZoom?: number
    max?: number
    gradient?: Record<number, string>
  }
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  points,
  options = {},
}) => {
  const map = useMap()

  useEffect(() => {
    if (!points || points.length === 0) return

    // Convert points to heatmap format: [lat, lng, intensity]
    const heatData: [number, number, number][] = points.map((p) => [
      p.latitude,
      p.longitude,
      p.intensity ?? 1,
    ])

    // Create heatmap layer
    const heatLayer = (L as any).heatLayer(heatData, {
      radius: options.radius ?? 25,
      blur: options.blur ?? 15,
      maxZoom: options.maxZoom ?? 17,
      max: options.max ?? 1.0,
      gradient: options.gradient ?? {
        0.0: '#3388ff',
        0.25: '#00ff00',
        0.5: '#ffff00',
        0.75: '#ff8800',
        1.0: '#ff0000',
      },
    })

    heatLayer.addTo(map)

    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, points, options])

  return null
}
```

### C.3 Update MapView

**Update:** `src/components/map/MapView.tsx`

```typescript
// Add import
import { HeatmapLayer } from './HeatmapLayer'

// Add heatmap view mode to state
type ViewMode = 'markers' | 'choropleth' | 'heatmap'
const [viewMode, setViewMode] = useState<ViewMode>('choropleth')

// Add heatmap data transformation
const heatmapPoints = useMemo(() => {
  if (!countyData?.counties) return []

  return countyData.counties.map((county) => ({
    latitude: county.latitude,
    longitude: county.longitude,
    // Weight by unsolved cases for intensity
    intensity: Math.min(county.unsolved_cases / 100, 1),
  }))
}, [countyData])

// Add conditional rendering in MapContainer
{viewMode === 'heatmap' && heatmapPoints.length > 0 && (
  <HeatmapLayer
    points={heatmapPoints}
    options={{
      radius: 30,
      blur: 20,
      max: 1.0,
    }}
  />
)}
```

### C.4 Update MapControls

**Update:** `src/components/map/MapControls.tsx`

Add heatmap option to view mode selector:

```typescript
<div className="view-mode-selector">
  <button
    className={viewMode === 'choropleth' ? 'active' : ''}
    onClick={() => setViewMode('choropleth')}
  >
    Choropleth
  </button>
  <button
    className={viewMode === 'markers' ? 'active' : ''}
    onClick={() => setViewMode('markers')}
  >
    Markers
  </button>
  <button
    className={viewMode === 'heatmap' ? 'active' : ''}
    onClick={() => setViewMode('heatmap')}
  >
    Heatmap
  </button>
</div>
```

### C.5 Update MapLegend

**Update:** `src/components/map/MapLegend.tsx`

Add heatmap legend:

```typescript
{viewMode === 'heatmap' && (
  <div className="heatmap-legend">
    <h4>Case Density</h4>
    <div className="gradient-bar" />
    <div className="gradient-labels">
      <span>Low</span>
      <span>High</span>
    </div>
  </div>
)}
```

---

## Feature D: Remove Settings Button

### Overview

Remove the placeholder settings button from the header as it has no functionality.

### D.1 Implementation

**File:** `src/components/Layout/Header.tsx`

Remove lines 44-50:

```diff
      <div className="header-actions">
        <ThemeToggle />
-       <button
-         className="action-button settings-button"
-         aria-label="Settings"
-         title="Settings (Coming soon)"
-       >
-         ⚙️
-       </button>
      </div>
```

### D.2 Update Header CSS

**File:** `src/components/Layout/Header.css`

Remove settings button styles:

```diff
-.settings-button {
-  /* any specific settings button styles */
-}
```

---

## Implementation Timeline

| Week | Days | Feature | Tasks | Status |
|------|------|---------|-------|--------|
| **Week 1** | 1-2 | D. Remove Settings | Remove button, update CSS | ✅ Complete |
| | 2-5 | A. Backend Tests | test_map.py, test_timeline.py, test_statistics.py | ✅ Complete |
| **Week 2** | 6-8 | A. Frontend Tests | MapView, TimelineView, StatisticsView tests | ✅ Complete |
| | 8-10 | C. Heatmap Layer | Install deps, create component, integrate | ✅ Complete |
| **Week 3** | 10-12 | B. Similarity Backend | Algorithm, API route, tests | ✅ Complete |
| | 12-15 | B. Similarity Frontend | Types, service, hook, modal, CaseDetail update | ✅ Complete |

### Effort Summary

| Feature | Backend | Frontend | Total |
|---------|---------|----------|-------|
| A. Phase 2 Tests | 4 days | 4 days | 8 days |
| B. Find Similar Cases | 2 days | 2 days | 4 days |
| C. Heatmap Layer | 0 days | 1.5 days | 1.5 days |
| D. Remove Settings | 0 days | 0.5 days | 0.5 days |
| **Total** | **6 days** | **8 days** | **14 days** |

---

## Testing Strategy

### Unit Tests

- **Backend:** pytest with mocked database
- **Frontend:** vitest with React Testing Library

### Integration Tests

- API endpoint testing with test database
- Component integration with mocked services

### Manual Testing Checklist

#### Phase 2 Test Coverage
- [x] All backend tests pass (test_map.py, test_timeline.py, test_statistics.py)
- [x] All frontend tests pass (MapView ✅, TimelineView ✅, StatisticsView ✅)
- [ ] Coverage meets 85% target

#### Find Similar Cases
- [x] Find similar button appears in case detail
- [x] Modal opens with loading state
- [x] Similar cases display with scores
- [x] Matching factors shown correctly
- [x] Clicking a similar case navigates to it
- [x] Empty state shown when no similar cases

#### Heatmap Layer
- [x] Heatmap toggle button appears in map controls
- [x] Heatmap renders correctly
- [x] Heatmap intensity reflects case density
- [x] Legend updates for heatmap mode
- [x] Performance acceptable with full dataset

#### Remove Settings Button
- [x] Settings button removed from header
- [x] No visual artifacts remain
- [x] Theme toggle still works

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Leaflet.heat compatibility | Low | Medium | Test early, fallback to markers |
| Similarity query performance | Medium | High | Add database indexes, limit candidates |
| Test flakiness | Medium | Low | Use stable mocks, avoid timing dependencies |
| Heatmap memory with large dataset | Low | Medium | Aggregate by county, limit point count |

---

## Appendix: File Locations

### New Files

```
backend/
├── analysis/
│   └── similarity.py           # Similarity algorithm
├── routes/
│   └── similarity.py           # Similarity API route
tests/
├── backend/
│   └── test_routes/
│       ├── test_map.py         # Map route tests
│       ├── test_timeline.py    # Timeline route tests
│       └── test_statistics.py  # Statistics route tests
├── frontend/
│   └── components/
│       ├── MapView.test.tsx
│       ├── TimelineView.test.tsx
│       └── StatisticsView.test.tsx
src/
├── components/
│   ├── cases/
│   │   ├── SimilarCasesModal.tsx
│   │   └── SimilarCasesModal.css
│   └── map/
│       └── HeatmapLayer.tsx
├── hooks/
│   └── useSimilarity.ts
├── services/
│   └── similarity.ts
└── types/
    └── similarity.ts
```

### Modified Files

```
backend/main.py                  # Add similarity router
src/components/Layout/Header.tsx # Remove settings button
src/components/Layout/Header.css # Remove settings styles
src/components/map/MapView.tsx   # Add heatmap integration
src/components/map/MapControls.tsx # Add heatmap toggle
src/components/map/MapLegend.tsx # Add heatmap legend
src/components/cases/CaseDetail.tsx # Add find similar button
```
