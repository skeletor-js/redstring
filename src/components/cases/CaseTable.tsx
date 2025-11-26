import React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCases, useTotalCount } from '../../hooks/useCases'
import { useFilterStore } from '../../stores/useFilterStore'
import { useUIStore } from '../../stores/useUIStore'
import type { CaseListResponse } from '../../types/case'
import './CaseTable.css'

export const CaseTable: React.FC = () => {
  const filters = useFilterStore()
  const { selectCase } = useUIStore()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useCases(filters)

  const allCases = React.useMemo(
    () => data?.pages.flatMap((page: CaseListResponse) => page.cases) ?? [],
    [data]
  )

  const totalCount = useTotalCount(data)

  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: allCases.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  })

  // Fetch next page when scrolled near bottom
  React.useEffect(() => {
    const lastItem = virtualizer.getVirtualItems().at(-1)
    if (
      lastItem &&
      lastItem.index >= allCases.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    virtualizer.getVirtualItems(),
    allCases.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ])

  const showWarning = data?.pages[0]?.pagination?.large_result_warning ?? false

  if (isLoading) {
    return (
      <div className="case-table-loading">
        <div className="loading-spinner" />
        <p>Loading cases...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="case-table-error">
        <p>Error loading cases:</p>
        <pre>{error?.message || 'Unknown error'}</pre>
      </div>
    )
  }

  if (allCases.length === 0) {
    return (
      <div className="case-table-empty">
        <p>No cases match your current filters.</p>
        <p className="case-table-empty-hint">Try adjusting or clearing some filters.</p>
      </div>
    )
  }

  return (
    <div className="case-table-container">
      {showWarning && (
        <div className="case-table-warning">
          ⚠️ Large result set ({totalCount.toLocaleString()} cases). Consider narrowing
          filters for better performance.
        </div>
      )}

      <div className="case-table-info">
        Showing {allCases.length.toLocaleString()} of {totalCount.toLocaleString()}{' '}
        cases
      </div>

      <div ref={parentRef} className="case-table-scroll">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <table className="case-table">
            <thead className="case-table-header">
              <tr>
                <th style={{ width: '140px' }}>Case ID</th>
                <th style={{ width: '80px' }}>Year</th>
                <th style={{ width: '120px' }}>State</th>
                <th style={{ width: '180px' }}>County</th>
                <th style={{ width: '220px' }}>Victim</th>
                <th style={{ width: '200px' }}>Weapon</th>
                <th style={{ width: '100px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const caseItem = allCases[virtualRow.index]
                return (
                  <tr
                    key={virtualRow.key}
                    className="case-table-row"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => selectCase(caseItem.id)}
                  >
                    <td className="case-table-cell case-id">{caseItem.id}</td>
                    <td className="case-table-cell">{caseItem.year}</td>
                    <td className="case-table-cell">{caseItem.state}</td>
                    <td className="case-table-cell">{caseItem.cntyfips}</td>
                    <td className="case-table-cell">
                      {caseItem.vic_sex}, {caseItem.vic_age}, {caseItem.vic_race}
                    </td>
                    <td className="case-table-cell">{caseItem.weapon}</td>
                    <td className="case-table-cell">
                      <span
                        className={`case-status-badge ${caseItem.solved === 1 ? 'solved' : 'unsolved'}`}
                      >
                        {caseItem.solved === 1 ? 'Solved' : 'Unsolved'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isFetchingNextPage && (
        <div className="case-table-loading-more">
          <div className="loading-spinner-small" />
          Loading more...
        </div>
      )}
    </div>
  )
}
