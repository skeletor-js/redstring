/**
 * Statistics Types for RedString Application
 * These types define the data structures for the statistics feature
 */

// Summary Statistics
export interface StatisticsSummary {
  total_cases: number
  solved_cases: number
  unsolved_cases: number
  overall_solve_rate: number
  date_range: { start_year: number; end_year: number }
  states_covered: number
  counties_covered: number
}

// Demographics
export interface DemographicBreakdown {
  category: string
  total_cases: number
  solved_cases: number
  unsolved_cases: number
  solve_rate: number
  percentage_of_total: number
}

export interface DemographicsResponse {
  by_sex: DemographicBreakdown[]
  by_race: DemographicBreakdown[]
  by_age_group: DemographicBreakdown[]
}

// Category Breakdown (shared structure)
export interface CategoryBreakdown {
  category: string
  count: number
  percentage: number
  solve_rate: number
}

// Weapons
export interface WeaponStatistics {
  weapons: CategoryBreakdown[]
  total_cases: number
}

// Circumstances
export interface CircumstanceStatistics {
  circumstances: CategoryBreakdown[]
  total_cases: number
}

// Relationships
export interface RelationshipStatistics {
  relationships: CategoryBreakdown[]
  total_cases: number
}

// Geographic Statistics
export interface StateStatistic {
  state: string
  total_cases: number
  solved_cases: number
  solve_rate: number
}

export interface CountyStatistic {
  county: string
  state: string
  total_cases: number
  solved_cases: number
  solve_rate: number
}

export interface GeographicStatistics {
  top_states: StateStatistic[]
  top_counties: CountyStatistic[]
}

// Trend Statistics
export interface YearlyTrendPoint {
  year: number
  total_cases: number
  solved_cases: number
  solve_rate: number
}

export interface TrendStatistics {
  yearly_data: YearlyTrendPoint[]
  overall_trend: 'increasing' | 'decreasing' | 'stable'
  average_annual_cases: number
}

// Seasonal Statistics
export interface SeasonalPattern {
  month: number
  month_name: string
  average_cases: number
  percentage_of_annual: number
}

export interface SeasonalStatistics {
  patterns: SeasonalPattern[]
  peak_month: string
  lowest_month: string
}

// Filter parameters for statistics queries
export interface StatisticsFilters {
  start_year?: number
  end_year?: number
  state?: string
  county?: string
  solved?: boolean
  weapon?: string
  victim_sex?: string
  victim_race?: string
  victim_age_min?: number
  victim_age_max?: number
  relationship?: string
  circumstance?: string
}
