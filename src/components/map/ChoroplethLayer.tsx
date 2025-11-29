/**
 * ChoroplethLayer - County polygon choropleth visualization.
 *
 * Renders US county boundaries as filled polygons with colors based
 * on the selected metric (solve rate, total cases, unsolved cases).
 * Uses GeoJSON data from the US Census Bureau via CDN.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import type { Topology, Objects, GeometryCollection } from 'topojson-specification'
import {
  CountyMapData,
  MapColorMetric,
  CountyGeoJSON,
  CountyFeature,
} from '../../types/map'

/**
 * ChoroplethLayer component props.
 */
interface ChoroplethLayerProps {
  /** Array of county data with case statistics */
  counties: CountyMapData[]
  /** Current color metric */
  colorMetric: MapColorMetric
}

/**
 * US Counties GeoJSON CDN URL
 * Using topojson-client converted GeoJSON from US Atlas
 */
const COUNTIES_GEOJSON_URL =
  'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json'

/**
 * Get fill color based on metric value with smooth gradients.
 */
const getColor = (
  value: number | undefined,
  metric: MapColorMetric,
  maxValue: number
): string => {
  if (value === undefined || value === 0) {
    return '#1a1a2e' // Dark background for no data
  }

  switch (metric) {
    case 'solve_rate': {
      // Red (0%) -> Yellow (50%) -> Green (100%)
      if (value >= 67) return '#22c55e' // Green
      if (value >= 50) return '#84cc16' // Yellow-green
      if (value >= 33) return '#eab308' // Yellow
      if (value >= 20) return '#f97316' // Orange
      return '#ef4444' // Red
    }
    case 'total_cases': {
      // Light to dark blue based on normalized value
      const normalized = Math.min(value / maxValue, 1)
      if (normalized >= 0.8) return '#1e3a8a' // Dark blue
      if (normalized >= 0.6) return '#1d4ed8' // Blue
      if (normalized >= 0.4) return '#3b82f6' // Medium blue
      if (normalized >= 0.2) return '#60a5fa' // Light blue
      return '#93c5fd' // Very light blue
    }
    case 'unsolved_cases': {
      // Light to dark red based on normalized value
      const normalized = Math.min(value / maxValue, 1)
      if (normalized >= 0.8) return '#7f1d1d' // Dark red
      if (normalized >= 0.6) return '#b91c1c' // Red
      if (normalized >= 0.4) return '#dc2626' // Medium red
      if (normalized >= 0.2) return '#f87171' // Light red
      return '#fca5a5' // Very light red
    }
    default:
      return '#3b82f6'
  }
}

/**
 * TopoJSON structure for US counties
 */
interface USCountiesTopoJSON extends Topology<Objects<{ [key: string]: unknown }>> {
  objects: {
    counties: GeometryCollection<{ [key: string]: unknown }>
  }
}

/**
 * Convert TopoJSON to GeoJSON
 */
const topoToGeo = async (topoData: unknown): Promise<CountyGeoJSON> => {
  // Dynamic import of topojson-client for conversion
  const topojson = await import('topojson-client')

  const topo = topoData as USCountiesTopoJSON

  // Convert TopoJSON to GeoJSON
  const geoData = topojson.feature(topo, topo.objects.counties)

  return geoData as unknown as CountyGeoJSON
}

/**
 * Custom hook to fetch and cache county GeoJSON data.
 */
const useCountyGeoJSON = () => {
  const [geoData, setGeoData] = useState<CountyGeoJSON | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchGeoJSON = async () => {
      // Check sessionStorage cache first
      const cached = sessionStorage.getItem('county-geojson')
      if (cached) {
        try {
          setGeoData(JSON.parse(cached))
          return
        } catch {
          sessionStorage.removeItem('county-geojson')
        }
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(COUNTIES_GEOJSON_URL)
        if (!response.ok) {
          throw new Error(`Failed to fetch county boundaries: ${response.status}`)
        }

        const topoData = await response.json()
        const geoJson = await topoToGeo(topoData)

        if (mounted) {
          setGeoData(geoJson)
          // Cache in sessionStorage (may fail if too large)
          try {
            sessionStorage.setItem('county-geojson', JSON.stringify(geoJson))
          } catch {
            // Ignore storage quota errors
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load map data'))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchGeoJSON()

    return () => {
      mounted = false
    }
  }, [])

  return { geoData, isLoading, error }
}

/**
 * Format percentage for display.
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
 * ChoroplethLayer component.
 *
 * Renders county boundaries as filled polygons with colors based on case data.
 */
export const ChoroplethLayer: React.FC<ChoroplethLayerProps> = ({
  counties,
  colorMetric,
}) => {
  const { geoData, isLoading, error } = useCountyGeoJSON()

  // Create a lookup map for county data by FIPS code
  const countyDataMap = useMemo(() => {
    const lookup = new Map<string, CountyMapData>()
    counties.forEach((county) => {
      // Normalize FIPS code to 5 digits with leading zeros
      const fips = county.fips.padStart(5, '0')
      lookup.set(fips, county)
    })
    return lookup
  }, [counties])

  // Calculate max values for normalization
  const maxValues = useMemo(() => {
    let maxTotal = 0
    let maxUnsolved = 0
    counties.forEach((county) => {
      maxTotal = Math.max(maxTotal, county.total_cases)
      maxUnsolved = Math.max(maxUnsolved, county.unsolved_cases)
    })
    return { maxTotal, maxUnsolved }
  }, [counties])

  // Merge case data into GeoJSON features
  const enrichedGeoData = useMemo(() => {
    if (!geoData) return null

    const enrichedFeatures = geoData.features.map((feature) => {
      // Get FIPS from feature - handle both string and number ids
      const fips = String(feature.id || feature.properties?.GEOID || '').padStart(
        5,
        '0'
      )
      const countyData = countyDataMap.get(fips)

      return {
        ...feature,
        properties: {
          ...feature.properties,
          GEOID: fips,
          total_cases: countyData?.total_cases,
          solved_cases: countyData?.solved_cases,
          unsolved_cases: countyData?.unsolved_cases,
          solve_rate: countyData?.solve_rate,
          state_name: countyData?.state_name,
          county_name: countyData?.county_name,
        },
      } as CountyFeature
    })

    return {
      type: 'FeatureCollection' as const,
      features: enrichedFeatures,
    }
  }, [geoData, countyDataMap])

  // Style function for GeoJSON features
  const getFeatureStyle = useCallback(
    (feature: CountyFeature | undefined) => {
      if (!feature) {
        return {
          fillColor: '#1a1a2e',
          weight: 0.5,
          opacity: 0.5,
          color: '#4a5568',
          fillOpacity: 0.3,
        }
      }

      const featureProps = feature.properties
      let value: number | undefined
      let maxValue = 1

      switch (colorMetric) {
        case 'solve_rate':
          value = featureProps.solve_rate
          maxValue = 100
          break
        case 'total_cases':
          value = featureProps.total_cases
          maxValue = maxValues.maxTotal
          break
        case 'unsolved_cases':
          value = featureProps.unsolved_cases
          maxValue = maxValues.maxUnsolved
          break
      }

      const hasData = value !== undefined && value > 0

      return {
        fillColor: getColor(value, colorMetric, maxValue),
        weight: hasData ? 1 : 0.5,
        opacity: hasData ? 0.8 : 0.3,
        color: hasData ? '#e2e8f0' : '#4a5568',
        fillOpacity: hasData ? 0.7 : 0.1,
      }
    },
    [colorMetric, maxValues]
  )

  // Event handlers for each feature
  const onEachFeature = useCallback(
    (feature: CountyFeature, layer: L.Layer) => {
      const featureProps = feature.properties
      const hasData =
        featureProps.total_cases !== undefined && featureProps.total_cases > 0

      // Highlight on hover
      layer.on({
        mouseover: (e: L.LeafletMouseEvent) => {
          const target = e.target as L.Path
          target.setStyle({
            weight: 2,
            color: '#ffffff',
            fillOpacity: 0.9,
          })
          target.bringToFront()
        },
        mouseout: (e: L.LeafletMouseEvent) => {
          const target = e.target as L.Path
          target.setStyle(getFeatureStyle(feature))
        },
      })

      // Bind popup for counties with data
      if (hasData) {
        const countyName = featureProps.county_name || featureProps.NAME
        const stateName = featureProps.state_name || featureProps.STATE
        const totalCases = featureProps.total_cases || 0
        const solvedCases = featureProps.solved_cases || 0
        const unsolvedCases = featureProps.unsolved_cases || 0
        const solveRate = featureProps.solve_rate || 0
        const solveRateClass = solveRate >= 50 ? 'solved' : 'unsolved'

        const popupContent = `
          <div class="county-popup">
            <div class="county-popup-title">
              ${countyName}, ${stateName}
            </div>
            <div class="county-popup-stats">
              <div class="county-popup-stat">
                <span class="county-popup-label">Total Cases:</span>
                <span class="county-popup-value">${formatNumber(totalCases)}</span>
              </div>
              <div class="county-popup-stat">
                <span class="county-popup-label">Solved:</span>
                <span class="county-popup-value solved">${formatNumber(solvedCases)}</span>
              </div>
              <div class="county-popup-stat">
                <span class="county-popup-label">Unsolved:</span>
                <span class="county-popup-value unsolved">${formatNumber(unsolvedCases)}</span>
              </div>
              <div class="county-popup-stat">
                <span class="county-popup-label">Solve Rate:</span>
                <span class="county-popup-value ${solveRateClass}">
                  ${formatPercent(solveRate)}
                </span>
              </div>
            </div>
          </div>
        `
        ;(layer as L.Path).bindPopup(popupContent)
      }
    },
    [getFeatureStyle]
  )

  // Show loading state
  if (isLoading) {
    return null // MapView shows its own loading indicator
  }

  // Show error state
  if (error) {
    console.error('Choropleth layer error:', error)
    return null
  }

  // Don't render if no data
  if (!enrichedGeoData) {
    return null
  }

  return (
    <GeoJSON
      key={`choropleth-${colorMetric}`}
      data={enrichedGeoData}
      style={(feature) => getFeatureStyle(feature as CountyFeature)}
      onEachFeature={(feature, layer) =>
        onEachFeature(feature as CountyFeature, layer)
      }
    />
  )
}

export default ChoroplethLayer
