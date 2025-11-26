/**
 * API client methods for case-related endpoints.
 *
 * Provides typed functions for querying cases, fetching details,
 * and retrieving statistics.
 */

import { apiClient } from './api';
import { FilterState } from '../types/filter';
import {
  Case,
  CaseListResponse,
  StatsSummary,
  CaseFilterRequest,
} from '../types/case';

/**
 * Convert FilterState to API query parameters.
 *
 * Transforms the internal filter state into the format expected by
 * the backend API.
 *
 * @param filters - Filter state from Zustand store
 * @returns API-compatible query parameters
 */
export const buildQueryParams = (filters: FilterState): CaseFilterRequest => {
  const params: CaseFilterRequest = {};

  // Only include non-empty filters
  if (filters.states.length > 0) {
    params.states = filters.states;
  }

  // Year range (only if not default)
  if (filters.yearRange[0] !== 1976 || filters.yearRange[1] !== 2023) {
    params.year_range = filters.yearRange;
  }

  // Solved status (only if not "all")
  if (filters.solved !== 'all') {
    params.solved = filters.solved;
  }

  // Victim sex
  if (filters.vicSex.length > 0) {
    params.vic_sex = filters.vicSex;
  }

  // Victim age range (only if not default)
  if (filters.vicAgeRange[0] !== 0 || filters.vicAgeRange[1] !== 99) {
    params.vic_age_range = filters.vicAgeRange;
  }

  // Include unknown age (only if false, since true is default)
  if (!filters.includeUnknownAge) {
    params.include_unknown_age = false;
  }

  // Victim race
  if (filters.vicRace.length > 0) {
    params.vic_race = filters.vicRace;
  }

  // Victim ethnicity
  if (filters.vicEthnic.length > 0) {
    params.vic_ethnic = filters.vicEthnic;
  }

  // Weapon types
  if (filters.weapon.length > 0) {
    params.weapon = filters.weapon;
  }

  // Relationship
  if (filters.relationship.length > 0) {
    params.relationship = filters.relationship;
  }

  // Circumstance
  if (filters.circumstance.length > 0) {
    params.circumstance = filters.circumstance;
  }

  return params;
};

/**
 * Fetch a paginated list of cases matching the given filters.
 *
 * Uses cursor-based pagination for efficient handling of large datasets.
 *
 * @param filters - Filter criteria
 * @param cursor - Pagination cursor (optional, for fetching next page)
 * @param limit - Number of records to return (default: 100, max: 1000)
 * @returns Promise resolving to case list response
 */
export const getCases = async (
  filters: FilterState,
  cursor?: string,
  limit: number = 100
): Promise<CaseListResponse> => {
  const params = buildQueryParams(filters);

  // Add pagination parameters
  if (cursor) {
    params.cursor = cursor;
  }
  if (limit) {
    params.limit = limit;
  }

  const response = await apiClient.post<CaseListResponse>('/api/cases/query', params);
  return response.data;
};

/**
 * Fetch a single case by ID.
 *
 * @param id - Case ID (format: {state}_{year}_{incident})
 * @returns Promise resolving to case details
 */
export const getCaseById = async (id: string): Promise<Case> => {
  const response = await apiClient.get<Case>(`/api/cases/${id}`);
  return response.data;
};

/**
 * Get summary statistics for cases matching the given filters.
 *
 * Returns aggregate metrics without fetching all individual records.
 * Useful for displaying quick stats before loading the full result set.
 *
 * @param filters - Filter criteria
 * @returns Promise resolving to stats summary
 */
export const getStatsSummary = async (filters: FilterState): Promise<StatsSummary> => {
  const params = buildQueryParams(filters);

  const response = await apiClient.post<StatsSummary>('/api/cases/stats', params);
  return response.data;
};

/**
 * Export cases to CSV.
 *
 * Streams all cases matching the filters to a CSV file.
 * Returns a blob URL that can be used to download the file.
 *
 * @param filters - Filter criteria
 * @returns Promise resolving to blob URL
 */
export const exportCasesToCSV = async (filters: FilterState): Promise<string> => {
  const params = buildQueryParams(filters);

  const response = await apiClient.post('/api/cases/export', params, {
    responseType: 'blob',
  });

  // Create blob URL for download
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  return url;
};

/**
 * Search for cases by text query.
 *
 * Searches across multiple fields (agency, location, etc.).
 *
 * @param query - Search query string
 * @param limit - Number of results to return
 * @returns Promise resolving to matching cases
 */
export const searchCases = async (
  query: string,
  limit: number = 100
): Promise<CaseListResponse> => {
  const response = await apiClient.get<CaseListResponse>('/api/cases/search', {
    params: { q: query, limit },
  });
  return response.data;
};

/**
 * Get unique values for a filter field.
 *
 * Useful for populating filter dropdowns with actual values from the dataset.
 *
 * @param field - Field name (e.g., "relationship", "circumstance")
 * @returns Promise resolving to array of unique values
 */
export const getUniqueValues = async (field: string): Promise<string[]> => {
  const response = await apiClient.get<string[]>(`/api/cases/unique/${field}`);
  return response.data;
};
