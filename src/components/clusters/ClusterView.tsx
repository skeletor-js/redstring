/**
 * Cluster Analysis View
 *
 * Placeholder view while cluster analysis feature is being refined.
 */

import { ComingSoon } from '../common/ComingSoon'
import './ClusterView.css'

/**
 * ClusterView component props.
 */
interface ClusterViewProps {
  /** Optional callback to open filters panel */
  onOpenFilters?: () => void
  /** Optional class name for styling */
  className?: string
}

/**
 * ClusterView component.
 *
 * Currently displays a Coming Soon placeholder while the cluster
 * analysis feature is being refined.
 */
export function ClusterView({ className }: ClusterViewProps) {
  return (
    <div className={`cluster-view ${className || ''}`}>
      <ComingSoon
        title="Cluster Analysis"
        message="Coming Soon! We're working out some kinks with the pattern detection algorithm."
        icon="🔍"
      />
    </div>
  )
}

export default ClusterView
