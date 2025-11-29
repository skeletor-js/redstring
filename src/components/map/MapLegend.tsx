/**
 * MapLegend - Legend component for map visualization.
 *
 * Displays color scale and labels based on the selected metric.
 */

import React from 'react'
import { MapViewMode, MapColorMetric } from '../../types/map'

/**
 * MapLegend component props.
 */
interface MapLegendProps {
  /** Current color metric */
  colorMetric: MapColorMetric
  /** Current view mode */
  viewMode: MapViewMode
}

/**
 * Get legend configuration based on color metric.
 */
const getLegendConfig = (metric: MapColorMetric) => {
  switch (metric) {
    case 'solve_rate':
      return {
        title: 'Solve Rate',
        minLabel: '0%',
        maxLabel: '100%',
        gradient: 'linear-gradient(to right, #f85149, #d29922, #3fb950)',
        items: [
          { color: '#f85149', label: 'Low (0-33%)' },
          { color: '#d29922', label: 'Medium (34-66%)' },
          { color: '#3fb950', label: 'High (67-100%)' },
        ],
      }
    case 'total_cases':
      return {
        title: 'Total Cases',
        minLabel: '0',
        maxLabel: '1000+',
        gradient: 'linear-gradient(to right, #58a6ff22, #58a6ff)',
        items: [
          { color: '#58a6ff44', label: 'Few (1-100)' },
          { color: '#58a6ff88', label: 'Moderate (101-500)' },
          { color: '#58a6ff', label: 'Many (500+)' },
        ],
      }
    case 'unsolved_cases':
      return {
        title: 'Unsolved Cases',
        minLabel: '0',
        maxLabel: '500+',
        gradient: 'linear-gradient(to right, #f8514922, #f85149)',
        items: [
          { color: '#f8514944', label: 'Few (1-50)' },
          { color: '#f8514988', label: 'Moderate (51-200)' },
          { color: '#f85149', label: 'Many (200+)' },
        ],
      }
    default:
      return {
        title: 'Legend',
        minLabel: 'Low',
        maxLabel: 'High',
        gradient: 'linear-gradient(to right, #58a6ff22, #58a6ff)',
        items: [],
      }
  }
}

/**
 * Map legend component.
 *
 * Displays a color scale legend based on the selected metric.
 */
export const MapLegend: React.FC<MapLegendProps> = ({ colorMetric, viewMode }) => {
  const config = getLegendConfig(colorMetric)

  // Show heatmap legend for heatmap mode
  if (viewMode === 'heatmap') {
    return (
      <div className="map-legend">
        <div className="heatmap-legend">
          <div className="map-legend-title">Case Density</div>
          <div className="heatmap-gradient-bar" />
          <div className="heatmap-gradient-labels">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="map-legend">
      <div className="map-legend-title">{config.title}</div>

      {/* Gradient scale */}
      <div className="map-legend-scale">
        <div className="map-legend-gradient" style={{ background: config.gradient }} />
        <div className="map-legend-labels">
          <span>{config.minLabel}</span>
          <span>{config.maxLabel}</span>
        </div>
      </div>

      {/* Legend items */}
      {config.items.length > 0 && (
        <div className="map-legend-items" style={{ marginTop: '8px' }}>
          {config.items.map((item, index) => (
            <div key={index} className="map-legend-item">
              <div
                className="map-legend-color"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Case status legend for markers mode */}
      {viewMode === 'markers' && (
        <div
          className="map-legend-items"
          style={{
            marginTop: '12px',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '8px',
          }}
        >
          <div className="map-legend-title" style={{ marginBottom: '4px' }}>
            Case Status
          </div>
          <div className="map-legend-item">
            <div className="map-legend-color" style={{ backgroundColor: '#3fb950' }} />
            <span>Solved</span>
          </div>
          <div className="map-legend-item">
            <div className="map-legend-color" style={{ backgroundColor: '#f85149' }} />
            <span>Unsolved</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapLegend
