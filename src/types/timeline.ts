/**
 * Timeline feature types for the RedString application
 */

/**
 * A single data point in the timeline representing case statistics for a period
 */
export interface TimelineDataPoint {
  period: string
  total_cases: number
  solved_cases: number
  unsolved_cases: number
  solve_rate: number
}

/**
 * A single point in a trend analysis
 */
export interface TimelineTrendPoint {
  period: string
  value: number
  moving_average?: number
}

/**
 * Date range for timeline data
 */
export interface TimelineDateRange {
  start: string
  end: string
}

/**
 * Response from the timeline data endpoint
 */
export interface TimelineDataResponse {
  data: TimelineDataPoint[]
  granularity: 'year' | 'month' | 'decade'
  total_cases: number
  date_range: TimelineDateRange
}

/**
 * Response from the timeline trends endpoint
 */
export interface TimelineTrendResponse {
  trends: TimelineTrendPoint[]
  metric: string
  granularity: string
  moving_average_window: number
}

/**
 * Available granularity options for timeline data
 */
export type TimelineGranularity = 'year' | 'month' | 'decade'

/**
 * Available metrics for trend analysis
 */
export type TimelineMetric =
  | 'solve_rate'
  | 'total_cases'
  | 'unsolved_cases'
  | 'solved_cases'

/**
 * Available chart types for timeline visualization
 */
export type TimelineChartType = 'area' | 'bar' | 'line'

/**
 * Parameters for fetching timeline data
 */
export interface TimelineDataParams {
  granularity?: TimelineGranularity
  year_start?: number
  year_end?: number
  state_code?: string
  county_fips?: string
  solved_status?: string
}

/**
 * Parameters for fetching timeline trends
 */
export interface TimelineTrendParams {
  metric?: TimelineMetric
  granularity?: TimelineGranularity
  moving_average_window?: number
  year_start?: number
  year_end?: number
  state_code?: string
  county_fips?: string
}

/**
 * Summary statistics for the timeline
 */
export interface TimelineSummaryStats {
  totalCases: number
  averageSolveRate: number
  peakPeriod: string
  peakCases: number
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
}
