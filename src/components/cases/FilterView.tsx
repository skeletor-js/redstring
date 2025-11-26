import React from 'react';
import { FilterPanel } from '../filters/FilterPanel';
import { CaseTable } from './CaseTable';
import './FilterView.css';

export const FilterView: React.FC = () => {
  return (
    <div className="filter-view">
      <FilterPanel />
      <div className="filter-view-content">
        <CaseTable />
      </div>
    </div>
  );
};
