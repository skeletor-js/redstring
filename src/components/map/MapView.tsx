/**
 * MapView - Main container component for the map visualization.
 *
 * Renders a Leaflet map with county data and case markers.
 * Integrates with the filter system and provides view mode controls.
 */

import React, { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { useMap as useMapData } from '../../hooks/useMap'
import { MapControls } from './MapControls'
import { MapLegend } from './MapLegend'
import { CountyLayer } from './CountyLayer'
import { CaseMarkers } from './CaseMarkers'
import './MapView.css'

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })
  ._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// US center coordinates
const US_CENTER: [number, number] = [39.8283, -98.5795]
const DEFAULT_ZOOM = 4

/**
 * Component to handle map bounds updates when data changes.
 */
const MapBoundsHandler: React.FC<{
  bounds?: { north: number; south: number; east: number; west: number }
}> = ({ bounds }) => {
  const map = useMap()

  useEffect(() => {
    if (bounds) {
      const leafletBounds = L.latLngBounds(
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      )
      map.fitBounds(leafletBounds, { padding: [50, 50] })
    }
  }, [bounds, map])

  return null
}

/**
 * Component to track zoom level changes.
 */
const ZoomHandler: React.FC<{
  onZoomChange: (zoom: number) => void
}> = ({ onZoomChange }) => {
  const map = useMap()

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom())
    }

    map.on('zoomend', handleZoom)
    return () => {
      map.off('zoomend', handleZoom)
    }
  }, [map, onZoomChange])

  return null
}

/**
 * MapView component props.
 */
interface MapViewProps {
  /** Optional class name for styling */
  className?: string
}

/**
 * Main map view component.
 *
 * Displays an interactive map with county-level data and case markers.
 * Supports multiple view modes: markers, choropleth, and heatmap.
 */
export const MapView: React.FC<MapViewProps> = ({ className }) => {
  const {
    countyData,
    casePoints,
    isLoading,
    error,
    viewMode,
    setViewMode,
    colorMetric,
    setColorMetric,
    zoomLevel,
    setZoomLevel,
  } = useMapData()

  // Show loading state
  if (isLoading && !countyData) {
    return (
      <div className={`map-view ${className || ''}`}>
        <div className="map-loading">
          <div className="map-loading-spinner" />
          <p>Loading map data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !countyData) {
    return (
      <div className={`map-view ${className || ''}`}>
        <div className="map-error">
          <p>Failed to load map data</p>
          <p className="map-error-detail">{error.message}</p>
        </div>
      </div>
    )
  }

  // Show empty state
  if (!countyData || countyData.counties.length === 0) {
    return (
      <div className={`map-view ${className || ''}`}>
        <div className="map-empty">
          <p>No data available for the current filters</p>
          <p className="map-empty-hint">Try adjusting your filter criteria</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`map-view ${className || ''}`}>
      <MapContainer
        center={US_CENTER}
        zoom={DEFAULT_ZOOM}
        className="map-container"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* Base tile layer - OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Handle map bounds */}
        <MapBoundsHandler bounds={countyData.bounds} />

        {/* Track zoom level */}
        <ZoomHandler onZoomChange={setZoomLevel} />

        {/* County layer - always visible */}
        <CountyLayer
          counties={countyData.counties}
          colorMetric={colorMetric}
          viewMode={viewMode}
        />

        {/* Case markers - visible when zoomed in or in markers mode */}
        {(viewMode === 'markers' || zoomLevel >= 8) && casePoints && (
          <CaseMarkers cases={casePoints.cases} />
        )}
      </MapContainer>

      {/* Map controls overlay */}
      <MapControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        colorMetric={colorMetric}
        onColorMetricChange={setColorMetric}
      />

      {/* Legend overlay */}
      <MapLegend colorMetric={colorMetric} viewMode={viewMode} />

      {/* Loading indicator for background updates */}
      {isLoading && (
        <div className="map-updating">
          <div className="map-updating-spinner" />
        </div>
      )}
    </div>
  )
}

export default MapView
