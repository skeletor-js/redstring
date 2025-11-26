/**
 * Cluster Analysis View
 *
 * Main component that integrates cluster configuration, results table,
 * and detail view into a cohesive analysis interface.
 */

import { useState } from 'react'
import { useClusterAnalysis } from '../../hooks/useClusters'
import type {
  ClusterAnalysisRequest,
  ClusterAnalysisResponse,
  ClusterSummary,
} from '../../types/cluster'
import { ClusterConfig } from './ClusterConfig'
import { ClusterTable } from './ClusterTable'
import { ClusterDetail } from './ClusterDetail'
import { ErrorBoundary } from '../ErrorBoundary'
import { getUserMessage, logError } from '../../utils/errorHandler'
import './ClusterView.css'

export function ClusterView() {
  const [results, setResults] = useState<ClusterAnalysisResponse | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<ClusterSummary | null>(null)
  const [showConfig, setShowConfig] = useState(true)

  const { mutate: runAnalysis, isPending, error } = useClusterAnalysis()

  const handleAnalyze = (config: ClusterAnalysisRequest) => {
    runAnalysis(config, {
      onSuccess: (data) => {
        setResults(data)
        setShowConfig(false)
      },
    })
  }

  const handleSelectCluster = (cluster: ClusterSummary) => {
    setSelectedCluster(cluster)
  }

  const handleCloseDetail = () => {
    setSelectedCluster(null)
  }

  const handleReconfigure = () => {
    setShowConfig(true)
    setResults(null)
    setSelectedCluster(null)
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logError(error, {
          componentStack: errorInfo.componentStack,
          context: 'cluster-view',
        })
      }}
    >
      <div className="cluster-view">
        {/* Configuration Panel */}
        {showConfig ? (
          <div className="cluster-view-config-container">
            <ClusterConfig onAnalyze={handleAnalyze} isAnalyzing={isPending} />
            {error && (
              <div className="cluster-view-error">
                <div className="cluster-view-error-icon">⚠</div>
                <div>
                  <h3 className="cluster-view-error-title">Analysis Failed</h3>
                  <p className="cluster-view-error-message">{getUserMessage(error)}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="cluster-view-results-header">
              <div>
                <h2 className="cluster-view-results-title">Analysis Results</h2>
                <p className="cluster-view-results-meta">
                  {results?.total_clusters} cluster
                  {results?.total_clusters !== 1 ? 's' : ''} detected from{' '}
                  {results?.total_cases_analyzed.toLocaleString()} cases
                  {' • '}
                  <span className="cluster-view-results-time">
                    {results?.analysis_time_seconds}s analysis time
                  </span>
                </p>
              </div>
              <button onClick={handleReconfigure} className="cluster-view-reconfigure">
                ← New Analysis
              </button>
            </div>

            {/* Results Table */}
            <div className="cluster-view-results-container">
              {results && (
                <ClusterTable
                  clusters={results.clusters}
                  onSelectCluster={handleSelectCluster}
                  selectedCluster={selectedCluster}
                />
              )}
            </div>
          </>
        )}

        {/* Detail Modal */}
        <ClusterDetail cluster={selectedCluster} onClose={handleCloseDetail} />
      </div>
    </ErrorBoundary>
  )
}
