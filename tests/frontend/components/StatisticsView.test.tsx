/**
 * Test suite for StatisticsView component.
 *
 * Tests dashboard rendering, summary cards, charts,
 * loading states, error handling, and filter integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatisticsView } from '../../../src/components/statistics/StatisticsView'
import * as statisticsService from '../../../src/services/statistics'
import type {
  StatisticsSummary,
  DemographicsResponse,
  WeaponStatistics,
  CircumstanceStatistics,
  RelationshipStatistics,
  GeographicStatistics,
  TrendStatistics,
  SeasonalStatistics,
} from '../../../src/types/statistics'

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}))

// Mock the statistics service
vi.mock('../../../src/services/statistics')

// Mock the error handler
vi.mock('../../../src/utils/errorHandler', () => ({
  getUserMessage: (error: Error) => error.message,
  logError: vi.fn(),
  AppError: class AppError extends Error {
    retryable = false
  },
}))

// Mock filter store
vi.mock('../../../src/stores/useFilterStore', () => ({
  useFilterStore: () => ({
    states: [],
    yearRange: [1976, 2023],
    solved: null,
    vicSex: null,
    vicAgeRange: [0, 99],
    includeUnknownAge: true,
    vicRace: null,
    vicEthnic: null,
    weapon: null,
    relationship: null,
    circumstance: null,
    situation: null,
    counties: [],
    msa: null,
    agencySearch: '',
    caseId: '',
  }),
}))

const mockSummary: StatisticsSummary = {
  total_cases: 894636,
  solved_cases: 632457,
  unsolved_cases: 262179,
  overall_solve_rate: 70.7,
  date_range: { start_year: 1976, end_year: 2023 },
  states_covered: 51,
  counties_covered: 3079,
}

const mockDemographics: DemographicsResponse = {
  by_sex: [
    {
      category: 'Male',
      total_cases: 700000,
      solved_cases: 490000,
      unsolved_cases: 210000,
      solve_rate: 70.0,
      percentage_of_total: 78.3,
    },
    {
      category: 'Female',
      total_cases: 190000,
      solved_cases: 140000,
      unsolved_cases: 50000,
      solve_rate: 73.7,
      percentage_of_total: 21.2,
    },
  ],
  by_race: [
    {
      category: 'White',
      total_cases: 400000,
      solved_cases: 300000,
      unsolved_cases: 100000,
      solve_rate: 75.0,
      percentage_of_total: 44.7,
    },
    {
      category: 'Black',
      total_cases: 450000,
      solved_cases: 300000,
      unsolved_cases: 150000,
      solve_rate: 66.7,
      percentage_of_total: 50.3,
    },
  ],
  by_age_group: [
    {
      category: '18-24',
      total_cases: 200000,
      solved_cases: 140000,
      unsolved_cases: 60000,
      solve_rate: 70.0,
      percentage_of_total: 22.4,
    },
    {
      category: '25-34',
      total_cases: 250000,
      solved_cases: 175000,
      unsolved_cases: 75000,
      solve_rate: 70.0,
      percentage_of_total: 28.0,
    },
  ],
}

const mockWeapons: WeaponStatistics = {
  weapons: [
    { category: 'Handgun', count: 350000, percentage: 39.1, solve_rate: 68.5 },
    { category: 'Knife', count: 120000, percentage: 13.4, solve_rate: 72.3 },
    {
      category: 'Firearm - type unknown',
      count: 100000,
      percentage: 11.2,
      solve_rate: 65.0,
    },
  ],
  total_cases: 894636,
}

const mockCircumstances: CircumstanceStatistics = {
  circumstances: [
    { category: 'Argument', count: 200000, percentage: 22.4, solve_rate: 80.0 },
    { category: 'Unknown', count: 300000, percentage: 33.5, solve_rate: 55.0 },
    { category: 'Robbery', count: 100000, percentage: 11.2, solve_rate: 60.0 },
  ],
  total_cases: 894636,
}

const mockRelationships: RelationshipStatistics = {
  relationships: [
    { category: 'Acquaintance', count: 250000, percentage: 28.0, solve_rate: 85.0 },
    { category: 'Stranger', count: 150000, percentage: 16.8, solve_rate: 50.0 },
    { category: 'Unknown', count: 200000, percentage: 22.4, solve_rate: 40.0 },
    { category: 'Wife', count: 50000, percentage: 5.6, solve_rate: 90.0 },
  ],
  total_cases: 894636,
}

const mockGeographic: GeographicStatistics = {
  top_states: [
    { state: 'California', total_cases: 100000, solved_cases: 70000, solve_rate: 70.0 },
    { state: 'Texas', total_cases: 80000, solved_cases: 56000, solve_rate: 70.0 },
    { state: 'Florida', total_cases: 60000, solved_cases: 42000, solve_rate: 70.0 },
  ],
  top_counties: [
    {
      county: 'Los Angeles',
      state: 'California',
      total_cases: 50000,
      solved_cases: 35000,
      solve_rate: 70.0,
    },
    {
      county: 'Cook',
      state: 'Illinois',
      total_cases: 40000,
      solved_cases: 24000,
      solve_rate: 60.0,
    },
  ],
}

const mockTrends: TrendStatistics = {
  yearly_data: [
    { year: 2020, total_cases: 20000, solved_cases: 12000, solve_rate: 60.0 },
    { year: 2021, total_cases: 22000, solved_cases: 13200, solve_rate: 60.0 },
    { year: 2022, total_cases: 21000, solved_cases: 12600, solve_rate: 60.0 },
  ],
  overall_trend: 'stable',
  average_annual_cases: 21000,
}

const mockSeasonal: SeasonalStatistics = {
  patterns: [
    { month: 1, month_name: 'January', average_cases: 1500, percentage_of_annual: 7.8 },
    {
      month: 2,
      month_name: 'February',
      average_cases: 1400,
      percentage_of_annual: 7.3,
    },
    { month: 7, month_name: 'July', average_cases: 1800, percentage_of_annual: 9.4 },
    {
      month: 12,
      month_name: 'December',
      average_cases: 1600,
      percentage_of_annual: 8.3,
    },
  ],
  peak_month: 'July',
  lowest_month: 'February',
}

// Helper to mock all services with resolved values
const mockAllServicesResolved = () => {
  vi.mocked(statisticsService.fetchSummary).mockResolvedValue(mockSummary)
  vi.mocked(statisticsService.fetchDemographics).mockResolvedValue(mockDemographics)
  vi.mocked(statisticsService.fetchWeapons).mockResolvedValue(mockWeapons)
  vi.mocked(statisticsService.fetchCircumstances).mockResolvedValue(mockCircumstances)
  vi.mocked(statisticsService.fetchRelationships).mockResolvedValue(mockRelationships)
  vi.mocked(statisticsService.fetchGeographic).mockResolvedValue(mockGeographic)
  vi.mocked(statisticsService.fetchTrends).mockResolvedValue(mockTrends)
  vi.mocked(statisticsService.fetchSeasonal).mockResolvedValue(mockSeasonal)
}

// Helper to mock all services as pending (never resolving)
const mockAllServicesPending = () => {
  vi.mocked(statisticsService.fetchSummary).mockImplementation(
    () => new Promise(() => {})
  )
  vi.mocked(statisticsService.fetchDemographics).mockImplementation(
    () => new Promise(() => {})
  )
  vi.mocked(statisticsService.fetchWeapons).mockImplementation(
    () => new Promise(() => {})
  )
  vi.mocked(statisticsService.fetchCircumstances).mockImplementation(
    () => new Promise(() => {})
  )
  vi.mocked(statisticsService.fetchRelationships).mockImplementation(
    () => new Promise(() => {})
  )
  vi.mocked(statisticsService.fetchGeographic).mockImplementation(
    () => new Promise(() => {})
  )
  vi.mocked(statisticsService.fetchTrends).mockImplementation(
    () => new Promise(() => {})
  )
  vi.mocked(statisticsService.fetchSeasonal).mockImplementation(
    () => new Promise(() => {})
  )
}

// Helper to mock all services as rejected
const mockAllServicesRejected = (errorMessage: string) => {
  const error = new Error(errorMessage)
  vi.mocked(statisticsService.fetchSummary).mockRejectedValue(error)
  vi.mocked(statisticsService.fetchDemographics).mockRejectedValue(error)
  vi.mocked(statisticsService.fetchWeapons).mockRejectedValue(error)
  vi.mocked(statisticsService.fetchCircumstances).mockRejectedValue(error)
  vi.mocked(statisticsService.fetchRelationships).mockRejectedValue(error)
  vi.mocked(statisticsService.fetchGeographic).mockRejectedValue(error)
  vi.mocked(statisticsService.fetchTrends).mockRejectedValue(error)
  vi.mocked(statisticsService.fetchSeasonal).mockRejectedValue(error)
}

describe('StatisticsView', () => {
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
      mockAllServicesPending()

      render(<StatisticsView />, { wrapper })

      expect(screen.getByText(/loading statistics/i)).toBeInTheDocument()
    })

    it('shows loading spinner element', () => {
      mockAllServicesPending()

      const { container } = render(<StatisticsView />, { wrapper })

      expect(container.querySelector('.statistics-loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error state on fetch failure', async () => {
      mockAllServicesRejected('Network error')

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/failed to load statistics/i)).toBeInTheDocument()
      })
    })

    it('displays error message details', async () => {
      const errorMessage = 'Connection timeout'
      mockAllServicesRejected(errorMessage)

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Rendering', () => {
    it('renders dashboard title', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Statistics Dashboard')).toBeInTheDocument()
      })
    })

    it('renders dashboard subtitle', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(
          screen.getByText(/comprehensive analysis of homicide data/i)
        ).toBeInTheDocument()
      })
    })

    it('applies custom className when provided', async () => {
      mockAllServicesResolved()

      const { container } = render(<StatisticsView className="custom-stats" />, {
        wrapper,
      })

      await waitFor(() => {
        expect(
          container.querySelector('.statistics-view.custom-stats')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Summary Cards', () => {
    it('displays total cases', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('894,636')).toBeInTheDocument()
      })
    })

    it('displays solve rate', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('70.7%')).toBeInTheDocument()
      })
    })

    it('displays states covered', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('51')).toBeInTheDocument()
      })
    })

    it('displays counties covered', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('3,079')).toBeInTheDocument()
      })
    })
  })

  describe('Charts Rendering', () => {
    it('renders chart containers', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        const containers = screen.getAllByTestId('responsive-container')
        expect(containers.length).toBeGreaterThan(0)
      })
    })

    it('renders bar charts for weapons and circumstances', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        const barCharts = screen.getAllByTestId('bar-chart')
        expect(barCharts.length).toBeGreaterThan(0)
      })
    })

    it('renders pie chart for relationships', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      })
    })

    it('renders line chart for trends', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })
    })
  })

  describe('Export Button', () => {
    it('renders export button', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/export/i)).toBeInTheDocument()
      })
    })

    it('shows export dropdown on click', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/export/i)).toBeInTheDocument()
      })

      const exportButton = screen.getByText(/export/i)
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/csv/i)).toBeInTheDocument()
      })
    })
  })

  describe('CSS Classes', () => {
    it('applies correct CSS classes to container', async () => {
      mockAllServicesResolved()

      const { container } = render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.statistics-view')).toBeInTheDocument()
      })
    })

    it('applies loading CSS class during loading', () => {
      mockAllServicesPending()

      const { container } = render(<StatisticsView />, { wrapper })

      expect(container.querySelector('.statistics-loading')).toBeInTheDocument()
    })

    it('applies error CSS class on error', async () => {
      mockAllServicesRejected('Network error')

      const { container } = render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.statistics-error')).toBeInTheDocument()
      })
    })

    it('applies charts grid class when data loaded', async () => {
      mockAllServicesResolved()

      const { container } = render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.statistics-charts-grid')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible loading state', () => {
      mockAllServicesPending()

      render(<StatisticsView />, { wrapper })

      expect(screen.getByText(/loading statistics/i)).toBeInTheDocument()
    })

    it('has accessible error message', async () => {
      mockAllServicesRejected('Network error')

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/failed to load statistics/i)).toBeInTheDocument()
      })
    })

    it('has accessible dashboard heading', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
          'Statistics Dashboard'
        )
      })
    })
  })

  describe('Filter Integration', () => {
    it('fetches data on mount', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(statisticsService.fetchSummary).toHaveBeenCalled()
        expect(statisticsService.fetchDemographics).toHaveBeenCalled()
        expect(statisticsService.fetchWeapons).toHaveBeenCalled()
        expect(statisticsService.fetchCircumstances).toHaveBeenCalled()
        expect(statisticsService.fetchRelationships).toHaveBeenCalled()
        expect(statisticsService.fetchGeographic).toHaveBeenCalled()
        expect(statisticsService.fetchTrends).toHaveBeenCalled()
        expect(statisticsService.fetchSeasonal).toHaveBeenCalled()
      })
    })

    it('passes filter parameters to services', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(statisticsService.fetchSummary).toHaveBeenCalledWith(expect.any(Object))
      })
    })
  })

  describe('Data Display', () => {
    it('displays weapons chart title', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Weapons Used')).toBeInTheDocument()
      })
    })

    it('displays geographic chart section', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        // Geographic chart should show state data in tabs or table
        expect(screen.getByText(/top states/i)).toBeInTheDocument()
      })
    })

    it('displays trend chart title', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/yearly trend/i)).toBeInTheDocument()
      })
    })

    it('displays seasonal chart title', async () => {
      mockAllServicesResolved()

      render(<StatisticsView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/seasonal patterns/i)).toBeInTheDocument()
      })
    })
  })
})
