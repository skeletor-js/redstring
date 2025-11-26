/**
 * Cluster Detail View
 *
 * Displays comprehensive information about a selected cluster including
 * statistics, case list, and export functionality.
 */

import { Dialog } from '@headlessui/react';
import { useClusterCases, useExportClusterCases } from '../../hooks/useClusters';
import type { ClusterSummary } from '../../types/cluster';
import type { Case } from '../../types/case';
import './ClusterDetail.css';

interface ClusterDetailProps {
  cluster: ClusterSummary | null;
  onClose: () => void;
}

export function ClusterDetail({ cluster, onClose }: ClusterDetailProps) {
  const { data: cases, isLoading: isLoadingCases } = useClusterCases(
    cluster?.cluster_id || null
  );
  const { mutate: exportCases, isPending: isExporting } =
    useExportClusterCases();

  if (!cluster) return null;

  const handleExport = () => {
    if (cluster) {
      exportCases(cluster.cluster_id);
    }
  };

  return (
    <Dialog open={!!cluster} onClose={onClose} className="cluster-detail-dialog">
      <div className="cluster-detail-backdrop" aria-hidden="true" />

      <div className="cluster-detail-container">
        <Dialog.Panel className="cluster-detail-panel">
          {/* Header */}
          <div className="cluster-detail-header">
            <div>
              <Dialog.Title className="cluster-detail-title">
                Cluster Analysis
              </Dialog.Title>
              <p className="cluster-detail-subtitle">
                {cluster.location_description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="cluster-detail-close"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Statistics Grid */}
          <div className="cluster-detail-stats">
            <div className="cluster-detail-stat">
              <div className="cluster-detail-stat-label">Total Cases</div>
              <div className="cluster-detail-stat-value">
                {cluster.total_cases}
              </div>
            </div>

            <div className="cluster-detail-stat">
              <div className="cluster-detail-stat-label">Unsolved</div>
              <div className="cluster-detail-stat-value cluster-detail-stat-danger">
                {cluster.unsolved_cases}
              </div>
            </div>

            <div className="cluster-detail-stat">
              <div className="cluster-detail-stat-label">Solve Rate</div>
              <div className="cluster-detail-stat-value">
                {cluster.solve_rate.toFixed(1)}%
              </div>
              <div className="cluster-detail-stat-bar">
                <div
                  className="cluster-detail-stat-bar-fill"
                  style={{ width: `${cluster.solve_rate}%` }}
                />
              </div>
            </div>

            <div className="cluster-detail-stat">
              <div className="cluster-detail-stat-label">Avg Similarity</div>
              <div className="cluster-detail-stat-value cluster-detail-stat-accent">
                {cluster.avg_similarity_score.toFixed(1)}%
              </div>
            </div>

            <div className="cluster-detail-stat">
              <div className="cluster-detail-stat-label">Timespan</div>
              <div className="cluster-detail-stat-value">
                {cluster.first_year}–{cluster.last_year}
              </div>
              <div className="cluster-detail-stat-sub">
                {cluster.last_year - cluster.first_year} year span
              </div>
            </div>

            <div className="cluster-detail-stat">
              <div className="cluster-detail-stat-label">Primary Weapon</div>
              <div className="cluster-detail-stat-value cluster-detail-stat-small">
                {cluster.primary_weapon}
              </div>
            </div>

            <div className="cluster-detail-stat">
              <div className="cluster-detail-stat-label">Victim Profile</div>
              <div className="cluster-detail-stat-value cluster-detail-stat-small">
                {cluster.primary_victim_sex}
              </div>
              <div className="cluster-detail-stat-sub">
                Avg {cluster.avg_victim_age.toFixed(0)} years old
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="cluster-detail-actions">
            <div className="cluster-detail-actions-label">
              {cluster.total_cases} cases in this cluster
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="cluster-detail-export"
            >
              {isExporting ? (
                <>
                  <span className="cluster-detail-spinner" />
                  Exporting...
                </>
              ) : (
                <>
                  <span className="cluster-detail-export-icon">⬇</span>
                  Export to CSV
                </>
              )}
            </button>
          </div>

          {/* Case Table */}
          <div className="cluster-detail-cases">
            {isLoadingCases ? (
              <div className="cluster-detail-loading">
                <div className="cluster-detail-loading-spinner" />
                <p>Loading cases...</p>
              </div>
            ) : cases && cases.length > 0 ? (
              <div className="cluster-detail-case-list">
                <table className="cluster-detail-table">
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Year</th>
                      <th>State</th>
                      <th>County</th>
                      <th>Victim</th>
                      <th>Weapon</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((caseItem: Case) => (
                      <tr key={caseItem.id}>
                        <td className="cluster-detail-case-id">{caseItem.id}</td>
                        <td>{caseItem.year}</td>
                        <td>{caseItem.state}</td>
                        <td>{caseItem.cntyfips}</td>
                        <td>
                          {caseItem.vic_sex}, {caseItem.vic_age}yr,{' '}
                          {caseItem.vic_race}
                        </td>
                        <td className="cluster-detail-weapon">
                          {caseItem.weapon}
                        </td>
                        <td>
                          <span
                            className={`cluster-detail-status cluster-detail-status-${
                              caseItem.solved === 1 ? 'solved' : 'unsolved'
                            }`}
                          >
                            {caseItem.solved === 1 ? 'Solved' : 'Unsolved'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="cluster-detail-empty">
                <p>No cases found for this cluster</p>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
