/**
 * CountyLayer - County markers/circles component for map visualization.
 *
 * Renders county data as circle markers with size based on case count
 * and color based on selected metric.
 */

import React, { useMemo } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import { CountyMapData, MapViewMode, MapColorMetric } from '../../types/map'

/**
 * CountyLayer component props.
 */
interface CountyLayerProps {
  /** Array of county data to display */
  counties: CountyMapData[]
  /** Current color metric */
  colorMetric: MapColorMetric
  /** Current view mode */
  viewMode: MapViewMode
}

/**
 * Get color based on metric value.
 */
const getColor = (county: CountyMapData, metric: MapColorMetric): string => {
  switch (metric) {
    case 'solve_rate': {
      const rate = county.solve_rate
      if (rate >= 67) return '#3fb950' // High - green
      if (rate >= 33) return '#d29922' // Medium - yellow
      return '#f85149' // Low - red
    }
    case 'total_cases': {
      const total = county.total_cases
      if (total >= 500) return '#58a6ff' // Many - full blue
      if (total >= 100) return '#58a6ff88' // Moderate - medium blue
      return '#58a6ff44' // Few - light blue
    }
    case 'unsolved_cases': {
      const unsolved = county.unsolved_cases
      if (unsolved >= 200) return '#f85149' // Many - full red
      if (unsolved >= 50) return '#f8514988' // Moderate - medium red
      return '#f8514944' // Few - light red
    }
    default:
      return '#58a6ff'
  }
}

/**
 * Get circle radius based on case count.
 * Uses logarithmic scale for better visualization.
 */
const getRadius = (totalCases: number): number => {
  if (totalCases === 0) return 3
  // Logarithmic scale: min 5, max 30
  const logScale = Math.log10(totalCases + 1)
  return Math.min(Math.max(logScale * 8, 5), 30)
}

/**
 * Get fill opacity based on view mode.
 */
const getFillOpacity = (viewMode: MapViewMode): number => {
  switch (viewMode) {
    case 'choropleth':
      return 0.7
    case 'heatmap':
      return 0.5
    default:
      return 0.6
  }
}

/**
 * Format percentage for display.
 * Note: value is already a percentage (0-100), not a decimal.
 */
const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`
}

/**
 * Format number with commas.
 */
const formatNumber = (value: number): string => {
  return value.toLocaleString()
}

/**
 * County layer component.
 *
 * Renders county data as circle markers on the map.
 */
export const CountyLayer: React.FC<CountyLayerProps> = ({
  counties,
  colorMetric,
  viewMode,
}) => {
  // Memoize the rendered markers for performance
  const markers = useMemo(() => {
    return counties.map((county) => {
      const color = getColor(county, colorMetric)
      const radius = getRadius(county.total_cases)
      const fillOpacity = getFillOpacity(viewMode)

      return (
        <CircleMarker
          key={county.fips}
          center={[county.latitude, county.longitude]}
          radius={radius}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: fillOpacity,
            weight: 1,
            opacity: 0.8,
          }}
        >
          <Popup>
            <div className="county-popup">
              <div className="county-popup-title">
                {county.county_name}, {county.state_name}
              </div>
              <div className="county-popup-stats">
                <div className="county-popup-stat">
                  <span className="county-popup-label">Total Cases:</span>
                  <span className="county-popup-value">
                    {formatNumber(county.total_cases)}
                  </span>
                </div>
                <div className="county-popup-stat">
                  <span className="county-popup-label">Solved:</span>
                  <span className="county-popup-value solved">
                    {formatNumber(county.solved_cases)}
                  </span>
                </div>
                <div className="county-popup-stat">
                  <span className="county-popup-label">Unsolved:</span>
                  <span className="county-popup-value unsolved">
                    {formatNumber(county.unsolved_cases)}
                  </span>
                </div>
                <div className="county-popup-stat">
                  <span className="county-popup-label">Solve Rate:</span>
                  <span
                    className={`county-popup-value ${
                      county.solve_rate >= 50 ? 'solved' : 'unsolved'
                    }`}
                  >
                    {formatPercent(county.solve_rate)}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      )
    })
  }, [counties, colorMetric, viewMode])

  return <>{markers}</>
}

export default CountyLayer
