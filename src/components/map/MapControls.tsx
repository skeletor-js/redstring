/**
 * MapControls - Control panel component for map visualization options.
 *
 * Provides controls for view mode selection and color metric selection.
 */

import React from 'react'
import { MapViewMode, MapColorMetric } from '../../types/map'

/**
 * MapControls component props.
 */
interface MapControlsProps {
  /** Current view mode */
  viewMode: MapViewMode
  /** Callback when view mode changes */
  onViewModeChange: (mode: MapViewMode) => void
  /** Current color metric */
  colorMetric: MapColorMetric
  /** Callback when color metric changes */
  onColorMetricChange: (metric: MapColorMetric) => void
}

/**
 * View mode options with labels and icons.
 */
const VIEW_MODE_OPTIONS: { value: MapViewMode; label: string; icon: string }[] = [
  { value: 'markers', label: 'Markers', icon: '📍' },
  { value: 'choropleth', label: 'Choropleth', icon: '🗺️' },
  { value: 'heatmap', label: 'Heatmap', icon: '🔥' },
]

/**
 * Color metric options with labels.
 */
const COLOR_METRIC_OPTIONS: { value: MapColorMetric; label: string }[] = [
  { value: 'solve_rate', label: 'Solve Rate' },
  { value: 'total_cases', label: 'Total Cases' },
  { value: 'unsolved_cases', label: 'Unsolved Cases' },
]

/**
 * Map controls component.
 *
 * Provides UI for selecting view mode and color metric for the map.
 */
export const MapControls: React.FC<MapControlsProps> = ({
  viewMode,
  onViewModeChange,
  colorMetric,
  onColorMetricChange,
}) => {
  return (
    <div className="map-controls">
      {/* View Mode Selection */}
      <div className="map-controls-panel">
        <div className="map-controls-title">View Mode</div>
        <div className="map-controls-group">
          {VIEW_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`map-control-button ${viewMode === option.value ? 'active' : ''}`}
              onClick={() => onViewModeChange(option.value)}
              title={option.label}
            >
              <span className="map-control-icon">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Metric Selection */}
      <div className="map-controls-panel">
        <div className="map-controls-title">Color By</div>
        <div className="map-controls-group">
          {COLOR_METRIC_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`map-control-button ${colorMetric === option.value ? 'active' : ''}`}
              onClick={() => onColorMetricChange(option.value)}
              title={option.label}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MapControls
