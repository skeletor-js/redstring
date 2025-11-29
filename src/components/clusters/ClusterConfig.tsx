/**
 * Cluster Configuration Panel
 *
 * Provides UI for configuring cluster analysis parameters including
 * similarity thresholds, weights, and filter criteria.
 *
 * Integrates with the tiered size limit system to handle large datasets:
 * - Tier 1 (< 10,000 cases): Runs immediately
 * - Tier 2 (10,000 - 50,000 cases): Shows confirmation modal
 * - Tier 3 (> 50,000 cases): Blocked with filter suggestions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useFilterStore } from '../../stores/useFilterStore'
import { useClusterPreflight } from '../../hooks/useClusters'
import {
  DEFAULT_CLUSTER_CONFIG,
  type ClusterAnalysisRequest,
  type ClusterPreflightResponse,
  type SimilarityWeights,
} from '../../types/cluster'
import './ClusterConfig.css'

/**
 * Format seconds into a human-readable time string.
 */
function formatTime(seconds: number | null): string {
  if (!seconds) return 'Unknown'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  return `${(seconds / 3600).toFixed(1)} hours`
}

interface ClusterConfigProps {
  onAnalyze: (config: ClusterAnalysisRequest, force?: boolean) => void
  isAnalyzing: boolean
  onOpenFilters?: () => void
}

export function ClusterConfig({
  onAnalyze,
  isAnalyzing,
  onOpenFilters,
}: ClusterConfigProps) {
  const filterState = useFilterStore()
  const [showAdvanced, setShowAdvanced] = useState(false)

  // State for preflight result and confirmation modal
  const [preflightResult, setPreflightResult] =
    useState<ClusterPreflightResponse | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Ref for modal focus management
  const modalRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  const [config, setConfig] = useState<ClusterAnalysisRequest>({
    ...DEFAULT_CLUSTER_CONFIG,
    // Include current filter state
    filter: filterState as any,
  })

  // Preflight mutation hook
  const preflightMutation = useClusterPreflight()

  // Clear preflight result when filters or config change
  useEffect(() => {
    setPreflightResult(null)
  }, [
    filterState,
    config.min_cluster_size,
    config.max_solve_rate,
    config.similarity_threshold,
  ])

  // Focus trap for modal accessibility
  useEffect(() => {
    if (showConfirmModal && cancelButtonRef.current) {
      cancelButtonRef.current.focus()
    }
  }, [showConfirmModal])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirmModal) {
        setShowConfirmModal(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showConfirmModal])

  // Build API filter from filter state
  const buildApiFilter = useCallback(() => {
    const apiFilter: any = {}
    if (filterState.states && filterState.states.length > 0) {
      apiFilter.states = filterState.states
    }
    if (filterState.yearRange) {
      apiFilter.year_min = filterState.yearRange[0]
      apiFilter.year_max = filterState.yearRange[1]
    }
    if (filterState.solved !== 'all') {
      apiFilter.solved = filterState.solved === 'solved' ? 1 : 0
    }
    if (filterState.vicSex && filterState.vicSex.length > 0) {
      apiFilter.vic_sex = filterState.vicSex
    }
    if (filterState.vicRace && filterState.vicRace.length > 0) {
      apiFilter.vic_race = filterState.vicRace
    }
    if (filterState.vicEthnic && filterState.vicEthnic.length > 0) {
      apiFilter.vic_ethnic = filterState.vicEthnic
    }
    if (filterState.weapon && filterState.weapon.length > 0) {
      apiFilter.weapon = filterState.weapon
    }
    if (filterState.relationship && filterState.relationship.length > 0) {
      apiFilter.relationship = filterState.relationship
    }
    if (filterState.circumstance && filterState.circumstance.length > 0) {
      apiFilter.circumstance = filterState.circumstance
    }
    if (filterState.situation && filterState.situation.length > 0) {
      apiFilter.situation = filterState.situation
    }
    if (filterState.counties && filterState.counties.length > 0) {
      apiFilter.county = filterState.counties
    }
    if (filterState.msa && filterState.msa.length > 0) {
      apiFilter.msa = filterState.msa
    }
    if (filterState.agencySearch) {
      apiFilter.agency_search = filterState.agencySearch
    }
    if (filterState.caseId) {
      apiFilter.case_id = filterState.caseId
    }
    if (filterState.vicAgeRange) {
      apiFilter.vic_age_min = filterState.vicAgeRange[0]
      apiFilter.vic_age_max = filterState.vicAgeRange[1]
      apiFilter.include_unknown_age = filterState.includeUnknownAge
    }
    return apiFilter
  }, [filterState])

  // Run analysis with the given force flag
  const runAnalysis = useCallback(
    (force: boolean) => {
      const apiFilter = buildApiFilter()
      onAnalyze(
        {
          ...config,
          filter: apiFilter,
        },
        force
      )
    },
    [buildApiFilter, config, onAnalyze]
  )

  // Handle form submission - run preflight check first
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Build the request config with filters
    const apiFilter = buildApiFilter()
    const requestConfig = {
      ...config,
      filter: apiFilter,
    }

    try {
      // Run preflight check first
      const result = await preflightMutation.mutateAsync({
        config: requestConfig,
        filters: filterState,
      })

      setPreflightResult(result)

      if (result.tier === 1) {
        // Tier 1: Run immediately
        runAnalysis(false)
      } else if (result.tier === 2) {
        // Tier 2: Show confirmation modal
        setShowConfirmModal(true)
      }
      // Tier 3: Blocked state is handled by UI based on preflightResult
    } catch (error) {
      // Error is handled by the mutation's error state
      console.error('Preflight check failed:', error)
    }
  }

  // Handle confirmation modal proceed
  const handleConfirmProceed = () => {
    setShowConfirmModal(false)
    runAnalysis(true)
  }

  // Handle confirmation modal cancel
  const handleConfirmCancel = () => {
    setShowConfirmModal(false)
  }

  // Handle opening filters (for Tier 3 blocked state)
  const handleOpenFilters = () => {
    setPreflightResult(null)
    if (onOpenFilters) {
      onOpenFilters()
    }
  }

  // Clear blocked state
  const handleClearBlockedState = () => {
    setPreflightResult(null)
  }

  const handleWeightChange = (key: keyof SimilarityWeights, value: number) => {
    setConfig({
      ...config,
      weights: {
        ...config.weights!,
        [key]: value,
      },
    })
  }

  const resetToDefaults = () => {
    setConfig({
      ...DEFAULT_CLUSTER_CONFIG,
      filter: filterState as any,
    })
  }

  const totalWeight =
    (config.weights?.geographic || 0) +
    (config.weights?.weapon || 0) +
    (config.weights?.victim_sex || 0) +
    (config.weights?.victim_age || 0) +
    (config.weights?.temporal || 0) +
    (config.weights?.victim_race || 0)

  const isWeightValid = Math.abs(totalWeight - 100) < 0.1

  return (
    <div className="cluster-config">
      <div className="cluster-config-header">
        <div>
          <h2 className="cluster-config-title">Cluster Analysis Configuration</h2>
          <p className="cluster-config-description">
            Configure parameters for detecting suspicious case patterns
          </p>
        </div>
        <button
          type="button"
          onClick={resetToDefaults}
          className="cluster-config-reset"
        >
          Reset to Defaults
        </button>
      </div>

      <form onSubmit={handleSubmit} className="cluster-config-form">
        {/* Primary Parameters */}
        <div className="cluster-config-section">
          <h3 className="cluster-config-section-title">Detection Parameters</h3>

          <div className="cluster-config-grid">
            <div className="cluster-config-field">
              <label className="cluster-config-label">
                Minimum Cluster Size
                <span className="cluster-config-label-hint">(3-100 cases)</span>
              </label>
              <input
                type="number"
                min={3}
                max={100}
                value={config.min_cluster_size}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    min_cluster_size: parseInt(e.target.value, 10),
                  })
                }
                className="cluster-config-input"
              />
              <p className="cluster-config-help">
                Minimum cases required to form a cluster
              </p>
            </div>

            <div className="cluster-config-field">
              <label className="cluster-config-label">
                Max Solve Rate (%)
                <span className="cluster-config-label-hint">(0-100)</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={config.max_solve_rate}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    max_solve_rate: parseFloat(e.target.value),
                  })
                }
                className="cluster-config-input"
              />
              <p className="cluster-config-help">
                Only show clusters below this solve rate (suspicious)
              </p>
            </div>

            <div className="cluster-config-field">
              <label className="cluster-config-label">
                Similarity Threshold (%)
                <span className="cluster-config-label-hint">(0-100)</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={config.similarity_threshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    similarity_threshold: parseFloat(e.target.value),
                  })
                }
                className="cluster-config-input"
              />
              <p className="cluster-config-help">
                Minimum similarity score to group cases together
              </p>
            </div>
          </div>
        </div>

        {/* Advanced: Similarity Weights */}
        <div className="cluster-config-section">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="cluster-config-section-toggle"
          >
            <span className="cluster-config-section-title">
              Advanced: Similarity Weights
              {!isWeightValid && (
                <span className="cluster-config-weight-warning">
                  ⚠ Must sum to 100%
                </span>
              )}
            </span>
            <span className="cluster-config-toggle-icon">
              {showAdvanced ? '−' : '+'}
            </span>
          </button>

          {showAdvanced && (
            <div className="cluster-config-weights">
              <p className="cluster-config-weights-info">
                Adjust how different factors contribute to similarity scoring. All
                weights must sum to 100.0.
              </p>

              <div className="cluster-config-weight-grid">
                {[
                  {
                    key: 'geographic' as const,
                    label: 'Geographic Proximity',
                    default: 35,
                  },
                  { key: 'weapon' as const, label: 'Weapon Match', default: 25 },
                  {
                    key: 'victim_sex' as const,
                    label: 'Victim Sex Match',
                    default: 20,
                  },
                  {
                    key: 'victim_age' as const,
                    label: 'Victim Age Proximity',
                    default: 10,
                  },
                  {
                    key: 'temporal' as const,
                    label: 'Temporal Proximity',
                    default: 7,
                  },
                  {
                    key: 'victim_race' as const,
                    label: 'Victim Race Match',
                    default: 3,
                  },
                ].map(({ key, label, default: defaultVal }) => (
                  <div key={key} className="cluster-config-weight-field">
                    <div className="cluster-config-weight-header">
                      <label className="cluster-config-weight-label">{label}</label>
                      <span className="cluster-config-weight-value">
                        {config.weights?.[key] || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={config.weights?.[key] || 0}
                      onChange={(e) =>
                        handleWeightChange(key, parseFloat(e.target.value))
                      }
                      className="cluster-config-weight-slider"
                    />
                    <span className="cluster-config-weight-default">
                      Default: {defaultVal}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="cluster-config-weight-total">
                <span>Total Weight:</span>
                <span
                  className={
                    isWeightValid
                      ? 'cluster-config-weight-total-valid'
                      : 'cluster-config-weight-total-invalid'
                  }
                >
                  {totalWeight.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filter Summary */}
        <div className="cluster-config-section">
          <h3 className="cluster-config-section-title">Active Filters</h3>
          <div className="cluster-config-filter-summary">
            {Object.entries(filterState).some(
              ([key, value]) =>
                key !== 'cursor' &&
                key !== 'limit' &&
                value !== null &&
                value !== undefined &&
                (Array.isArray(value) ? value.length > 0 : true)
            ) ? (
              <ul className="cluster-config-filter-list">
                {filterState.states && filterState.states.length > 0 && (
                  <li>
                    <strong>States:</strong> {filterState.states.join(', ')}
                  </li>
                )}
                {filterState.yearRange && (
                  <li>
                    <strong>Year Range:</strong> {filterState.yearRange[0]} –{' '}
                    {filterState.yearRange[1]}
                  </li>
                )}
                {filterState.solved !== 'all' && (
                  <li>
                    <strong>Status:</strong>{' '}
                    {filterState.solved === 'solved' ? 'Solved' : 'Unsolved'}
                  </li>
                )}
                {filterState.vicSex && filterState.vicSex.length > 0 && (
                  <li>
                    <strong>Victim Sex:</strong> {filterState.vicSex.join(', ')}
                  </li>
                )}
                {filterState.weapon && filterState.weapon.length > 0 && (
                  <li>
                    <strong>Weapons:</strong>{' '}
                    {filterState.weapon.slice(0, 3).join(', ')}
                    {filterState.weapon.length > 3 &&
                      ` +${filterState.weapon.length - 3} more`}
                  </li>
                )}
              </ul>
            ) : (
              <p className="cluster-config-filter-empty">
                No filters applied — analyzing all{' '}
                <span className="cluster-config-highlight">894,636 cases</span>
              </p>
            )}
          </div>
        </div>

        {/* Tier 3 Blocked State */}
        {preflightResult?.tier === 3 && (
          <div className="cluster-blocked-state">
            <div className="cluster-blocked-icon">⚠️</div>
            <h3 className="cluster-blocked-title">Dataset Too Large</h3>
            <p className="cluster-blocked-message">{preflightResult.message}</p>
            <p className="cluster-blocked-count">
              <strong>{preflightResult.case_count.toLocaleString()}</strong> cases match
              your current filters
            </p>
            {preflightResult.filter_suggestions &&
              preflightResult.filter_suggestions.length > 0 && (
                <div className="cluster-filter-suggestions">
                  <p className="cluster-filter-suggestions-title">
                    Try applying these filters to reduce the dataset:
                  </p>
                  <ul className="cluster-filter-suggestions-list">
                    {preflightResult.filter_suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            <div className="cluster-blocked-actions">
              <button
                type="button"
                onClick={handleOpenFilters}
                className="cluster-blocked-filter-btn"
              >
                Open Filters
              </button>
              <button
                type="button"
                onClick={handleClearBlockedState}
                className="cluster-blocked-dismiss-btn"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={
            isAnalyzing ||
            !isWeightValid ||
            preflightMutation.isPending ||
            preflightResult?.tier === 3
          }
          className="cluster-config-submit"
        >
          {preflightMutation.isPending ? (
            <>
              <span className="cluster-config-spinner" />
              Checking dataset size...
            </>
          ) : isAnalyzing ? (
            <>
              <span className="cluster-config-spinner" />
              Analyzing...
            </>
          ) : (
            <>
              <span className="cluster-config-submit-icon">▶</span>
              Run Cluster Analysis
            </>
          )}
        </button>

        {/* Preflight error display */}
        {preflightMutation.isError && (
          <div className="cluster-preflight-error">
            <span className="cluster-preflight-error-icon">⚠</span>
            <span>Failed to check dataset size. Please try again.</span>
          </div>
        )}
      </form>

      {/* Tier 2 Confirmation Modal */}
      {showConfirmModal && preflightResult && (
        <div
          className="cluster-confirm-modal-overlay"
          onClick={handleConfirmCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            className="cluster-confirm-modal"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cluster-confirm-modal-header">
              <span className="cluster-confirm-modal-icon">⚠️</span>
              <h3 id="confirm-modal-title" className="cluster-confirm-modal-title">
                Large Dataset Warning
              </h3>
            </div>
            <div className="cluster-confirm-modal-body">
              <p className="cluster-confirm-modal-message">{preflightResult.message}</p>
              <div className="cluster-confirm-modal-stats">
                <div className="cluster-confirm-modal-stat">
                  <span className="cluster-confirm-modal-stat-label">
                    Cases to analyze:
                  </span>
                  <span className="cluster-confirm-modal-stat-value">
                    {preflightResult.case_count.toLocaleString()}
                  </span>
                </div>
                <div className="cluster-confirm-modal-stat">
                  <span className="cluster-confirm-modal-stat-label">
                    Estimated time:
                  </span>
                  <span className="cluster-confirm-modal-stat-value">
                    {formatTime(preflightResult.estimated_time_seconds)}
                  </span>
                </div>
              </div>
              <p className="cluster-confirm-modal-warning">
                This analysis may take a while and could impact system performance.
              </p>
            </div>
            <div className="cluster-confirm-modal-actions">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={handleConfirmCancel}
                className="cluster-confirm-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmProceed}
                className="cluster-confirm-modal-proceed"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
