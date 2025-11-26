/**
 * Cluster Results Table
 *
 * Displays detected clusters with sorting, filtering, and drill-down functionality.
 * Uses TanStack Table for efficient rendering and state management.
 */

import React, { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import type { ClusterSummary } from '../../types/cluster';
import './ClusterTable.css';

interface ClusterTableProps {
  clusters: ClusterSummary[];
  onSelectCluster: (cluster: ClusterSummary) => void;
  selectedCluster: ClusterSummary | null;
}

const columnHelper = createColumnHelper<ClusterSummary>();

export function ClusterTable({
  clusters,
  onSelectCluster,
  selectedCluster,
}: ClusterTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'unsolved_cases', desc: true },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('location_description', {
        header: 'Location',
        cell: (info) => (
          <div className="cluster-table-location">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor('total_cases', {
        header: 'Total',
        cell: (info) => (
          <div className="cluster-table-number">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor('unsolved_cases', {
        header: 'Unsolved',
        cell: (info) => (
          <div className="cluster-table-number cluster-table-unsolved">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('solve_rate', {
        header: 'Solve Rate',
        cell: (info) => {
          const rate = info.getValue();
          return (
            <div className="cluster-table-rate-container">
              <div className="cluster-table-rate-bar">
                <div
                  className="cluster-table-rate-fill"
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span className="cluster-table-rate-text">{rate.toFixed(1)}%</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('avg_similarity_score', {
        header: 'Similarity',
        cell: (info) => (
          <div className="cluster-table-similarity">
            {info.getValue().toFixed(1)}
          </div>
        ),
      }),
      columnHelper.accessor('first_year', {
        header: 'Timespan',
        cell: (info) => {
          const firstYear = info.getValue();
          const lastYear = info.row.original.last_year;
          const span = lastYear - firstYear;
          return (
            <div className="cluster-table-timespan">
              <span className="cluster-table-years">
                {firstYear}–{lastYear}
              </span>
              <span className="cluster-table-span">{span}yr span</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('primary_weapon', {
        header: 'Primary Weapon',
        cell: (info) => (
          <div className="cluster-table-weapon">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor('primary_victim_sex', {
        header: 'Victim Profile',
        cell: (info) => {
          const sex = info.getValue();
          const age = info.row.original.avg_victim_age;
          return (
            <div className="cluster-table-profile">
              <span className="cluster-table-sex">{sex}</span>
              <span className="cluster-table-age">Avg {age.toFixed(0)}yr</span>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: clusters,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (clusters.length === 0) {
    return (
      <div className="cluster-table-empty">
        <div className="cluster-table-empty-icon">∅</div>
        <h3 className="cluster-table-empty-title">No Clusters Detected</h3>
        <p className="cluster-table-empty-description">
          No suspicious patterns found matching the current configuration.
          <br />
          Try adjusting the similarity threshold or solve rate parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="cluster-table-container">
      <div className="cluster-table-header-info">
        <span className="cluster-table-count">
          {clusters.length} suspicious cluster{clusters.length !== 1 ? 's' : ''}{' '}
          detected
        </span>
        <span className="cluster-table-hint">
          Click a row to view detailed case information
        </span>
      </div>

      <div className="cluster-table-scroll">
        <table className="cluster-table">
          <thead className="cluster-table-head">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={
                      header.column.getCanSort()
                        ? 'cluster-table-th cluster-table-th-sortable'
                        : 'cluster-table-th'
                    }
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="cluster-table-th-content">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <span className="cluster-table-sort-indicator">
                          {header.column.getIsSorted() === 'desc' ? ' ↓' : ' ↑'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="cluster-table-body">
            {table.getRowModel().rows.map((row) => {
              const isSelected =
                selectedCluster?.cluster_id === row.original.cluster_id;

              return (
                <tr
                  key={row.id}
                  className={
                    isSelected
                      ? 'cluster-table-row cluster-table-row-selected'
                      : 'cluster-table-row'
                  }
                  onClick={() => onSelectCluster(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="cluster-table-td">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
