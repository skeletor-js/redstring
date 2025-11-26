import React from 'react';
import { useFilterStore } from '../../stores/useFilterStore';
import './Filters.css';

export const SearchFilters: React.FC = () => {
  const { caseId, agencySearch, setFilter } = useFilterStore();

  return (
    <div className="filter-group">
      {/* Case ID Search */}
      <div className="filter-field">
        <label htmlFor="case-id-input" className="filter-label">
          Case ID (Exact Match)
        </label>
        <input
          id="case-id-input"
          type="text"
          value={caseId}
          onChange={(e) => setFilter('caseId', e.target.value)}
          placeholder="Enter case ID..."
          className="filter-input"
        />
      </div>

      {/* Agency Name Search */}
      <div className="filter-field">
        <label htmlFor="agency-search-input" className="filter-label">
          Agency Name (Substring Match)
        </label>
        <input
          id="agency-search-input"
          type="text"
          value={agencySearch}
          onChange={(e) => setFilter('agencySearch', e.target.value)}
          placeholder="Search agency names..."
          className="filter-input"
        />
      </div>
    </div>
  );
};
