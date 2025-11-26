/**
 * Cluster Configuration Panel
 *
 * Provides UI for configuring cluster analysis parameters including
 * similarity thresholds, weights, and filter criteria.
 */

import React, { useState } from 'react';
import { useFilterStore } from '../../stores/useFilterStore';
import {
  DEFAULT_CLUSTER_CONFIG,
  type ClusterAnalysisRequest,
  type SimilarityWeights,
} from '../../types/cluster';
import './ClusterConfig.css';

interface ClusterConfigProps {
  onAnalyze: (config: ClusterAnalysisRequest) => void;
  isAnalyzing: boolean;
}

export function ClusterConfig({ onAnalyze, isAnalyzing }: ClusterConfigProps) {
  const filterState = useFilterStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [config, setConfig] = useState<ClusterAnalysisRequest>({
    ...DEFAULT_CLUSTER_CONFIG,
    // Include current filter state
    filter: filterState as any,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert filterState to API format (camelCase -> snake_case)
    const apiFilter: any = {};
    if (filterState.states && filterState.states.length > 0) {
      apiFilter.states = filterState.states;
    }
    if (filterState.yearRange) {
      apiFilter.year_min = filterState.yearRange[0];
      apiFilter.year_max = filterState.yearRange[1];
    }
    if (filterState.solved !== 'all') {
      apiFilter.solved = filterState.solved === 'solved' ? 1 : 0;
    }
    if (filterState.vicSex && filterState.vicSex.length > 0) {
      apiFilter.vic_sex = filterState.vicSex;
    }
    if (filterState.vicRace && filterState.vicRace.length > 0) {
      apiFilter.vic_race = filterState.vicRace;
    }
    if (filterState.vicEthnic && filterState.vicEthnic.length > 0) {
      apiFilter.vic_ethnic = filterState.vicEthnic;
    }
    if (filterState.weapon && filterState.weapon.length > 0) {
      apiFilter.weapon = filterState.weapon;
    }
    if (filterState.relationship && filterState.relationship.length > 0) {
      apiFilter.relationship = filterState.relationship;
    }
    if (filterState.circumstance && filterState.circumstance.length > 0) {
      apiFilter.circumstance = filterState.circumstance;
    }
    if (filterState.situation && filterState.situation.length > 0) {
      apiFilter.situation = filterState.situation;
    }
    if (filterState.counties && filterState.counties.length > 0) {
      apiFilter.county = filterState.counties;
    }
    if (filterState.msa && filterState.msa.length > 0) {
      apiFilter.msa = filterState.msa;
    }
    if (filterState.agencySearch) {
      apiFilter.agency_search = filterState.agencySearch;
    }
    if (filterState.caseId) {
      apiFilter.case_id = filterState.caseId;
    }
    if (filterState.vicAgeRange) {
      apiFilter.vic_age_min = filterState.vicAgeRange[0];
      apiFilter.vic_age_max = filterState.vicAgeRange[1];
      apiFilter.include_unknown_age = filterState.includeUnknownAge;
    }

    onAnalyze({
      ...config,
      filter: apiFilter,
    });
  };

  const handleWeightChange = (key: keyof SimilarityWeights, value: number) => {
    setConfig({
      ...config,
      weights: {
        ...config.weights!,
        [key]: value,
      },
    });
  };

  const resetToDefaults = () => {
    setConfig({
      ...DEFAULT_CLUSTER_CONFIG,
      filter: filterState as any,
    });
  };

  const totalWeight =
    (config.weights?.geographic || 0) +
    (config.weights?.weapon || 0) +
    (config.weights?.victim_sex || 0) +
    (config.weights?.victim_age || 0) +
    (config.weights?.temporal || 0) +
    (config.weights?.victim_race || 0);

  const isWeightValid = Math.abs(totalWeight - 100) < 0.1;

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
                <span className="cluster-config-label-hint">
                  (3-100 cases)
                </span>
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
                Adjust how different factors contribute to similarity scoring.
                All weights must sum to 100.0.
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
                      <label className="cluster-config-weight-label">
                        {label}
                      </label>
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
                    <strong>Year Range:</strong> {filterState.yearRange[0]} – {filterState.yearRange[1]}
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
                    <strong>Weapons:</strong> {filterState.weapon.slice(0, 3).join(', ')}
                    {filterState.weapon.length > 3 && ` +${filterState.weapon.length - 3} more`}
                  </li>
                )}
              </ul>
            ) : (
              <p className="cluster-config-filter-empty">
                No filters applied — analyzing all {' '}
                <span className="cluster-config-highlight">894,636 cases</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isAnalyzing || !isWeightValid}
          className="cluster-config-submit"
        >
          {isAnalyzing ? (
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
      </form>
    </div>
  );
}
