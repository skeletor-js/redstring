import React from 'react';
import { useFilterStore } from '../../stores/useFilterStore';
import { PrimaryFilters } from './PrimaryFilters';
import { VictimFilters } from './VictimFilters';
import { CrimeFilters } from './CrimeFilters';
import { GeographyFilters } from './GeographyFilters';
import { SearchFilters } from './SearchFilters';
import './FilterPanel.css';

interface FilterSectionProps {
  id: 'primary' | 'victim' | 'crime' | 'geography' | 'search';
  title: string;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({ id, title, children }) => {
  const { expandedSections, toggleSection } = useFilterStore();
  const isExpanded = expandedSections[id];

  return (
    <div className={`filter-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="filter-section-header"
        onClick={() => toggleSection(id)}
        aria-expanded={isExpanded}
        aria-controls={`filter-section-${id}`}
      >
        <span className="filter-section-title">{title}</span>
        <svg
          className="filter-section-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={isExpanded ? 'M4 6L8 10L12 6' : 'M6 4L10 8L6 12'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isExpanded && (
        <div className="filter-section-content" id={`filter-section-${id}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export const FilterPanel: React.FC = () => {
  const { resetFilters, getActiveFilterCount } = useFilterStore();
  const activeCount = getActiveFilterCount();

  return (
    <aside className="filter-panel">
      <div className="filter-panel-header">
        <h2 className="filter-panel-title">Filters</h2>
        {activeCount > 0 && (
          <button
            className="filter-reset-button"
            onClick={resetFilters}
            title="Clear all filters"
          >
            Reset All
            <span className="filter-count-badge">{activeCount}</span>
          </button>
        )}
      </div>

      <div className="filter-sections">
        <FilterSection id="primary" title="Primary Filters">
          <PrimaryFilters />
        </FilterSection>

        <FilterSection id="victim" title="Victim Demographics">
          <VictimFilters />
        </FilterSection>

        <FilterSection id="crime" title="Crime Details">
          <CrimeFilters />
        </FilterSection>

        <FilterSection id="geography" title="Geography">
          <GeographyFilters />
        </FilterSection>

        <FilterSection id="search" title="Search">
          <SearchFilters />
        </FilterSection>
      </div>

      <div className="filter-panel-footer">
        <p className="filter-help-text">
          Filters apply automatically as you change them.
        </p>
      </div>
    </aside>
  );
};
