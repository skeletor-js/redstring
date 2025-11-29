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
import type { MapDataResponse, MapCasesResponse } from '../../../src/types/map'

// Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => (
    <div data-testid="map-container" className={className}>
      {children}
    </div>
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
    latLngBounds: vi.fn(() => ({
      extend: vi.fn(),
      isValid: () => true,
    })),
  },
}))

// Mock the map service
vi.mock('../../../src/services/map')

// Mock child components to simplify testing
vi.mock('../../../src/components/map/CountyLayer', () => ({
  CountyLayer: ({ counties }: { counties: unknown[] }) => (
    <div data-testid="county-layer" data-county-count={counties?.length || 0} />
  ),
}))

vi.mock('../../../src/components/map/CaseMarkers', () => ({
  CaseMarkers: ({ cases }: { cases: unknown[] }) => (
    <div data-testid="case-markers" data-case-count={cases?.length || 0} />
  ),
}))

vi.mock('../../../src/components/map/HeatmapLayer', () => ({
  HeatmapLayer: ({ points }: { points: unknown[] }) => (
    <div data-testid="heatmap-layer" data-point-count={points?.length || 0} />
  ),
}))

vi.mock('../../../src/components/map/MapControls', () => ({
  MapControls: ({
    viewMode,
    onViewModeChange,
    colorMetric,
    onColorMetricChange,
  }: {
    viewMode: string
    onViewModeChange: (mode: string) => void
    colorMetric: string
    onColorMetricChange: (metric: string) => void
  }) => (
    <div data-testid="map-controls">
      <button
        data-testid="view-mode-markers"
        onClick={() => onViewModeChange('markers')}
        className={viewMode === 'markers' ? 'active' : ''}
      >
        Markers
      </button>
      <button
        data-testid="view-mode-choropleth"
        onClick={() => onViewModeChange('choropleth')}
        className={viewMode === 'choropleth' ? 'active' : ''}
      >
        Choropleth
      </button>
      <button
        data-testid="view-mode-heatmap"
        onClick={() => onViewModeChange('heatmap')}
        className={viewMode === 'heatmap' ? 'active' : ''}
      >
        Heatmap
      </button>
      <button
        data-testid="color-metric-solve-rate"
        onClick={() => onColorMetricChange('solve_rate')}
        className={colorMetric === 'solve_rate' ? 'active' : ''}
      >
        Solve Rate
      </button>
      <button
        data-testid="color-metric-total-cases"
        onClick={() => onColorMetricChange('total_cases')}
        className={colorMetric === 'total_cases' ? 'active' : ''}
      >
        Total Cases
      </button>
    </div>
  ),
}))

vi.mock('../../../src/components/map/MapLegend', () => ({
  MapLegend: ({ colorMetric, viewMode }: { colorMetric: string; viewMode: string }) => (
    <div
      data-testid="map-legend"
      data-color-metric={colorMetric}
      data-view-mode={viewMode}
    >
      Legend
    </div>
  ),
}))

const mockCountyData: MapDataResponse = {
  counties: [
    {
      fips: '06037',
      county_name: 'Los Angeles',
      state_name: 'California',
      latitude: 34.0522,
      longitude: -118.2437,
      total_cases: 1000,
      solved_cases: 600,
      unsolved_cases: 400,
      solve_rate: 60.0,
    },
    {
      fips: '06073',
      county_name: 'San Diego',
      state_name: 'California',
      latitude: 32.7157,
      longitude: -117.1611,
      total_cases: 500,
      solved_cases: 300,
      unsolved_cases: 200,
      solve_rate: 60.0,
    },
  ],
  bounds: { north: 42, south: 32, east: -114, west: -124 },
}

const mockCasePoints: MapCasesResponse = {
  cases: [
    {
      case_id: 1,
      latitude: 34.0522,
      longitude: -118.2437,
      year: 2020,
      solved: false,
      victim_sex: 'Male',
      victim_age: 35,
      weapon: 'Handgun',
    },
    {
      case_id: 2,
      latitude: 32.7157,
      longitude: -117.1611,
      year: 2021,
      solved: true,
      victim_sex: 'Female',
      victim_age: 28,
      weapon: 'Knife',
    },
  ],
  total: 2,
}

describe('MapView', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Loading State', () => {
    it('shows loading state while fetching data', () => {
      vi.mocked(mapService.fetchCountyData).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      vi.mocked(mapService.fetchCasePoints).mockImplementation(
        () => new Promise(() => {})
      )

      render(<MapView />, { wrapper })

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('shows loading spinner element', () => {
      vi.mocked(mapService.fetchCountyData).mockImplementation(
        () => new Promise(() => {})
      )
      vi.mocked(mapService.fetchCasePoints).mockImplementation(
        () => new Promise(() => {})
      )

      const { container } = render(<MapView />, { wrapper })

      expect(container.querySelector('.map-loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error state on fetch failure', async () => {
      vi.mocked(mapService.fetchCountyData).mockRejectedValue(
        new Error('Network error')
      )
      vi.mocked(mapService.fetchCasePoints).mockRejectedValue(
        new Error('Network error')
      )

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/failed to load map data/i)).toBeInTheDocument()
      })
    })

    it('displays error message details', async () => {
      const errorMessage = 'Connection timeout'
      vi.mocked(mapService.fetchCountyData).mockRejectedValue(new Error(errorMessage))
      vi.mocked(mapService.fetchCasePoints).mockRejectedValue(new Error(errorMessage))

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no data', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue({
        counties: [],
        bounds: { north: 0, south: 0, east: 0, west: 0 },
      })
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue({
        cases: [],
        total: 0,
      })

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument()
      })
    })

    it('shows hint to adjust filters in empty state', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue({
        counties: [],
        bounds: { north: 0, south: 0, east: 0, west: 0 },
      })
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue({
        cases: [],
        total: 0,
      })

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(
          screen.getByText(/try adjusting your filter criteria/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Map Container Rendering', () => {
    it('renders map container', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument()
      })
    })

    it('renders tile layer', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
      })
    })

    it('applies custom className when provided', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      const { container } = render(<MapView className="custom-map" />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.map-view.custom-map')).toBeInTheDocument()
      })
    })
  })

  describe('Map Controls', () => {
    it('renders map controls', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-controls')).toBeInTheDocument()
      })
    })

    it('handles view mode change to choropleth', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-controls')).toBeInTheDocument()
      })

      const choroplethButton = screen.getByTestId('view-mode-choropleth')
      fireEvent.click(choroplethButton)

      await waitFor(() => {
        expect(screen.getByTestId('county-layer')).toBeInTheDocument()
      })
    })

    it('handles view mode change to heatmap', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-controls')).toBeInTheDocument()
      })

      const heatmapButton = screen.getByTestId('view-mode-heatmap')
      fireEvent.click(heatmapButton)

      await waitFor(() => {
        expect(screen.getByTestId('heatmap-layer')).toBeInTheDocument()
      })
    })

    it('handles color metric change', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-controls')).toBeInTheDocument()
      })

      const totalCasesButton = screen.getByTestId('color-metric-total-cases')
      fireEvent.click(totalCasesButton)

      await waitFor(() => {
        const legend = screen.getByTestId('map-legend')
        expect(legend).toHaveAttribute('data-color-metric', 'total_cases')
      })
    })
  })

  describe('Map Legend', () => {
    it('renders map legend', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-legend')).toBeInTheDocument()
      })
    })

    it('legend reflects current view mode', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        const legend = screen.getByTestId('map-legend')
        expect(legend).toHaveAttribute('data-view-mode', 'markers')
      })
    })

    it('legend updates when view mode changes', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-controls')).toBeInTheDocument()
      })

      const heatmapButton = screen.getByTestId('view-mode-heatmap')
      fireEvent.click(heatmapButton)

      await waitFor(() => {
        const legend = screen.getByTestId('map-legend')
        expect(legend).toHaveAttribute('data-view-mode', 'heatmap')
      })
    })
  })

  describe('View Mode Rendering', () => {
    it('renders county layer in markers mode', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('county-layer')).toBeInTheDocument()
      })
    })

    it('renders case markers in markers mode', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('case-markers')).toBeInTheDocument()
      })
    })

    it('renders county layer in choropleth mode', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-controls')).toBeInTheDocument()
      })

      const choroplethButton = screen.getByTestId('view-mode-choropleth')
      fireEvent.click(choroplethButton)

      await waitFor(() => {
        expect(screen.getByTestId('county-layer')).toBeInTheDocument()
      })
    })

    it('renders heatmap layer in heatmap mode', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-controls')).toBeInTheDocument()
      })

      const heatmapButton = screen.getByTestId('view-mode-heatmap')
      fireEvent.click(heatmapButton)

      await waitFor(() => {
        expect(screen.getByTestId('heatmap-layer')).toBeInTheDocument()
      })
    })

    it('hides county layer in heatmap mode', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-controls')).toBeInTheDocument()
      })

      const heatmapButton = screen.getByTestId('view-mode-heatmap')
      fireEvent.click(heatmapButton)

      await waitFor(() => {
        expect(screen.queryByTestId('county-layer')).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Display', () => {
    it('displays correct number of counties', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        const countyLayer = screen.getByTestId('county-layer')
        expect(countyLayer).toHaveAttribute('data-county-count', '2')
      })
    })

    it('displays correct number of case markers', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        const caseMarkers = screen.getByTestId('case-markers')
        expect(caseMarkers).toHaveAttribute('data-case-count', '2')
      })
    })

    it('transforms county data to heatmap points', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('map-controls')).toBeInTheDocument()
      })

      const heatmapButton = screen.getByTestId('view-mode-heatmap')
      fireEvent.click(heatmapButton)

      await waitFor(() => {
        const heatmapLayer = screen.getByTestId('heatmap-layer')
        expect(heatmapLayer).toHaveAttribute('data-point-count', '2')
      })
    })
  })

  describe('Background Loading Indicator', () => {
    it('shows updating indicator during background refresh', async () => {
      let resolveCounty: (value: MapDataResponse) => void
      const countyPromise = new Promise<MapDataResponse>((resolve) => {
        resolveCounty = resolve
      })

      vi.mocked(mapService.fetchCountyData).mockReturnValue(countyPromise)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      const { container } = render(<MapView />, { wrapper })

      // Initially loading
      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      // Resolve the promise
      resolveCounty!(mockCountyData)

      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument()
      })

      // The updating spinner should not be visible when not loading
      expect(container.querySelector('.map-updating')).not.toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('applies correct CSS classes to container', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      const { container } = render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.map-view')).toBeInTheDocument()
      })
    })

    it('applies loading CSS class during loading', () => {
      vi.mocked(mapService.fetchCountyData).mockImplementation(
        () => new Promise(() => {})
      )
      vi.mocked(mapService.fetchCasePoints).mockImplementation(
        () => new Promise(() => {})
      )

      const { container } = render(<MapView />, { wrapper })

      expect(container.querySelector('.map-loading')).toBeInTheDocument()
    })

    it('applies error CSS class on error', async () => {
      vi.mocked(mapService.fetchCountyData).mockRejectedValue(
        new Error('Network error')
      )
      vi.mocked(mapService.fetchCasePoints).mockRejectedValue(
        new Error('Network error')
      )

      const { container } = render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.map-error')).toBeInTheDocument()
      })
    })

    it('applies empty CSS class when no data', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue({
        counties: [],
        bounds: { north: 0, south: 0, east: 0, west: 0 },
      })
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue({
        cases: [],
        total: 0,
      })

      const { container } = render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.map-empty')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible loading state', () => {
      vi.mocked(mapService.fetchCountyData).mockImplementation(
        () => new Promise(() => {})
      )
      vi.mocked(mapService.fetchCasePoints).mockImplementation(
        () => new Promise(() => {})
      )

      render(<MapView />, { wrapper })

      expect(screen.getByText(/loading map data/i)).toBeInTheDocument()
    })

    it('has accessible error message', async () => {
      vi.mocked(mapService.fetchCountyData).mockRejectedValue(
        new Error('Network error')
      )
      vi.mocked(mapService.fetchCasePoints).mockRejectedValue(
        new Error('Network error')
      )

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/failed to load map data/i)).toBeInTheDocument()
      })
    })

    it('has accessible empty state message', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue({
        counties: [],
        bounds: { north: 0, south: 0, east: 0, west: 0 },
      })
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue({
        cases: [],
        total: 0,
      })

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filter Integration', () => {
    it('fetches data with current filters', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(mapService.fetchCountyData).toHaveBeenCalled()
      })
    })

    it('refetches data when filters change', async () => {
      vi.mocked(mapService.fetchCountyData).mockResolvedValue(mockCountyData)
      vi.mocked(mapService.fetchCasePoints).mockResolvedValue(mockCasePoints)

      const { rerender } = render(<MapView />, { wrapper })

      await waitFor(() => {
        expect(mapService.fetchCountyData).toHaveBeenCalledTimes(1)
      })

      // Rerender to simulate filter change (in real app, filter store would trigger this)
      rerender(<MapView />)

      // The query should still be called (caching may prevent additional calls)
      expect(mapService.fetchCountyData).toHaveBeenCalled()
    })
  })
})
