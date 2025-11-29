/**
 * SimilarCasesModal - Modal displaying cases similar to a reference case.
 *
 * Shows similarity scores, matching factors, and allows navigation
 * to similar cases.
 */

import React from 'react'
import { Dialog } from '@headlessui/react'
import { useSimilarCases } from '../../hooks/useSimilarity'
import { getUserMessage } from '../../utils/errorHandler'
import type { SimilarCase } from '../../types/similarity'
import './SimilarCasesModal.css'

interface SimilarCasesModalProps {
  /** ID of the reference case */
  caseId: string
  /** Called when modal should close */
  onClose: () => void
  /** Called when a similar case is selected */
  onSelectCase: (caseId: string) => void
}

/**
 * Get score color class based on similarity score.
 */
const getScoreColor = (score: number): string => {
  if (score >= 70) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

/**
 * Format factor name for display.
 */
const formatFactorName = (name: string): string => {
  const labels: Record<string, string> = {
    weapon: 'Weapon',
    geographic: 'Location',
    victim_age: 'Age',
    temporal: 'Time',
    victim_race: 'Race',
    circumstance: 'Circumstance',
    relationship: 'Relationship',
  }
  return labels[name] || name
}

/**
 * SimilarCaseCard - Individual similar case display.
 */
const SimilarCaseCard: React.FC<{
  similar: SimilarCase
  onClick: () => void
}> = ({ similar, onClick }) => {
  // Get top matching factors (non-zero, sorted by score)
  const topFactors = Object.entries(similar.matching_factors)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  return (
    <button
      type="button"
      className="similar-case-card"
      onClick={onClick}
      aria-label={`View case ${similar.case_id} with ${similar.similarity_score}% similarity`}
    >
      <div className="similar-case-header">
        <span className="similar-case-id">#{similar.case_id}</span>
        <span
          className={`similar-case-score ${getScoreColor(similar.similarity_score)}`}
        >
          {similar.similarity_score.toFixed(1)}% match
        </span>
      </div>

      <div className="similar-case-details">
        <span>{similar.year}</span>
        <span>{similar.state}</span>
        <span>{similar.weapon || 'Unknown weapon'}</span>
        <span>
          {similar.vic_sex || 'Unknown'}, age {similar.vic_age ?? 'Unknown'}
        </span>
        <span className={similar.solved ? 'solved' : 'unsolved'}>
          {similar.solved ? 'Solved' : 'Unsolved'}
        </span>
      </div>

      <div className="similar-case-factors">
        {topFactors.map(([name, value]) => (
          <span key={name} className="similar-case-factor">
            {formatFactorName(name)}: {value.toFixed(0)}%
          </span>
        ))}
      </div>
    </button>
  )
}

/**
 * SimilarCasesModal component.
 */
export const SimilarCasesModal: React.FC<SimilarCasesModalProps> = ({
  caseId,
  onClose,
  onSelectCase,
}) => {
  const { data, isLoading, error } = useSimilarCases(caseId, { limit: 50 })

  return (
    <Dialog open={true} onClose={onClose} className="similar-cases-dialog">
      <div className="similar-cases-backdrop" aria-hidden="true" />

      <div className="similar-cases-container">
        <Dialog.Panel className="similar-cases-panel">
          <div className="similar-cases-header">
            <div>
              <Dialog.Title className="similar-cases-title">Similar Cases</Dialog.Title>
              <p className="similar-cases-subtitle">
                Cases similar to <strong>#{caseId}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="similar-cases-close"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="similar-cases-content">
            {isLoading && (
              <div className="similar-cases-loading">
                <div className="loading-spinner" />
                <p>Finding similar cases...</p>
              </div>
            )}

            {error && (
              <div className="similar-cases-error">
                <p>Error finding similar cases</p>
                <p className="similar-cases-error-detail">{getUserMessage(error)}</p>
              </div>
            )}

            {data && data.similar_cases.length === 0 && (
              <div className="similar-cases-empty">
                <p>No similar cases found</p>
                <p className="similar-cases-empty-hint">
                  Try adjusting the similarity threshold or filters.
                </p>
              </div>
            )}

            {data && data.similar_cases.length > 0 && (
              <>
                <div className="similar-cases-count">
                  Found <strong>{data.total_found}</strong> similar cases
                </div>

                <div className="similar-cases-legend">
                  <span className="legend-item">
                    <span className="legend-dot high" /> High match (70%+)
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot medium" /> Medium match (50-69%)
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot low" /> Low match (&lt;50%)
                  </span>
                </div>

                <div className="similar-cases-list">
                  {data.similar_cases.map((similar) => (
                    <SimilarCaseCard
                      key={similar.case_id}
                      similar={similar}
                      onClick={() => {
                        onClose()
                        onSelectCase(similar.case_id)
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default SimilarCasesModal
