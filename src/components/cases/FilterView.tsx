import React from 'react'
import { FilterPanel } from '../filters/FilterPanel'
import { CaseTable } from './CaseTable'
import { ErrorBoundary } from '../ErrorBoundary'
import { logError } from '../../utils/errorHandler'
import './FilterView.css'

export const FilterView: React.FC = () => {
  return (
    <div className="filter-view">
      <ErrorBoundary
        onError={(error, errorInfo) => {
          logError(error, {
            componentStack: errorInfo.componentStack,
            context: 'filter-view',
          })
        }}
      >
        <FilterPanel />
        <div className="filter-view-content">
          <CaseTable />
        </div>
      </ErrorBoundary>
    </div>
  )
}
