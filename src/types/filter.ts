/**
 * Filter state management types and constants.
 *
 * Defines the filter interface used throughout the application for
 * case querying and the constants for filter options.
 */

/**
 * Complete filter state for case queries.
 *
 * All fields are optional. Unset values mean "no filter applied".
 */
export interface FilterState {
  // === Primary Filters ===

  /** Selected states (empty = all states) */
  states: string[];

  /** Year range [min, max] (default: [1976, 2023]) */
  yearRange: [number, number];

  /** Solved status filter */
  solved: 'all' | 'solved' | 'unsolved';

  // === Victim Demographics ===

  /** Victim sex (empty = all) */
  vicSex: string[];

  /** Victim age range [min, max] (default: [0, 99]) */
  vicAgeRange: [number, number];

  /** Include cases with unknown age (999) */
  includeUnknownAge: boolean;

  /** Victim race (empty = all) */
  vicRace: string[];

  /** Victim ethnicity (empty = all) */
  vicEthnic: string[];

  // === Crime Details ===

  /** Weapon types (empty = all) */
  weapon: string[];

  /** Relationship to offender (empty = all) */
  relationship: string[];

  /** Circumstance (empty = all) */
  circumstance: string[];

  /** Situation (empty = all) */
  situation: string[];

  // === Geography ===

  /** County FIPS codes (empty = all) */
  counties: string[];

  /** MSA (Metropolitan Statistical Area) codes (empty = all) */
  msa: string[];

  // === Search ===

  /** Agency name search (substring match) */
  agencySearch: string;

  /** Case ID for direct lookup */
  caseId: string;
}

/**
 * UI state for filter panel sections.
 */
export interface FilterUIState {
  /** Which sections are expanded in the filter panel */
  expandedSections: {
    primary: boolean;
    victim: boolean;
    crime: boolean;
    geography: boolean;
    search: boolean;
  };
}

// =============================================================================
// FILTER OPTION CONSTANTS
// =============================================================================

/**
 * All 51 states in the dataset (uppercase).
 *
 * Source: Murder Accountability Project dataset.
 */
export const STATES = [
  'ALABAMA',
  'ALASKA',
  'ARIZONA',
  'ARKANSAS',
  'CALIFORNIA',
  'COLORADO',
  'CONNECTICUT',
  'DELAWARE',
  'DISTRICT OF COLUMBIA',
  'FLORIDA',
  'GEORGIA',
  'HAWAII',
  'IDAHO',
  'ILLINOIS',
  'INDIANA',
  'IOWA',
  'KANSAS',
  'KENTUCKY',
  'LOUISIANA',
  'MAINE',
  'MARYLAND',
  'MASSACHUSETTS',
  'MICHIGAN',
  'MINNESOTA',
  'MISSISSIPPI',
  'MISSOURI',
  'MONTANA',
  'NEBRASKA',
  'NEVADA',
  'NEW HAMPSHIRE',
  'NEW JERSEY',
  'NEW MEXICO',
  'NEW YORK',
  'NORTH CAROLINA',
  'NORTH DAKOTA',
  'OHIO',
  'OKLAHOMA',
  'OREGON',
  'PENNSYLVANIA',
  'RHODE ISLAND',
  'SOUTH CAROLINA',
  'SOUTH DAKOTA',
  'TENNESSEE',
  'TEXAS',
  'UTAH',
  'VERMONT',
  'VIRGINIA',
  'WASHINGTON',
  'WEST VIRGINIA',
  'WISCONSIN',
  'WYOMING',
] as const;

/**
 * Victim sex options.
 */
export const VIC_SEX_OPTIONS = ['Male', 'Female', 'Unknown'] as const;

/**
 * Victim race options.
 *
 * Note: These are the exact values from the dataset.
 */
export const VIC_RACE_OPTIONS = [
  'White',
  'Black',
  'American Indian or Alaskan Native',
  'Asian or Pacific Islander',
  'Unknown',
] as const;

/**
 * Victim ethnicity options.
 */
export const VIC_ETHNIC_OPTIONS = [
  'Hispanic or Latino',
  'Not Hispanic or Latino',
  'Unknown',
] as const;

/**
 * Weapon type options (all 18 types).
 *
 * These correspond to weapon_code values 11-99 in the database.
 */
export const WEAPON_TYPES = [
  'Firearm, type not stated',
  'Handgun - pistol, revolver, etc',
  'Rifle',
  'Shotgun',
  'Other gun',
  'Knife or cutting instrument',
  'Blunt object - hammer, club, etc',
  'Personal weapons, includes beating',
  'Poison - does not include gas',
  'Pushed or thrown out window',
  'Explosives',
  'Fire',
  'Narcotics or drugs, sleeping pills',
  'Drowning',
  'Strangulation - hanging',
  'Asphyxiation - includes death by gas',
  'Other or type unknown',
  'Weapon Not Reported',
] as const;

/**
 * Relationship options (victim to offender).
 *
 * Note: Full list to be populated from dataset analysis.
 */
export const RELATIONSHIP_OPTIONS = [
  'Stranger',
  'Acquaintance',
  'Wife',
  'Husband',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Other family',
  'Boyfriend',
  'Girlfriend',
  'Friend',
  'Neighbor',
  'Employee',
  'Employer',
  'Unknown',
] as const;

/**
 * Circumstance options.
 *
 * Note: Full list to be populated from dataset analysis.
 */
export const CIRCUMSTANCE_OPTIONS = [
  'Argument',
  'Felony type',
  'Gangland',
  'Juvenile gang',
  'Other',
  'Unknown',
] as const;

/**
 * Situation options (victim/offender count combinations).
 */
export const SITUATION_OPTIONS = [
  'Single victim/single offender',
  'Single victim/multiple offenders',
  'Multiple victims/single offender',
  'Multiple victims/multiple offenders',
  'Single victim/unknown offenders',
  'Multiple victims/unknown offenders',
] as const;

/**
 * Default filter state (no filters applied).
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  states: [],
  yearRange: [1976, 2023],
  solved: 'all',
  vicSex: [],
  vicAgeRange: [0, 99],
  includeUnknownAge: false,
  vicRace: [],
  vicEthnic: [],
  weapon: [],
  relationship: [],
  circumstance: [],
  situation: [],
  counties: [],
  msa: [],
  agencySearch: '',
  caseId: '',
};

/**
 * Default UI state (all sections collapsed).
 */
export const DEFAULT_FILTER_UI_STATE: FilterUIState = {
  expandedSections: {
    primary: true, // Primary section expanded by default
    victim: false,
    crime: false,
    geography: false,
    search: false,
  },
};

/**
 * Year range bounds.
 */
export const YEAR_MIN = 1976;
export const YEAR_MAX = 2023;

/**
 * Age range bounds.
 */
export const AGE_MIN = 0;
export const AGE_MAX = 99;
export const AGE_UNKNOWN = 999;

/**
 * Type guard for filter section keys.
 */
export type FilterSection = keyof FilterUIState['expandedSections'];
