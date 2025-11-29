/**
 * CaseMarkers - Individual case markers component for map visualization.
 *
 * Renders case points as markers when zoomed in.
 * Uses clustering for performance with large datasets.
 */

import React, { useMemo } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import { MapCasePoint } from '../../types/map'

/**
 * CaseMarkers component props.
 */
interface CaseMarkersProps {
  /** Array of case points to display */
  cases: MapCasePoint[]
}

/**
 * Get marker color based on solved status.
 */
const getMarkerColor = (solved: boolean): string => {
  return solved ? '#3fb950' : '#f85149'
}

/**
 * Format victim info for display.
 */
const formatVictimInfo = (sex?: string, age?: number): string => {
  const parts: string[] = []
  if (sex) parts.push(sex)
  if (age !== undefined && age !== 999) parts.push(`${age} years old`)
  if (age === 999) parts.push('Age unknown')
  return parts.length > 0 ? parts.join(', ') : 'Unknown'
}

/**
 * Case markers component.
 *
 * Renders individual case points as circle markers on the map.
 * Color indicates solved/unsolved status.
 */
export const CaseMarkers: React.FC<CaseMarkersProps> = ({ cases }) => {
  // Memoize the rendered markers for performance
  const markers = useMemo(() => {
    // Limit markers for performance (clustering would be better for large datasets)
    const displayCases = cases.slice(0, 500)

    return displayCases.map((casePoint) => {
      const color = getMarkerColor(casePoint.solved)

      return (
        <CircleMarker
          key={casePoint.case_id}
          center={[casePoint.latitude, casePoint.longitude]}
          radius={6}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            weight: 2,
            opacity: 1,
          }}
        >
          <Popup>
            <div className="case-popup">
              <div className="case-popup-title">Case #{casePoint.case_id}</div>
              <div
                className={`case-popup-status ${casePoint.solved ? 'solved' : 'unsolved'}`}
              >
                {casePoint.solved ? 'Solved' : 'Unsolved'}
              </div>
              <div className="case-popup-details">
                <div className="case-popup-detail">
                  <span className="case-popup-label">Year:</span>
                  <span className="case-popup-value">{casePoint.year}</span>
                </div>
                <div className="case-popup-detail">
                  <span className="case-popup-label">Victim:</span>
                  <span className="case-popup-value">
                    {formatVictimInfo(casePoint.victim_sex, casePoint.victim_age)}
                  </span>
                </div>
                {casePoint.weapon && (
                  <div className="case-popup-detail">
                    <span className="case-popup-label">Weapon:</span>
                    <span className="case-popup-value">{casePoint.weapon}</span>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      )
    })
  }, [cases])

  // Show a message if there are more cases than displayed
  const hasMore = cases.length > 500

  return (
    <React.Fragment>
      {markers}
      {hasMore && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '10px',
            background: 'var(--color-bg-overlay)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            zIndex: 1000,
          }}
        >
          Showing 500 of {cases.length.toLocaleString()} cases
        </div>
      )}
    </React.Fragment>
  )
}

export default CaseMarkers
