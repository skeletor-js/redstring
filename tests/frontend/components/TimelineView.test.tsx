/**
 * Test suite for TimelineView component.
 *
 * Tests timeline chart rendering, controls, granularity switching,
 * trend analysis, and filter integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TimelineView } from '../../../src/components/timeline/TimelineView'
import * as timelineService from '../../../src/services/timeline'
import type {
  TimelineDataResponse,
  TimelineTrendResponse,
} from '../../../src/types/timeline'

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Brush: () => <div data-testid="brush" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}))

// Mock the timeline service
vi.mock('../../../src/services/timeline')

// Mock the error handler
vi.mock('../../../src/utils/errorHandler', () => ({
  getUserMessage: (error: Error) => error.message,
  logError: vi.fn(),
  AppError: class AppError extends Error {
    retryable = false
  },
}))

const mockTimelineData: TimelineDataResponse = {
  data: [
    {
      period: '2020',
      total_cases: 1000,
      solved_cases: 600,
      unsolved_cases: 400,
      solve_rate: 60.0,
    },
    {
      period: '2021',
      total_cases: 950,
      solved_cases: 570,
      unsolved_cases: 380,
      solve_rate: 60.0,
    },
    {
      period: '2022',
      total_cases: 900,
      solved_cases: 540,
      unsolved_cases: 360,
      solve_rate: 60.0,
    },
  ],
  granularity: 'year',
  total_cases: 2850,
  date_range: { start: '2020', end: '2022' },
}

const mockTrendData: TimelineTrendResponse = {
  trends: [
    { period: '2020', value: 60.0, moving_average: 60.0 },
    { period: '2021', value: 60.0, moving_average: 60.0 },
    { period: '2022', value: 60.0, moving_average: 60.0 },
  ],
  metric: 'solve_rate',
  granularity: 'year',
  moving_average_window: 3,
}

describe('TimelineView', () => {
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
      vi.mocked(timelineService.fetchTimelineData).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      vi.mocked(timelineService.fetchTimelineTrends).mockImplementation(
        () => new Promise(() => {})
      )

      render(<TimelineView />, { wrapper })

      expect(screen.getByText(/loading timeline data/i)).toBeInTheDocument()
    })

    it('shows loading spinner element', () => {
      vi.mocked(timelineService.fetchTimelineData).mockImplementation(
        () => new Promise(() => {})
      )
      vi.mocked(timelineService.fetchTimelineTrends).mockImplementation(
        () => new Promise(() => {})
      )

      const { container } = render(<TimelineView />, { wrapper })

      expect(container.querySelector('.timeline-loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error state on fetch failure', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockRejectedValue(
        new Error('Network error')
      )
      vi.mocked(timelineService.fetchTimelineTrends).mockRejectedValue(
        new Error('Network error')
      )

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/failed to load timeline data/i)).toBeInTheDocument()
      })
    })

    it('displays error message details', async () => {
      const errorMessage = 'Connection timeout'
      vi.mocked(timelineService.fetchTimelineData).mockRejectedValue(
        new Error(errorMessage)
      )
      vi.mocked(timelineService.fetchTimelineTrends).mockRejectedValue(
        new Error(errorMessage)
      )

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no data', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue({
        data: [],
        granularity: 'year',
        total_cases: 0,
        date_range: { start: '', end: '' },
      })
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue({
        trends: [],
        metric: 'solve_rate',
        granularity: 'year',
        moving_average_window: 3,
      })

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument()
      })
    })

    it('shows hint to adjust filters in empty state', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue({
        data: [],
        granularity: 'year',
        total_cases: 0,
        date_range: { start: '', end: '' },
      })
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue({
        trends: [],
        metric: 'solve_rate',
        granularity: 'year',
        moving_average_window: 3,
      })

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(
          screen.getByText(/try adjusting your filter criteria/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Timeline Chart Rendering', () => {
    it('renders timeline chart container', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })
    })

    it('renders chart with data', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        // Default chart type is area
        expect(screen.getByTestId('area-chart')).toBeInTheDocument()
      })
    })

    it('applies custom className when provided', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      const { container } = render(<TimelineView className="custom-timeline" />, {
        wrapper,
      })

      await waitFor(() => {
        expect(
          container.querySelector('.timeline-view.custom-timeline')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Timeline Header', () => {
    it('displays timeline title', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Case Timeline')).toBeInTheDocument()
      })
    })

    it('displays date range', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('2020 - 2022')).toBeInTheDocument()
      })
    })

    it('displays total cases count', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Total Cases:')).toBeInTheDocument()
        expect(screen.getByText('2,850')).toBeInTheDocument()
      })
    })
  })

  describe('Granularity Controls', () => {
    it('shows granularity controls', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Year')).toBeInTheDocument()
        expect(screen.getByText('Month')).toBeInTheDocument()
        expect(screen.getByText('Decade')).toBeInTheDocument()
      })
    })

    it('changes granularity on button click', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Month')).toBeInTheDocument()
      })

      const monthButton = screen.getByText('Month')
      fireEvent.click(monthButton)

      await waitFor(() => {
        expect(timelineService.fetchTimelineData).toHaveBeenCalledWith(
          expect.anything(),
          'month'
        )
      })
    })

    it('changes granularity to decade', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Decade')).toBeInTheDocument()
      })

      const decadeButton = screen.getByText('Decade')
      fireEvent.click(decadeButton)

      await waitFor(() => {
        expect(timelineService.fetchTimelineData).toHaveBeenCalledWith(
          expect.anything(),
          'decade'
        )
      })
    })
  })

  describe('Chart Type Controls', () => {
    it('shows chart type controls', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Chart Type')).toBeInTheDocument()
      })
    })

    it('renders area chart by default', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument()
      })
    })
  })

  describe('Timeline Summary', () => {
    it('displays summary statistics', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        // Summary cards should be present
        expect(screen.getByText('Total Cases')).toBeInTheDocument()
        expect(screen.getByText('Avg Solve Rate')).toBeInTheDocument()
        expect(screen.getByText('Peak Period')).toBeInTheDocument()
        expect(screen.getByText('Overall Trend')).toBeInTheDocument()
      })
    })

    it('displays average solve rate', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('60.0%')).toBeInTheDocument()
      })
    })
  })

  describe('Trend Analysis', () => {
    it('shows trend toggle checkbox', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Show Trend Analysis')).toBeInTheDocument()
      })
    })

    it('shows trend chart when enabled', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Show Trend Analysis')).toBeInTheDocument()
      })

      // Find and click the checkbox
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      await waitFor(() => {
        expect(screen.getByText('Trend Analysis')).toBeInTheDocument()
      })
    })

    it('shows metric selector when trends enabled', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Show Trend Analysis')).toBeInTheDocument()
      })

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      await waitFor(() => {
        expect(screen.getByText('Trend Metric')).toBeInTheDocument()
      })
    })

    it('shows moving average slider when trends enabled', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Show Trend Analysis')).toBeInTheDocument()
      })

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      await waitFor(() => {
        expect(screen.getByText(/Moving Average/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filter Info', () => {
    it('displays current year range', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('Current Year Range:')).toBeInTheDocument()
      })
    })

    it('displays brush hint', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(
          screen.getByText(/use the brush below the chart to adjust the range/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('CSS Classes', () => {
    it('applies correct CSS classes to container', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      const { container } = render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.timeline-view')).toBeInTheDocument()
      })
    })

    it('applies loading CSS class during loading', () => {
      vi.mocked(timelineService.fetchTimelineData).mockImplementation(
        () => new Promise(() => {})
      )
      vi.mocked(timelineService.fetchTimelineTrends).mockImplementation(
        () => new Promise(() => {})
      )

      const { container } = render(<TimelineView />, { wrapper })

      expect(container.querySelector('.timeline-loading')).toBeInTheDocument()
    })

    it('applies error CSS class on error', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockRejectedValue(
        new Error('Network error')
      )
      vi.mocked(timelineService.fetchTimelineTrends).mockRejectedValue(
        new Error('Network error')
      )

      const { container } = render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.timeline-error')).toBeInTheDocument()
      })
    })

    it('applies empty CSS class when no data', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue({
        data: [],
        granularity: 'year',
        total_cases: 0,
        date_range: { start: '', end: '' },
      })
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue({
        trends: [],
        metric: 'solve_rate',
        granularity: 'year',
        moving_average_window: 3,
      })

      const { container } = render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(container.querySelector('.timeline-empty')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible loading state', () => {
      vi.mocked(timelineService.fetchTimelineData).mockImplementation(
        () => new Promise(() => {})
      )
      vi.mocked(timelineService.fetchTimelineTrends).mockImplementation(
        () => new Promise(() => {})
      )

      render(<TimelineView />, { wrapper })

      expect(screen.getByText(/loading timeline data/i)).toBeInTheDocument()
    })

    it('has accessible error message', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockRejectedValue(
        new Error('Network error')
      )
      vi.mocked(timelineService.fetchTimelineTrends).mockRejectedValue(
        new Error('Network error')
      )

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/failed to load timeline data/i)).toBeInTheDocument()
      })
    })

    it('has accessible empty state message', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue({
        data: [],
        granularity: 'year',
        total_cases: 0,
        date_range: { start: '', end: '' },
      })
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue({
        trends: [],
        metric: 'solve_rate',
        granularity: 'year',
        moving_average_window: 3,
      })

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filter Integration', () => {
    it('fetches data with current filters', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(timelineService.fetchTimelineData).toHaveBeenCalled()
      })
    })

    it('refetches data when granularity changes', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(timelineService.fetchTimelineData).toHaveBeenCalledTimes(1)
      })

      const monthButton = screen.getByText('Month')
      fireEvent.click(monthButton)

      await waitFor(() => {
        expect(timelineService.fetchTimelineData).toHaveBeenCalledWith(
          expect.anything(),
          'month'
        )
      })
    })
  })

  describe('Data Point Display', () => {
    it('displays data points in chart', async () => {
      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(mockTimelineData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        // Chart should be rendered with data
        expect(screen.getByTestId('area-chart')).toBeInTheDocument()
      })
    })

    it('handles single data point', async () => {
      const singlePointData: TimelineDataResponse = {
        data: [
          {
            period: '2020',
            total_cases: 1000,
            solved_cases: 600,
            unsolved_cases: 400,
            solve_rate: 60.0,
          },
        ],
        granularity: 'year',
        total_cases: 1000,
        date_range: { start: '2020', end: '2020' },
      }

      vi.mocked(timelineService.fetchTimelineData).mockResolvedValue(singlePointData)
      vi.mocked(timelineService.fetchTimelineTrends).mockResolvedValue(mockTrendData)

      render(<TimelineView />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument()
        expect(screen.getByText('1,000')).toBeInTheDocument()
      })
    })
  })
})
