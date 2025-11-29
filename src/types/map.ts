export interface CountyMapData {
  fips: string
  state_name: string
  county_name: string
  latitude: number
  longitude: number
  total_cases: number
  solved_cases: number
  unsolved_cases: number
  solve_rate: number
}

export interface MapCasePoint {
  case_id: number
  latitude: number
  longitude: number
  year: number
  solved: boolean
  victim_sex?: string
  victim_age?: number
  weapon?: string
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapDataResponse {
  counties: CountyMapData[]
  bounds: MapBounds
}

export interface MapCasesResponse {
  cases: MapCasePoint[]
  total: number
}

export type MapViewMode = 'markers' | 'choropleth' | 'heatmap'
export type MapColorMetric = 'solve_rate' | 'total_cases' | 'unsolved_cases'
