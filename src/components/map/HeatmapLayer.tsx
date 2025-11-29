/**
 * HeatmapLayer - Renders a heat map overlay on the Leaflet map.
 */

/* eslint-disable react/prop-types */
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

interface HeatmapLayerProps {
  points: Array<{
    latitude: number
    longitude: number
    intensity?: number
  }>
  options?: {
    radius?: number
    blur?: number
    maxZoom?: number
    max?: number
    gradient?: Record<number, string>
  }
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ points, options = {} }) => {
  const map = useMap()

  useEffect(() => {
    if (!points || points.length === 0) return

    // Convert points to heatmap format: [lat, lng, intensity]
    const heatData: [number, number, number][] = points.map((p) => [
      p.latitude,
      p.longitude,
      p.intensity ?? 1,
    ])

    // Create heatmap layer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heatLayer = (L as any).heatLayer(heatData, {
      radius: options.radius ?? 25,
      blur: options.blur ?? 15,
      maxZoom: options.maxZoom ?? 17,
      max: options.max ?? 1.0,
      gradient: options.gradient ?? {
        0.0: '#3388ff',
        0.25: '#00ff00',
        0.5: '#ffff00',
        0.75: '#ff8800',
        1.0: '#ff0000',
      },
    })

    heatLayer.addTo(map)

    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, points, options])

  return null
}
