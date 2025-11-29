/**
 * Map components barrel export.
 *
 * Exports all map-related components for easy importing.
 */

export { MapView, default as MapViewDefault } from './MapView'
export { MapControls, default as MapControlsDefault } from './MapControls'
export { MapLegend, default as MapLegendDefault } from './MapLegend'
export { CountyLayer, default as CountyLayerDefault } from './CountyLayer'
export { ChoroplethLayer, default as ChoroplethLayerDefault } from './ChoroplethLayer'
export { CaseMarkers, default as CaseMarkersDefault } from './CaseMarkers'

// Re-export types for convenience
export type {
  CountyMapData,
  MapCasePoint,
  MapBounds,
  MapDataResponse,
  MapCasesResponse,
  MapViewMode,
  MapColorMetric,
} from '../../types/map'
