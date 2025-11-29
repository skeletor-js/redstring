# Implementation Plan: Map, Timeline, Statistics Features + Cluster Placeholder

**Document Version:** 1.0  
**Created:** November 28, 2024  
**Status:** Ready for Review  
**Estimated Duration:** 15-20 days

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Feature A: Cluster "Coming Soon" Placeholder](#feature-a-cluster-coming-soon-placeholder)
4. [Feature B: Map Visualization](#feature-b-map-visualization)
5. [Feature C: Timeline Visualization](#feature-c-timeline-visualization)
6. [Feature D: Statistics Dashboard](#feature-d-statistics-dashboard)
7. [Implementation Phases](#implementation-phases)
8. [Technical Specifications](#technical-specifications)
9. [Risk Assessment](#risk-assessment)
10. [Testing Strategy](#testing-strategy)

---

## Executive Summary

This document outlines the implementation plan for four features in the RedString Murder Accountability Project Case Analyzer:

1. **Cluster "Coming Soon" Placeholder** - Replace the existing ClusterView with a friendly placeholder message
2. **Map Visualization** - Interactive geographic visualization of crime data with heat maps and marker clusters
3. **Timeline Visualization** - Temporal analysis and navigation of cases over time
4. **Statistics Dashboard** - Comprehensive metrics, charts, and data analysis tools

### Current State Analysis

The RedString application is a production-ready MVP Phase 1 with:
- **Frontend:** React 18 + TypeScript + Vite + Electron
- **Backend:** Python FastAPI with SQLite database
- **Data:** 894,636 homicide records (1976-2023) with geographic coordinates
- **Existing Features:** Case filtering, case table with virtualization, cluster analysis (to be replaced)

### Key Integration Points

| Component | Location | Purpose |
|-----------|----------|---------|
| [`Layout.tsx`](../src/components/Layout/Layout.tsx:11) | Main content router | Tab-based view switching |
| [`useUIStore.ts`](../src/stores/useUIStore.ts:13) | UI state management | Active tab, theme, modals |
| [`useFilterStore.ts`](../src/stores/useFilterStore.ts) | Filter state | Shared filter criteria |
| [`cases.py`](../backend/routes/cases.py:35) | Backend API | Case data endpoints |
| [`schema.py`](../backend/database/schema.py:24) | Database schema | Cases table with lat/long |

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ELECTRON RENDERER (REACT)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Filters    │  │   Clusters   │  │     Map      │  │   Timeline   │     │
│  │    View      │  │  Coming Soon │  │     View     │  │     View     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                              │
│  ┌──────────────┐  ┌─────────────────────────────────────────────────────┐  │
│  │  Statistics  │  │                  Shared Components                   │  │
│  │     View     │  │  FilterPanel | CaseTable | CaseDetail | ExportBtn   │  │
│  └──────────────┘  └─────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         State Management Layer                          ││
│  │  useFilterStore | useUIStore | TanStack Query | Zustand                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP REST API
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PYTHON BACKEND (FastAPI)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  /api/cases  │  │  /api/map    │  │ /api/timeline│  │  /api/stats  │     │
│  │   existing   │  │     NEW      │  │     NEW      │  │     NEW      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         SQLite Database                                  ││
│  │  cases table: 894,636 records with latitude, longitude, county_fips     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow for New Features

```
User Interaction → Filter Store → API Request → Backend Query → Response → UI Update
       │                │                                              │
       │                └──────── Shared Filter State ─────────────────┘
       │
       └── Map: Geographic aggregation by county/state
       └── Timeline: Temporal aggregation by year/month
       └── Stats: Multi-dimensional aggregation
```

---

## Feature A: Cluster "Coming Soon" Placeholder

### Overview

Replace the existing [`ClusterView`](../src/components/clusters/ClusterView.tsx:22) component with a simple, friendly placeholder indicating the feature is under development.

### Requirements

- Simple, clean design matching the "Forensic Minimalism" aesthetic
- Friendly message: "Coming soon! We're working out some kinks."
- Maintain navigation structure (tab still visible and clickable)
- No backend changes required

### Implementation Details

#### A.1 New Component: `ComingSoon.tsx`

**Location:** `src/components/common/ComingSoon.tsx`

```typescript
interface ComingSoonProps {
  title: string;
  message?: string;
  icon?: string;
}

export function ComingSoon({ 
  title, 
  message = "Coming soon! We're working out some kinks.",
  icon = "🔧"
}: ComingSoonProps) {
  return (
    <div className="coming-soon">
      <div className="coming-soon-icon">{icon}</div>
      <h2 className="coming-soon-title">{title}</h2>
      <p className="coming-soon-message">{message}</p>
    </div>
  );
}
```

#### A.2 Update Layout.tsx

**File:** [`src/components/Layout/Layout.tsx`](../src/components/Layout/Layout.tsx:11)

```typescript
// Replace ClusterView import with ComingSoon
import { ComingSoon } from '../common/ComingSoon';

// In renderContent switch statement:
case 'clusters':
  return (
    <ComingSoon 
      title="Cluster Analysis"
      message="Coming soon! We're working out some kinks."
      icon="🎯"
    />
  );
```

#### A.3 Styling

**File:** `src/components/common/ComingSoon.css`

```css
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
}

.coming-soon-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

.coming-soon-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

.coming-soon-message {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  max-width: 400px;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/common/ComingSoon.tsx` | Create | Reusable placeholder component |
| `src/components/common/ComingSoon.css` | Create | Placeholder styling |
| `src/components/common/index.ts` | Create | Component exports |
| `src/components/Layout/Layout.tsx` | Modify | Update clusters case |

### Estimated Effort: 2 hours

---

## Feature B: Map Visualization

### Overview

Interactive map visualization showing geographic distribution of homicide cases with heat maps, marker clusters, and integration with the existing filter system.

### Requirements (from PRD Section F5.1)

- Plot case counts on interactive map using county centroids
- Choropleth visualization showing case density by geography
- Cluster markers for county/state level aggregations
- Color code by: solved status, victim sex, weapon type, or decade
- Click marker to see aggregated statistics and drill down to cases
- Filter map to current query results

### Data Analysis

**Available Geographic Data:**
- [`US County Centroids.csv`](../resources/data/US County Centroids.csv) - County coordinates (state, county, cfips, latitude, longitude)
- Cases table has `latitude`, `longitude`, `county_fips_code`, `state` columns
- ~3,079 unique counties in dataset

### Technology Selection

**Recommended: Leaflet.js with React-Leaflet**

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Leaflet** | Free, lightweight, great React support, offline-capable | Less fancy than Mapbox | ✅ Selected |
| Mapbox GL | Beautiful maps, 3D support | Requires API key, usage limits | ❌ |
| MapLibre GL | Open source Mapbox fork | More complex setup | ❌ |

**Rationale:** Leaflet is ideal for a desktop Electron app because:
1. No API key required (works offline)
2. Excellent React integration via react-leaflet
3. Built-in marker clustering support
4. Lightweight bundle size (~40KB)

### Implementation Details

#### B.1 Backend Endpoints

**File:** `backend/routes/map.py`

```python
router = APIRouter(prefix="/api/map", tags=["map"])

@router.get("/aggregated")
async def get_map_aggregation(
    group_by: str = Query("county", enum=["county", "state"]),
    color_by: str = Query("solve_rate", enum=["solve_rate", "total", "unsolved"]),
    # ... filter parameters from CaseFilter
) -> MapAggregationResponse:
    """Get aggregated case data for map visualization."""
    pass

@router.get("/county/{county_fips}")
async def get_county_detail(county_fips: int) -> CountyDetailResponse:
    """Get detailed statistics for a specific county."""
    pass

@router.get("/heatmap")
async def get_heatmap_data(
    # ... filter parameters
) -> List[HeatmapPoint]:
    """Get individual case coordinates for heatmap layer."""
    pass
```

**Response Models:**

```python
class MapAggregationResponse(BaseModel):
    features: List[MapFeature]
    bounds: MapBounds
    total_cases: int
    
class MapFeature(BaseModel):
    id: str  # county_fips or state code
    name: str
    latitude: float
    longitude: float
    total_cases: int
    solved_cases: int
    unsolved_cases: int
    solve_rate: float
    primary_weapon: str
    year_range: Tuple[int, int]

class HeatmapPoint(BaseModel):
    latitude: float
    longitude: float
    weight: float  # intensity based on case count
```

#### B.2 Frontend Components

**Component Structure:**

```
src/components/map/
├── MapView.tsx           # Main container with controls
├── MapView.css           # Styling
├── MapContainer.tsx      # Leaflet map wrapper
├── MapControls.tsx       # Layer toggles, color-by selector
├── MapLegend.tsx         # Color scale legend
├── CountyPopup.tsx       # Popup content for county markers
├── hooks/
│   └── useMapData.ts     # TanStack Query hooks for map data
├── layers/
│   ├── ChoroplethLayer.tsx   # State/county fill colors
│   ├── MarkerClusterLayer.tsx # Clustered markers
│   └── HeatmapLayer.tsx      # Heat map overlay
└── index.ts
```

**MapView.tsx Structure:**

```typescript
export function MapView() {
  const filters = useFilterStore();
  const [viewMode, setViewMode] = useState<'markers' | 'choropleth' | 'heatmap'>('markers');
  const [colorBy, setColorBy] = useState<'solve_rate' | 'total' | 'unsolved'>('solve_rate');
  const [groupBy, setGroupBy] = useState<'county' | 'state'>('county');
  
  const { data, isLoading } = useMapAggregation({ filters, groupBy, colorBy });
  
  return (
    <div className="map-view">
      <MapControls 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        colorBy={colorBy}
        onColorByChange={setColorBy}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />
      <MapContainer center={[39.8283, -98.5795]} zoom={4}>
        {viewMode === 'markers' && <MarkerClusterLayer data={data} />}
        {viewMode === 'choropleth' && <ChoroplethLayer data={data} colorBy={colorBy} />}
        {viewMode === 'heatmap' && <HeatmapLayer filters={filters} />}
        <MapLegend colorBy={colorBy} />
      </MapContainer>
      <CountyPopup />
    </div>
  );
}
```

#### B.3 Map Interactions

| Interaction | Behavior |
|-------------|----------|
| Click marker | Show popup with county stats |
| Click "View Cases" in popup | Filter case table to that county |
| Zoom in | Show more granular data (county vs state) |
| Toggle layer | Switch between markers/choropleth/heatmap |
| Change color-by | Re-color markers based on selected metric |

#### B.4 Color Scales

```typescript
// Solve rate: Green (high) → Red (low)
const solveRateScale = {
  0: '#dc3545',    // 0-20% - Red
  20: '#fd7e14',   // 20-40% - Orange
  40: '#ffc107',   // 40-60% - Yellow
  60: '#28a745',   // 60-80% - Green
  80: '#20c997',   // 80-100% - Teal
};

// Case count: Light → Dark blue
const caseCountScale = {
  low: '#cce5ff',
  medium: '#66b3ff',
  high: '#0066cc',
  veryHigh: '#003366',
};
```

### Dependencies to Add

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "leaflet.markercluster": "^1.5.3",
    "leaflet.heat": "^0.2.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8"
  }
}
```

### Files to Create

| File | Description |
|------|-------------|
| `backend/routes/map.py` | Map API endpoints |
| `backend/models/map.py` | Pydantic models for map responses |
| `backend/services/map_service.py` | Map data aggregation logic |
| `src/components/map/MapView.tsx` | Main map component |
| `src/components/map/MapView.css` | Map styling |
| `src/components/map/MapContainer.tsx` | Leaflet wrapper |
| `src/components/map/MapControls.tsx` | Control panel |
| `src/components/map/MapLegend.tsx` | Legend component |
| `src/components/map/CountyPopup.tsx` | Popup content |
| `src/components/map/layers/*.tsx` | Layer components |
| `src/components/map/hooks/useMapData.ts` | Data fetching hooks |
| `src/services/map.ts` | API client |
| `src/types/map.ts` | TypeScript types |

### Estimated Effort: 5-6 days

---

## Feature C: Timeline Visualization

### Overview

Temporal visualization of cases allowing users to see trends over time, navigate through different time periods, and analyze patterns.

### Requirements (from PRD Section F5.2)

- Horizontal timeline of cases
- Filterable by current query
- Color code by attribute
- Zoom to year/decade level
- Show density/frequency

### Implementation Details

#### C.1 Backend Endpoints

**File:** `backend/routes/timeline.py`

```python
router = APIRouter(prefix="/api/timeline", tags=["timeline"])

@router.get("/aggregated")
async def get_timeline_aggregation(
    granularity: str = Query("year", enum=["year", "month", "decade"]),
    group_by: str = Query(None, enum=["solved", "vic_sex", "weapon", "state"]),
    # ... filter parameters
) -> TimelineAggregationResponse:
    """Get aggregated case counts over time."""
    pass

@router.get("/trends")
async def get_trend_analysis(
    metric: str = Query("solve_rate", enum=["solve_rate", "total", "unsolved"]),
    # ... filter parameters
) -> TrendAnalysisResponse:
    """Get trend analysis with moving averages."""
    pass
```

**Response Models:**

```python
class TimelineDataPoint(BaseModel):
    period: str  # "1990" or "1990-01" or "1990s"
    total_cases: int
    solved_cases: int
    unsolved_cases: int
    solve_rate: float
    breakdown: Optional[Dict[str, int]]  # If group_by specified

class TimelineAggregationResponse(BaseModel):
    data: List[TimelineDataPoint]
    granularity: str
    date_range: Tuple[str, str]
    total_cases: int

class TrendAnalysisResponse(BaseModel):
    data: List[TimelineDataPoint]
    trend_direction: str  # "increasing", "decreasing", "stable"
    moving_average: List[float]
    year_over_year_change: float
```

#### C.2 Frontend Components

**Component Structure:**

```
src/components/timeline/
├── TimelineView.tsx          # Main container
├── TimelineView.css          # Styling
├── TimelineChart.tsx         # Main chart (Recharts)
├── TimelineControls.tsx      # Granularity, group-by selectors
├── TimelineBrush.tsx         # Date range selector
├── TimelineTooltip.tsx       # Hover tooltip
├── TrendIndicator.tsx        # Trend direction indicator
├── hooks/
│   └── useTimelineData.ts    # Data fetching hooks
└── index.ts
```

**TimelineView.tsx Structure:**

```typescript
export function TimelineView() {
  const filters = useFilterStore();
  const [granularity, setGranularity] = useState<'year' | 'month' | 'decade'>('year');
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<[number, number]>([1976, 2023]);
  
  const { data, isLoading } = useTimelineAggregation({ 
    filters, 
    granularity, 
    groupBy 
  });
  
  return (
    <div className="timeline-view">
      <TimelineControls
        granularity={granularity}
        onGranularityChange={setGranularity}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />
      <div className="timeline-chart-container">
        <TimelineChart 
          data={data}
          groupBy={groupBy}
          onRangeSelect={handleRangeSelect}
        />
        <TimelineBrush
          range={selectedRange}
          onChange={setSelectedRange}
        />
      </div>
      <TrendIndicator data={data} />
    </div>
  );
}
```

#### C.3 Chart Configuration

Using **Recharts** (already in project dependencies):

```typescript
// TimelineChart.tsx
<ResponsiveContainer width="100%" height={400}>
  <ComposedChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="period" />
    <YAxis yAxisId="left" />
    <YAxis yAxisId="right" orientation="right" />
    
    {/* Stacked area for solved/unsolved */}
    <Area 
      yAxisId="left"
      type="monotone" 
      dataKey="solved_cases" 
      stackId="1"
      fill="var(--color-success)" 
    />
    <Area 
      yAxisId="left"
      type="monotone" 
      dataKey="unsolved_cases" 
      stackId="1"
      fill="var(--color-danger)" 
    />
    
    {/* Line for solve rate */}
    <Line 
      yAxisId="right"
      type="monotone" 
      dataKey="solve_rate" 
      stroke="var(--color-accent)"
    />
    
    <Tooltip content={<TimelineTooltip />} />
    <Legend />
    <Brush dataKey="period" height={30} />
  </ComposedChart>
</ResponsiveContainer>
```

#### C.4 Timeline Interactions

| Interaction | Behavior |
|-------------|----------|
| Hover on bar/area | Show tooltip with period details |
| Click on period | Filter case table to that time period |
| Drag brush | Select date range for filtering |
| Change granularity | Re-aggregate data (year/month/decade) |
| Change group-by | Show stacked breakdown by category |

### Files to Create

| File | Description |
|------|-------------|
| `backend/routes/timeline.py` | Timeline API endpoints |
| `backend/models/timeline.py` | Pydantic models |
| `backend/services/timeline_service.py` | Aggregation logic |
| `src/components/timeline/TimelineView.tsx` | Main component |
| `src/components/timeline/TimelineView.css` | Styling |
| `src/components/timeline/TimelineChart.tsx` | Recharts chart |
| `src/components/timeline/TimelineControls.tsx` | Controls |
| `src/components/timeline/TimelineBrush.tsx` | Date selector |
| `src/components/timeline/TimelineTooltip.tsx` | Tooltip |
| `src/components/timeline/TrendIndicator.tsx` | Trend display |
| `src/components/timeline/hooks/useTimelineData.ts` | Hooks |
| `src/services/timeline.ts` | API client |
| `src/types/timeline.ts` | TypeScript types |

### Estimated Effort: 4-5 days

---

## Feature D: Statistics Dashboard

### Overview

Comprehensive dashboard with key metrics, charts, and data analysis tools for exploring homicide patterns across multiple dimensions.

### Requirements (from PRD Section F5.3)

- Solve Rate by Year — Line chart showing trend
- Victim Demographics — Pie/bar charts (sex, race, age distribution)
- Weapon Distribution — Bar chart
- Circumstances Breakdown — Bar chart
- Geographic Distribution — Choropleth map by state
- Monthly Patterns — Seasonal analysis

### Implementation Details

#### D.1 Backend Endpoints

**File:** `backend/routes/stats.py`

```python
router = APIRouter(prefix="/api/stats", tags=["statistics"])

@router.get("/dashboard")
async def get_dashboard_stats(
    # ... filter parameters
) -> DashboardStatsResponse:
    """Get all dashboard statistics in one request."""
    pass

@router.get("/demographics")
async def get_demographic_breakdown(
    dimension: str = Query(..., enum=["vic_sex", "vic_race", "vic_age", "off_sex"]),
    # ... filter parameters
) -> DemographicBreakdownResponse:
    """Get breakdown by demographic dimension."""
    pass

@router.get("/weapons")
async def get_weapon_distribution(
    # ... filter parameters
) -> WeaponDistributionResponse:
    """Get weapon type distribution."""
    pass

@router.get("/circumstances")
async def get_circumstance_breakdown(
    # ... filter parameters
) -> CircumstanceBreakdownResponse:
    """Get circumstance/motive breakdown."""
    pass

@router.get("/geographic")
async def get_geographic_distribution(
    # ... filter parameters
) -> GeographicDistributionResponse:
    """Get case distribution by state."""
    pass

@router.get("/seasonal")
async def get_seasonal_patterns(
    # ... filter parameters
) -> SeasonalPatternsResponse:
    """Get monthly/seasonal patterns."""
    pass

@router.get("/export")
async def export_statistics(
    format: str = Query("csv", enum=["csv", "json"]),
    # ... filter parameters
) -> StreamingResponse:
    """Export statistics report."""
    pass
```

**Response Models:**

```python
class DashboardStatsResponse(BaseModel):
    summary: StatsSummary
    solve_rate_trend: List[YearlyStats]
    top_states: List[StateStats]
    weapon_distribution: List[CategoryCount]
    victim_demographics: DemographicSummary
    
class DemographicBreakdownResponse(BaseModel):
    dimension: str
    categories: List[CategoryCount]
    total: int
    
class CategoryCount(BaseModel):
    category: str
    count: int
    percentage: float
    solved_count: int
    solve_rate: float
```

#### D.2 Frontend Components

**Component Structure:**

```
src/components/stats/
├── StatsView.tsx             # Main dashboard container
├── StatsView.css             # Dashboard styling
├── cards/
│   ├── SummaryCard.tsx       # Key metrics card
│   ├── TrendCard.tsx         # Solve rate trend
│   ├── DemographicsCard.tsx  # Victim demographics
│   ├── WeaponsCard.tsx       # Weapon distribution
│   ├── CircumstancesCard.tsx # Circumstances breakdown
│   ├── GeographicCard.tsx    # State distribution
│   └── SeasonalCard.tsx      # Monthly patterns
├── charts/
│   ├── PieChart.tsx          # Reusable pie chart
│   ├── BarChart.tsx          # Reusable bar chart
│   ├── LineChart.tsx         # Reusable line chart
│   └── MiniMap.tsx           # Small US map
├── ExportButton.tsx          # Export statistics
├── hooks/
│   └── useStatsData.ts       # Data fetching hooks
└── index.ts
```

**StatsView.tsx Structure:**

```typescript
export function StatsView() {
  const filters = useFilterStore();
  const { data: dashboard, isLoading } = useDashboardStats(filters);
  
  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2>Statistics Dashboard</h2>
        <ExportButton filters={filters} />
      </div>
      
      <div className="stats-grid">
        {/* Row 1: Summary Cards */}
        <SummaryCard 
          title="Total Cases"
          value={dashboard?.summary.total_cases}
          icon="📊"
        />
        <SummaryCard 
          title="Solve Rate"
          value={dashboard?.summary.solve_rate}
          format="percentage"
          trend={dashboard?.solve_rate_trend}
          icon="✅"
        />
        <SummaryCard 
          title="Unsolved Cases"
          value={dashboard?.summary.unsolved_cases}
          icon="❓"
        />
        
        {/* Row 2: Charts */}
        <TrendCard data={dashboard?.solve_rate_trend} />
        <DemographicsCard data={dashboard?.victim_demographics} />
        
        {/* Row 3: Distributions */}
        <WeaponsCard data={dashboard?.weapon_distribution} />
        <CircumstancesCard />
        
        {/* Row 4: Geographic & Seasonal */}
        <GeographicCard data={dashboard?.top_states} />
        <SeasonalCard />
      </div>
    </div>
  );
}
```

#### D.3 Dashboard Layout

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Summary cards span 1 column each */
.summary-card {
  grid-column: span 1;
}

/* Trend chart spans 2 columns */
.trend-card {
  grid-column: span 2;
}

/* Demographics spans 1 column */
.demographics-card {
  grid-column: span 1;
}

/* Weapons and circumstances each span 1.5 columns */
.weapons-card,
.circumstances-card {
  grid-column: span 1;
}

/* Geographic spans 2 columns */
.geographic-card {
  grid-column: span 2;
}

/* Seasonal spans 1 column */
.seasonal-card {
  grid-column: span 1;
}
```

#### D.4 Chart Types by Metric

| Metric | Chart Type | Library |
|--------|------------|---------|
| Solve Rate Trend | Line/Area | Recharts |
| Victim Sex | Pie | Recharts |
| Victim Race | Horizontal Bar | Recharts |
| Victim Age | Histogram | Recharts |
| Weapons | Bar | Recharts |
| Circumstances | Horizontal Bar | Recharts |
| Geographic | Mini choropleth | Leaflet |
| Seasonal | Line | Recharts |

#### D.5 Export Functionality

```typescript
// ExportButton.tsx
export function ExportButton({ filters }: { filters: FilterState }) {
  const handleExport = async (format: 'csv' | 'json') => {
    const response = await api.get('/api/stats/export', {
      params: { format, ...filterToParams(filters) },
      responseType: 'blob',
    });
    
    const filename = `redstring-stats-${Date.now()}.${format}`;
    downloadBlob(response.data, filename);
  };
  
  return (
    <div className="export-dropdown">
      <button onClick={() => handleExport('csv')}>Export CSV</button>
      <button onClick={() => handleExport('json')}>Export JSON</button>
    </div>
  );
}
```

### Files to Create

| File | Description |
|------|-------------|
| `backend/routes/stats.py` | Statistics API endpoints |
| `backend/models/stats.py` | Pydantic models |
| `backend/services/stats_service.py` | Aggregation logic |
| `src/components/stats/StatsView.tsx` | Main dashboard |
| `src/components/stats/StatsView.css` | Dashboard styling |
| `src/components/stats/cards/*.tsx` | Individual stat cards |
| `src/components/stats/charts/*.tsx` | Reusable chart components |
| `src/components/stats/ExportButton.tsx` | Export functionality |
| `src/components/stats/hooks/useStatsData.ts` | Data hooks |
| `src/services/stats.ts` | API client |
| `src/types/stats.ts` | TypeScript types |

### Estimated Effort: 5-6 days

---

## Implementation Phases

### Phase Overview

```
Week 1: Foundation + Cluster Placeholder + Map Start
Week 2: Map Completion + Timeline
Week 3: Statistics + Integration + Testing
```

### Detailed Phase Breakdown

#### Phase 1: Foundation & Cluster Placeholder (Days 1-2)

**Parallelizable: Yes (can be done by 1 developer)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create ComingSoon component | 1 hour | None |
| Update Layout.tsx for clusters | 30 min | ComingSoon |
| Add common component exports | 30 min | ComingSoon |
| Test cluster placeholder | 30 min | All above |

**Deliverables:**
- [ ] `src/components/common/ComingSoon.tsx`
- [ ] `src/components/common/ComingSoon.css`
- [ ] Updated `src/components/Layout/Layout.tsx`
- [ ] Cluster tab shows placeholder

#### Phase 2: Map Backend (Days 2-4)

**Parallelizable: Yes (backend developer)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create map models | 2 hours | None |
| Implement map service | 4 hours | Models |
| Create map routes | 3 hours | Service |
| Add map route to main.py | 30 min | Routes |
| Write backend tests | 3 hours | All above |

**Deliverables:**
- [ ] `backend/models/map.py`
- [ ] `backend/services/map_service.py`
- [ ] `backend/routes/map.py`
- [ ] `tests/backend/test_routes/test_map.py`

#### Phase 3: Map Frontend (Days 4-7)

**Parallelizable: Yes (frontend developer, after Phase 2)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| Install Leaflet dependencies | 30 min | None |
| Create map types | 1 hour | None |
| Create map API service | 1 hour | Types |
| Create useMapData hooks | 2 hours | API service |
| Create MapContainer | 2 hours | Hooks |
| Create layer components | 4 hours | MapContainer |
| Create MapControls | 2 hours | Layers |
| Create MapLegend | 1 hour | Controls |
| Create CountyPopup | 1 hour | Layers |
| Create MapView | 2 hours | All above |
| Update Layout.tsx | 30 min | MapView |
| Write frontend tests | 3 hours | All above |

**Deliverables:**
- [ ] `src/types/map.ts`
- [ ] `src/services/map.ts`
- [ ] `src/components/map/*`
- [ ] Map tab functional

#### Phase 4: Timeline Backend (Days 7-8)

**Parallelizable: Yes (can start during Phase 3)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create timeline models | 1 hour | None |
| Implement timeline service | 3 hours | Models |
| Create timeline routes | 2 hours | Service |
| Write backend tests | 2 hours | All above |

**Deliverables:**
- [ ] `backend/models/timeline.py`
- [ ] `backend/services/timeline_service.py`
- [ ] `backend/routes/timeline.py`
- [ ] `tests/backend/test_routes/test_timeline.py`

#### Phase 5: Timeline Frontend (Days 8-10)

**Parallelizable: Yes (after Phase 4)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create timeline types | 1 hour | None |
| Create timeline API service | 1 hour | Types |
| Create useTimelineData hooks | 2 hours | API service |
| Create TimelineChart | 3 hours | Hooks |
| Create TimelineControls | 2 hours | Chart |
| Create TimelineBrush | 2 hours | Chart |
| Create TrendIndicator | 1 hour | Chart |
| Create TimelineView | 2 hours | All above |
| Update Layout.tsx | 30 min | TimelineView |
| Write frontend tests | 2 hours | All above |

**Deliverables:**
- [ ] `src/types/timeline.ts`
- [ ] `src/services/timeline.ts`
- [ ] `src/components/timeline/*`
- [ ] Timeline tab functional

#### Phase 6: Statistics Backend (Days 10-12)

**Parallelizable: Yes (can start during Phase 5)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create stats models | 2 hours | None |
| Implement stats service | 4 hours | Models |
| Create stats routes | 3 hours | Service |
| Implement export endpoint | 2 hours | Service |
| Write backend tests | 3 hours | All above |

**Deliverables:**
- [ ] `backend/models/stats.py`
- [ ] `backend/services/stats_service.py`
- [ ] `backend/routes/stats.py`
- [ ] `tests/backend/test_routes/test_stats.py`

#### Phase 7: Statistics Frontend (Days 12-15)

**Parallelizable: Yes (after Phase 6)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create stats types | 1 hour | None |
| Create stats API service | 1 hour | Types |
| Create useStatsData hooks | 2 hours | API service |
| Create reusable chart components | 3 hours | Hooks |
| Create SummaryCard | 1 hour | Charts |
| Create TrendCard | 2 hours | Charts |
| Create DemographicsCard | 2 hours | Charts |
| Create WeaponsCard | 1 hour | Charts |
| Create CircumstancesCard | 1 hour | Charts |
| Create GeographicCard | 2 hours | Charts |
| Create SeasonalCard | 1 hour | Charts |
| Create ExportButton | 1 hour | API service |
| Create StatsView | 2 hours | All cards |
| Update Layout.tsx | 30 min | StatsView |
| Write frontend tests | 3 hours | All above |

**Deliverables:**
- [ ] `src/types/stats.ts`
- [ ] `src/services/stats.ts`
- [ ] `src/components/stats/*`
- [ ] Statistics tab functional

#### Phase 8: Integration & Polish (Days 15-17)

| Task | Duration | Dependencies |
|------|----------|--------------|
| Cross-feature filter integration | 4 hours | All features |
| Performance optimization | 4 hours | All features |
| Accessibility audit | 2 hours | All features |
| Dark/light theme verification | 2 hours | All features |
| Documentation updates | 3 hours | All features |
| End-to-end testing | 4 hours | All features |

**Deliverables:**
- [ ] All features integrated with filter system
- [ ] Performance benchmarks met
- [ ] WCAG 2.1 AA compliance verified
- [ ] Updated documentation

### Gantt Chart (Simplified)

```
Day:  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17
      ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
P1:   ████                                                              Placeholder
P2:       ████████                                                      Map Backend
P3:               ████████████                                          Map Frontend
P4:                       ████                                          Timeline BE
P5:                           ████████                                  Timeline FE
P6:                               ████████                              Stats BE
P7:                                       ████████████                  Stats FE
P8:                                                   ████████          Integration
```

---

## Technical Specifications

### API Endpoint Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/map/aggregated` | GET | Aggregated map data |
| `/api/map/county/{fips}` | GET | County detail |
| `/api/map/heatmap` | GET | Heatmap points |
| `/api/timeline/aggregated` | GET | Timeline data |
| `/api/timeline/trends` | GET | Trend analysis |
| `/api/stats/dashboard` | GET | Dashboard stats |
| `/api/stats/demographics` | GET | Demographic breakdown |
| `/api/stats/weapons` | GET | Weapon distribution |
| `/api/stats/circumstances` | GET | Circumstance breakdown |
| `/api/stats/geographic` | GET | Geographic distribution |
| `/api/stats/seasonal` | GET | Seasonal patterns |
| `/api/stats/export` | GET | Export statistics |

### New Dependencies

**Frontend (package.json):**

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "leaflet.markercluster": "^1.5.3",
    "leaflet.heat": "^0.2.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8"
  }
}
```

**Backend (requirements.txt):**
No new dependencies required - existing pandas/numpy sufficient for aggregations.

### Database Queries

**Map Aggregation Query:**

```sql
SELECT 
    state,
    county_fips_code,
    AVG(latitude) as latitude,
    AVG(longitude) as longitude,
    COUNT(*) as total_cases,
    SUM(solved) as solved_cases,
    COUNT(*) - SUM(solved) as unsolved_cases,
    ROUND(SUM(solved) * 100.0 / COUNT(*), 1) as solve_rate
FROM cases
WHERE {filter_conditions}
GROUP BY state, county_fips_code
ORDER BY total_cases DESC;
```

**Timeline Aggregation Query:**

```sql
SELECT 
    year as period,
    COUNT(*) as total_cases,
    SUM(solved) as solved_cases,
    COUNT(*) - SUM(solved) as unsolved_cases,
    ROUND(SUM(solved) * 100.0 / COUNT(*), 1) as solve_rate
FROM cases
WHERE {filter_conditions}
GROUP BY year
ORDER BY year;
```

**Statistics Dashboard Query:**

```sql
-- Multiple queries combined in service layer
-- Summary
SELECT COUNT(*), SUM(solved), ROUND(SUM(solved)*100.0/COUNT(*),1) FROM cases WHERE ...;

-- By weapon
SELECT weapon, COUNT(*) FROM cases WHERE ... GROUP BY weapon ORDER BY COUNT(*) DESC;

-- By victim sex
SELECT vic_sex, COUNT(*) FROM cases WHERE ... GROUP BY vic_sex;

-- etc.
```

### Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Map aggregation (all data) | < 2s | ~3,000 counties |
| Map aggregation (filtered) | < 1s | Indexed queries |
| Timeline aggregation | < 1s | 48 years max |
| Dashboard stats | < 2s | Multiple queries |
| Heatmap data (10k points) | < 3s | Limit to viewport |

### Caching Strategy

```typescript
// TanStack Query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Map data - longer cache (geographic data rarely changes)
useQuery({
  queryKey: ['map', 'aggregated', filters],
  staleTime: 1000 * 60 * 10, // 10 minutes
});

// Stats - medium cache
useQuery({
  queryKey: ['stats', 'dashboard', filters],
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Leaflet bundle size too large | Low | Medium | Use dynamic imports, tree shaking |
| Map performance with 894k markers | Medium | High | Use clustering, limit to viewport |
| Timeline chart performance | Low | Medium | Aggregate data, limit data points |
| Stats queries too slow | Medium | Medium | Add indexes, cache results |
| Filter integration complexity | Medium | Medium | Reuse existing filter store |

### Mitigation Strategies

**Map Performance:**
- Use marker clustering (leaflet.markercluster)
- Aggregate to county level by default
- Lazy load heatmap layer
- Limit heatmap to visible viewport

**Query Performance:**
- Add composite indexes for common filter combinations
- Implement query result caching in backend
- Use EXPLAIN ANALYZE to optimize slow queries

**Bundle Size:**
- Dynamic import Leaflet components
- Code split by route/tab
- Analyze bundle with webpack-bundle-analyzer

### Fallback Plans

| Feature | Fallback |
|---------|----------|
| Map | Static image map with clickable regions |
| Timeline | Simple table view of yearly stats |
| Statistics | Basic summary cards without charts |

---

## Testing Strategy

### Unit Tests

**Backend:**
- Test each aggregation function
- Test filter parameter handling
- Test edge cases (empty results, single record)

**Frontend:**
- Test component rendering
- Test hook data transformation
- Test user interactions

### Integration Tests

- Test API endpoints with various filter combinations
- Test frontend-backend data flow
- Test filter synchronization across views

### Performance Tests

- Benchmark map aggregation queries
- Benchmark timeline queries
- Measure frontend render times

### Test Files to Create

| File | Description |
|------|-------------|
| `tests/backend/test_routes/test_map.py` | Map API tests |
| `tests/backend/test_routes/test_timeline.py` | Timeline API tests |
| `tests/backend/test_routes/test_stats.py` | Stats API tests |
| `tests/frontend/components/MapView.test.tsx` | Map component tests |
| `tests/frontend/components/TimelineView.test.tsx` | Timeline tests |
| `tests/frontend/components/StatsView.test.tsx` | Stats tests |

---

## Appendix: File Creation Checklist

### Feature A: Cluster Placeholder

- [ ] `src/components/common/ComingSoon.tsx`
- [ ] `src/components/common/ComingSoon.css`
- [ ] `src/components/common/index.ts`
- [ ] Update `src/components/Layout/Layout.tsx`

### Feature B: Map

**Backend:**
- [ ] `backend/models/map.py`
- [ ] `backend/services/map_service.py`
- [ ] `backend/routes/map.py`
- [ ] Update `backend/main.py` (add router)

**Frontend:**
- [ ] `src/types/map.ts`
- [ ] `src/services/map.ts`
- [ ] `src/components/map/MapView.tsx`
- [ ] `src/components/map/MapView.css`
- [ ] `src/components/map/MapContainer.tsx`
- [ ] `src/components/map/MapControls.tsx`
- [ ] `src/components/map/MapLegend.tsx`
- [ ] `src/components/map/CountyPopup.tsx`
- [ ] `src/components/map/layers/ChoroplethLayer.tsx`
- [ ] `src/components/map/layers/MarkerClusterLayer.tsx`
- [ ] `src/components/map/layers/HeatmapLayer.tsx`
- [ ] `src/components/map/hooks/useMapData.ts`
- [ ] `src/components/map/index.ts`
- [ ] Update `src/components/Layout/Layout.tsx`

**Tests:**
- [ ] `tests/backend/test_routes/test_map.py`
- [ ] `tests/frontend/components/MapView.test.tsx`

### Feature C: Timeline

**Backend:**
- [ ] `backend/models/timeline.py`
- [ ] `backend/services/timeline_service.py`
- [ ] `backend/routes/timeline.py`
- [ ] Update `backend/main.py` (add router)

**Frontend:**
- [ ] `src/types/timeline.ts`
- [ ] `src/services/timeline.ts`
- [ ] `src/components/timeline/TimelineView.tsx`
- [ ] `src/components/timeline/TimelineView.css`
- [ ] `src/components/timeline/TimelineChart.tsx`
- [ ] `src/components/timeline/TimelineControls.tsx`
- [ ] `src/components/timeline/TimelineBrush.tsx`
- [ ] `src/components/timeline/TimelineTooltip.tsx`
- [ ] `src/components/timeline/TrendIndicator.tsx`
- [ ] `src/components/timeline/hooks/useTimelineData.ts`
- [ ] `src/components/timeline/index.ts`
- [ ] Update `src/components/Layout/Layout.tsx`

**Tests:**
- [ ] `tests/backend/test_routes/test_timeline.py`
- [ ] `tests/frontend/components/TimelineView.test.tsx`

### Feature D: Statistics

**Backend:**
- [ ] `backend/models/stats.py`
- [ ] `backend/services/stats_service.py`
- [ ] `backend/routes/stats.py`
- [ ] Update `backend/main.py` (add router)

**Frontend:**
- [ ] `src/types/stats.ts`
- [ ] `src/services/stats.ts`
- [ ] `src/components/stats/StatsView.tsx`
- [ ] `src/components/stats/StatsView.css`
- [ ] `src/components/stats/cards/SummaryCard.tsx`
- [ ] `src/components/stats/cards/TrendCard.tsx`
- [ ] `src/components/stats/cards/DemographicsCard.tsx`
- [ ] `src/components/stats/cards/WeaponsCard.tsx`
- [ ] `src/components/stats/cards/CircumstancesCard.tsx`
- [ ] `src/components/stats/cards/GeographicCard.tsx`
- [ ] `src/components/stats/cards/SeasonalCard.tsx`
- [ ] `src/components/stats/charts/PieChart.tsx`
- [ ] `src/components/stats/charts/BarChart.tsx`
- [ ] `src/components/stats/charts/LineChart.tsx`
- [ ] `src/components/stats/charts/MiniMap.tsx`
- [ ] `src/components/stats/ExportButton.tsx`
- [ ] `src/components/stats/hooks/useStatsData.ts`
- [ ] `src/components/stats/index.ts`
- [ ] Update `src/components/Layout/Layout.tsx`

**Tests:**
- [ ] `tests/backend/test_routes/test_stats.py`
- [ ] `tests/frontend/components/StatsView.test.tsx`

---

**Document Version:** 1.0  
**Last Updated:** November 28, 2024  
**Author:** Claude (Architect Mode)  
**Status:** Ready for Review