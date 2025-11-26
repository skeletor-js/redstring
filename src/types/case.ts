/**
 * TypeScript type definitions for homicide case data and API responses.
 *
 * These types correspond to the database schema and API response formats.
 * All 37 fields from the database are included, with both original labels
 * and numeric codes for certain fields.
 */

/**
 * Represents a single homicide case from the Murder Accountability Project.
 *
 * Contains both original string labels (for display) and numeric codes
 * (for clustering algorithms).
 */
export interface Case {
  /** Unique case identifier (format: {state}_{year}_{incident}) */
  id: string;

  /** County FIPS label (e.g., "Anchorage, AK") */
  cntyfips: string;

  /** Numeric county FIPS code (null if lookup failed) */
  county_fips_code: number | null;

  /** Originating agency identifier */
  ori: string;

  /** State name (uppercase, e.g., "ILLINOIS") */
  state: string;

  /** Agency name */
  agency: string;

  /** Agency type */
  agentype: string;

  /** Source */
  source: string;

  /** Case solved status (0=No, 1=Yes) */
  solved: number;

  /** Year of incident (1976-2023) */
  year: number;

  /** Month of incident (1-12) */
  month: number;

  /** Month name (e.g., "January") - original label */
  month_name: string;

  /** Incident number */
  incident: number;

  /** Action type */
  action_type: string;

  /** Homicide type */
  homicide: string;

  /** Situation */
  situation: string;

  /** Victim age (0-99, 999=Unknown) */
  vic_age: number;

  /** Victim sex label (Male, Female, Unknown) */
  vic_sex: string;

  /** Victim sex code (1=Male, 2=Female, 9=Unknown) */
  vic_sex_code: number;

  /** Victim race */
  vic_race: string;

  /** Victim ethnicity */
  vic_ethnic: string;

  /** Offender age */
  off_age: number;

  /** Offender sex */
  off_sex: string;

  /** Offender race */
  off_race: string;

  /** Offender ethnicity */
  off_ethnic: string;

  /** Weapon label (e.g., "Knife or cutting instrument") */
  weapon: string;

  /** Weapon numeric code (11-99, see WEAPON_CODE_MAP) */
  weapon_code: number;

  /** Relationship between victim and offender */
  relationship: string;

  /** Circumstance of homicide */
  circumstance: string;

  /** Sub-circumstance */
  subcircum: string;

  /** Victim count */
  vic_count: number;

  /** Offender count */
  off_count: number;

  /** File date */
  file_date: string;

  /** MSA (Metropolitan Statistical Area) */
  msa: string;

  /** MSA FIPS code */
  msa_fips_code: number | null;

  /** Decade (1970s, 1980s, etc.) */
  decade: number;

  /** Latitude (from county centroids, null if not found) */
  latitude: number | null;

  /** Longitude (from county centroids, null if not found) */
  longitude: number | null;
}

/**
 * Response from the case list API endpoint.
 *
 * Uses cursor-based pagination for efficient handling of large result sets.
 */
export interface CaseListResponse {
  /** Array of case records */
  cases: Case[];

  /** Total number of cases matching the filter (before pagination) */
  total_count: number;

  /** Number of cases returned in this response */
  returned_count: number;

  /** Cursor for fetching next page (null if no more pages) */
  next_cursor: string | null;

  /** Whether there are more pages to fetch */
  has_more: boolean;

  /** Warning flag if result set is very large (>100k records) */
  large_result_warning: boolean;
}

/**
 * Summary statistics for filtered case results.
 *
 * Used for displaying aggregate metrics without loading all records.
 */
export interface StatsSummary {
  /** Total number of cases matching filters */
  total_count: number;

  /** Number of solved cases */
  solved_count: number;

  /** Number of unsolved cases */
  unsolved_count: number;

  /** Solve rate as percentage (0-100) */
  solve_rate: number;
}

/**
 * Extended statistics with demographic breakdowns.
 *
 * Used for the Stats tab visualization.
 */
export interface ExtendedStats extends StatsSummary {
  /** Breakdown by victim sex */
  by_sex: Record<string, number>;

  /** Breakdown by victim race */
  by_race: Record<string, number>;

  /** Breakdown by weapon type */
  by_weapon: Record<string, number>;

  /** Breakdown by year */
  by_year: Record<number, number>;

  /** Breakdown by state */
  by_state: Record<string, number>;
}

/**
 * Request payload for case filtering.
 *
 * All filter fields are optional. Omitted fields mean "no filter applied".
 */
export interface CaseFilterRequest {
  /** Filter by states (uppercase names) */
  states?: string[];

  /** Filter by year range [min, max] (inclusive) */
  year_range?: [number, number];

  /** Filter by solved status */
  solved?: 'all' | 'solved' | 'unsolved';

  /** Filter by victim sex */
  vic_sex?: string[];

  /** Filter by victim age range [min, max] (inclusive) */
  vic_age_range?: [number, number];

  /** Include cases with unknown age (999) */
  include_unknown_age?: boolean;

  /** Filter by victim race */
  vic_race?: string[];

  /** Filter by victim ethnicity */
  vic_ethnic?: string[];

  /** Filter by weapon types */
  weapon?: string[];

  /** Filter by relationship */
  relationship?: string[];

  /** Filter by circumstance */
  circumstance?: string[];

  /** Pagination cursor (for fetching next page) */
  cursor?: string;

  /** Number of records to return (default: 100, max: 1000) */
  limit?: number;
}
