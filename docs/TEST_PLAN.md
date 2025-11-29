# Test Plan: Filtering and Clustering Capabilities

## Document Information
- **Version**: 1.0
- **Created**: 2025-11-26
- **Last Updated**: 2025-11-26
- **Status**: Draft

---

## Table of Contents
1. [Test Strategy Overview](#1-test-strategy-overview)
2. [Filter Test Matrix](#2-filter-test-matrix)
3. [Clustering Test Scenarios](#3-clustering-test-scenarios)
4. [Integration Test Scenarios](#4-integration-test-scenarios)
5. [Edge Cases Checklist](#5-edge-cases-checklist)
6. [Test Implementation Priority](#6-test-implementation-priority)

---

## 1. Test Strategy Overview

### 1.1 Testing Approach

This test plan covers the filtering and clustering capabilities of the RedString application. The testing strategy follows a layered approach:

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Integration Tests                     │
│         (Full workflow: Filter → Cluster → Export)          │
├─────────────────────────────────────────────────────────────┤
│                   API Integration Tests                      │
│        (Backend endpoints with real database queries)        │
├─────────────────────────────────────────────────────────────┤
│                    Component Tests                           │
│    (Frontend components with mocked stores/services)         │
├─────────────────────────────────────────────────────────────┤
│                      Unit Tests                              │
│   (Pure functions: similarity calc, query builders, etc.)    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Test Categories

| Category | Location | Framework | Coverage Target |
|----------|----------|-----------|-----------------|
| Backend Unit | `tests/backend/test_analysis/` | pytest | 90% |
| Backend API | `tests/backend/test_routes/` | pytest + TestClient | 85% |
| Frontend Unit | `tests/frontend/stores/` | vitest | 90% |
| Frontend Component | `tests/frontend/components/` | vitest + testing-library | 80% |
| Frontend Hooks | `tests/frontend/hooks/` | vitest | 85% |

### 1.3 Test Data Strategy

**Backend Tests:**
- Use SQLite in-memory database with fixture data
- Fixture: `conftest.py` provides `populated_test_db` with ~20 sample cases
- Sample data covers: multiple states, years, weapons, victim demographics

**Frontend Tests:**
- Mock API responses using `vi.mock()`
- Use Zustand store directly for state testing
- Mock child components when testing parent containers

### 1.4 Existing Test Coverage Summary

| Area | Existing Tests | Coverage |
|------|----------------|----------|
| `useFilterStore` | ✅ Complete | 90% |
| `FilterPanel` | ✅ Complete | 85% |
| `ClusterConfig` | ✅ Complete | 80% |
| `ClusterTable` | ✅ Complete | 80% |
| `useClusters` | ✅ Complete | 75% |
| Backend `/api/cases` | ✅ Partial | 70% |
| Backend `/api/clusters` | ✅ Partial | 75% |
| Clustering Algorithm | ✅ Partial | 70% |

---

## 2. Filter Test Matrix

### 2.1 Primary Filters

#### 2.1.1 States Filter (Multi-select)

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| PF-001 | No states selected | `states: []` | Returns all cases | P1 |
| PF-002 | Single state | `states: ['ILLINOIS']` | Only Illinois cases | P1 |
| PF-003 | Multiple states | `states: ['ILLINOIS', 'CALIFORNIA']` | Cases from both states | P1 |
| PF-004 | All 51 states | `states: [all 51]` | Same as no filter | P2 |
| PF-005 | Invalid state name | `states: ['INVALID']` | Empty result set | P2 |
| PF-006 | Case sensitivity | `states: ['illinois']` | Should match (backend normalizes) | P3 |

**Implementation Location:** 
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:36)
- Frontend: `tests/frontend/components/PrimaryFilters.test.tsx` (NEW)

#### 2.1.2 Year Range Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| YR-001 | Default range | `yearRange: [1976, 2023]` | All cases | P1 |
| YR-002 | Single year | `yearRange: [1990, 1990]` | Only 1990 cases | P1 |
| YR-003 | Custom range | `yearRange: [1990, 2000]` | Cases 1990-2000 | P1 |
| YR-004 | Min only | `year_min: 2000` | Cases >= 2000 | P1 |
| YR-005 | Max only | `year_max: 1990` | Cases <= 1990 | P1 |
| YR-006 | Inverted range | `yearRange: [2000, 1990]` | Error or empty | P2 |
| YR-007 | Out of bounds min | `year_min: 1900` | Validation error (422) | P2 |
| YR-008 | Out of bounds max | `year_max: 2050` | Validation error (422) | P2 |

**Implementation Location:**
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:58)
- Frontend: `tests/frontend/components/PrimaryFilters.test.tsx` (NEW)

#### 2.1.3 Solved Status Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| SS-001 | All cases | `solved: 'all'` | All cases | P1 |
| SS-002 | Solved only | `solved: 'solved'` | Only solved=1 | P1 |
| SS-003 | Unsolved only | `solved: 'unsolved'` | Only solved=0 | P1 |
| SS-004 | Stats with solved filter | `solved: 0` | solve_rate = 0% | P1 |

**Implementation Location:**
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:69)

### 2.2 Victim Demographics Filters

#### 2.2.1 Victim Sex Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| VS-001 | No filter | `vicSex: []` | All cases | P1 |
| VS-002 | Male only | `vicSex: ['Male']` | Only male victims | P1 |
| VS-003 | Female only | `vicSex: ['Female']` | Only female victims | P1 |
| VS-004 | Multiple values | `vicSex: ['Male', 'Female']` | Male or female | P1 |
| VS-005 | Unknown sex | `vicSex: ['Unknown']` | Only unknown sex | P2 |

**Implementation Location:**
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:80)
- Frontend: `tests/frontend/components/VictimFilters.test.tsx` (NEW)

#### 2.2.2 Victim Age Range Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| VA-001 | Default range | `vicAgeRange: [0, 99]` | All known ages | P1 |
| VA-002 | Custom range | `vicAgeRange: [25, 30]` | Ages 25-30 | P1 |
| VA-003 | Include unknown | `includeUnknownAge: true` | Include age=999 | P1 |
| VA-004 | Exclude unknown | `includeUnknownAge: false` | Exclude age=999 | P1 |
| VA-005 | Range + unknown | `vicAgeRange: [25, 30], includeUnknownAge: true` | Ages 25-30 OR 999 | P1 |
| VA-006 | Min only | `vic_age_min: 18` | Ages >= 18 | P2 |
| VA-007 | Max only | `vic_age_max: 65` | Ages <= 65 | P2 |
| VA-008 | Single age | `vicAgeRange: [25, 25]` | Only age 25 | P2 |
| VA-009 | Zero age | `vicAgeRange: [0, 0]` | Only age 0 (infants) | P3 |

**Implementation Location:**
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:91)
- Frontend: `tests/frontend/components/VictimFilters.test.tsx` (NEW)

#### 2.2.3 Victim Race Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| VR-001 | No filter | `vicRace: []` | All cases | P1 |
| VR-002 | Single race | `vicRace: ['White']` | Only White victims | P1 |
| VR-003 | Multiple races | `vicRace: ['White', 'Black']` | White or Black | P1 |
| VR-004 | Unknown race | `vicRace: ['Unknown']` | Only unknown race | P2 |
| VR-005 | All races | `vicRace: [all 5 options]` | Same as no filter | P3 |

**Implementation Location:**
- Frontend: `tests/frontend/components/VictimFilters.test.tsx` (NEW)

#### 2.2.4 Victim Ethnicity Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| VE-001 | No filter | `vicEthnic: []` | All cases | P1 |
| VE-002 | Hispanic | `vicEthnic: ['Hispanic or Latino']` | Only Hispanic | P1 |
| VE-003 | Not Hispanic | `vicEthnic: ['Not Hispanic or Latino']` | Only non-Hispanic | P1 |
| VE-004 | Unknown | `vicEthnic: ['Unknown']` | Only unknown | P2 |

**Implementation Location:**
- Frontend: `tests/frontend/components/VictimFilters.test.tsx` (NEW)

### 2.3 Crime Details Filters

#### 2.3.1 Weapon Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| WP-001 | No filter | `weapon: []` | All cases | P1 |
| WP-002 | Single weapon | `weapon: ['Handgun - pistol, revolver, etc']` | Only handgun cases | P1 |
| WP-003 | Multiple weapons | `weapon: ['Handgun...', 'Rifle']` | Handgun or rifle | P1 |
| WP-004 | Strangulation | `weapon: ['Strangulation - hanging']` | Only strangulation | P1 |
| WP-005 | All 18 weapons | `weapon: [all 18]` | Same as no filter | P3 |

**Weapon Types (18 total):**
```typescript
const WEAPON_TYPES = [
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
]
```

**Implementation Location:**
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:117)
- Frontend: `tests/frontend/components/CrimeFilters.test.tsx` (NEW)

#### 2.3.2 Relationship Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| RL-001 | No filter | `relationship: []` | All cases | P1 |
| RL-002 | Stranger | `relationship: ['Stranger']` | Only stranger cases | P1 |
| RL-003 | Family | `relationship: ['Wife', 'Husband', 'Son', 'Daughter']` | Family relationships | P1 |
| RL-004 | Unknown | `relationship: ['Unknown']` | Only unknown | P2 |
| RL-005 | Multiple | `relationship: ['Stranger', 'Acquaintance']` | Stranger or acquaintance | P2 |

**Relationship Types (18 total):**
```typescript
const RELATIONSHIP_OPTIONS = [
  'Stranger', 'Acquaintance', 'Wife', 'Husband', 'Son', 'Daughter',
  'Father', 'Mother', 'Brother', 'Sister', 'Other family',
  'Boyfriend', 'Girlfriend', 'Friend', 'Neighbor',
  'Employee', 'Employer', 'Unknown'
]
```

**Implementation Location:**
- Backend: `tests/backend/test_routes/test_cases.py` (NEW - relationship filter)
- Frontend: `tests/frontend/components/CrimeFilters.test.tsx` (NEW)

#### 2.3.3 Circumstance Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| CR-001 | No filter | `circumstance: []` | All cases | P1 |
| CR-002 | Argument | `circumstance: ['Argument']` | Only argument cases | P1 |
| CR-003 | Felony | `circumstance: ['Felony type']` | Only felony cases | P1 |
| CR-004 | Gang-related | `circumstance: ['Gangland', 'Juvenile gang']` | Gang cases | P2 |
| CR-005 | Unknown | `circumstance: ['Unknown']` | Only unknown | P2 |

**Circumstance Types (6 total):**
```typescript
const CIRCUMSTANCE_OPTIONS = [
  'Argument', 'Felony type', 'Gangland', 'Juvenile gang', 'Other', 'Unknown'
]
```

**Implementation Location:**
- Backend: `tests/backend/test_routes/test_cases.py` (NEW - circumstance filter)
- Frontend: `tests/frontend/components/CrimeFilters.test.tsx` (NEW)

#### 2.3.4 Situation Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| ST-001 | No filter | `situation: []` | All cases | P1 |
| ST-002 | Single victim/offender | `situation: ['Single victim/single offender']` | 1v1 cases | P1 |
| ST-003 | Multiple victims | `situation: ['Multiple victims/single offender', 'Multiple victims/multiple offenders']` | Multi-victim | P2 |
| ST-004 | Unknown offenders | `situation: ['Single victim/unknown offenders']` | Unknown offender cases | P2 |

**Situation Types (6 total):**
```typescript
const SITUATION_OPTIONS = [
  'Single victim/single offender',
  'Single victim/multiple offenders',
  'Multiple victims/single offender',
  'Multiple victims/multiple offenders',
  'Single victim/unknown offenders',
  'Multiple victims/unknown offenders'
]
```

**Implementation Location:**
- Backend: `tests/backend/test_routes/test_cases.py` (NEW - situation filter)
- Frontend: `tests/frontend/components/CrimeFilters.test.tsx` (NEW)

### 2.4 Geography Filters

#### 2.4.1 Counties Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| GC-001 | No filter | `counties: []` | All cases | P1 |
| GC-002 | Single county | `county: 'Cook County'` | Only Cook County | P1 |
| GC-003 | Multiple counties | `counties: ['06001', '06037']` | Both counties | P1 |
| GC-004 | Invalid FIPS | `counties: ['99999']` | Empty result | P2 |

**Implementation Location:**
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:128)
- Frontend: `tests/frontend/components/GeographyFilters.test.tsx` (NEW)

#### 2.4.2 MSA Filter

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| GM-001 | No filter | `msa: []` | All cases | P1 |
| GM-002 | Single MSA | `msa: ['1234']` | Only that MSA | P1 |
| GM-003 | Multiple MSAs | `msa: ['1234', '5678']` | Both MSAs | P2 |
| GM-004 | Invalid MSA | `msa: ['INVALID']` | Empty result | P2 |

**Implementation Location:**
- Backend: `tests/backend/test_routes/test_cases.py` (NEW - MSA filter)
- Frontend: `tests/frontend/components/GeographyFilters.test.tsx` (NEW)

### 2.5 Search Filters

#### 2.5.1 Agency Search

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| AS-001 | No search | `agencySearch: ''` | All cases | P1 |
| AS-002 | Substring match | `agencySearch: 'Chicago'` | Contains "Chicago" | P1 |
| AS-003 | Case insensitive | `agencySearch: 'CHICAGO'` | Same as lowercase | P1 |
| AS-004 | Partial match | `agencySearch: 'Chi'` | Contains "Chi" | P2 |
| AS-005 | No match | `agencySearch: 'ZZZZZ'` | Empty result | P2 |
| AS-006 | Special characters | `agencySearch: "O'Brien"` | Handles apostrophe | P3 |

**Implementation Location:**
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:139)
- Frontend: `tests/frontend/components/SearchFilters.test.tsx` (NEW)

#### 2.5.2 Case ID Search

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| CI-001 | No search | `caseId: ''` | All cases | P1 |
| CI-002 | Exact match | `caseId: 'IL-12345-1990'` | Single case | P1 |
| CI-003 | No match | `caseId: 'NONEXISTENT'` | Empty result | P1 |
| CI-004 | Partial ID | `caseId: 'IL-123'` | No match (exact only) | P2 |

**Implementation Location:**
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:150)
- Frontend: `tests/frontend/components/SearchFilters.test.tsx` (NEW)

### 2.6 Filter Combinations

| Test ID | Scenario | Filters Combined | Expected Result | Priority |
|---------|----------|------------------|-----------------|----------|
| FC-001 | State + Year | `states: ['IL'], yearRange: [1990, 2000]` | IL cases 1990-2000 | P1 |
| FC-002 | State + Solved | `states: ['IL'], solved: 'unsolved'` | Unsolved IL cases | P1 |
| FC-003 | Demographics combo | `vicSex: ['Female'], vicAgeRange: [18, 30]` | Female 18-30 | P1 |
| FC-004 | Full combo | `states + year + solved + vicSex` | All filters AND'd | P1 |
| FC-005 | Crime + Geography | `weapon: ['Handgun...'], counties: ['17031']` | Handgun in Cook | P2 |
| FC-006 | All filters | All 15 filter types | Complex AND query | P2 |

**Implementation Location:**
- Backend: [`tests/backend/test_routes/test_cases.py`](../tests/backend/test_routes/test_cases.py:165)

---

## 3. Clustering Test Scenarios

### 3.1 Clustering Algorithm Unit Tests

#### 3.1.1 Similarity Calculation

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| SC-001 | Identical cases | Same county, weapon, victim | Score ~100% | P1 |
| SC-002 | Same county | Same county_fips | Geographic = 100% | P1 |
| SC-003 | Different county | Different county_fips | Geographic < 100% | P1 |
| SC-004 | Exact weapon match | Same weapon_code | Weapon = 100% | P1 |
| SC-005 | Same weapon category | Handgun vs Rifle (both firearm) | Weapon = 70% | P1 |
| SC-006 | Different weapon category | Firearm vs Blade | Weapon = 0% | P1 |
| SC-007 | Same victim sex | Both Female | Victim sex = 100% | P1 |
| SC-008 | Different victim sex | Male vs Female | Victim sex = 0% | P1 |
| SC-009 | Same victim age | Both age 25 | Victim age = 100% | P1 |
| SC-010 | Age difference 5 years | Age 25 vs 30 | Victim age = 75% | P1 |
| SC-011 | Age difference 20+ years | Age 20 vs 45 | Victim age = 0% | P2 |
| SC-012 | Unknown age | Age 999 | Victim age = 0% | P1 |
| SC-013 | Same year | Both 1990 | Temporal = 100% | P1 |
| SC-014 | Year difference 3 | 1990 vs 1993 | Temporal = 70% | P1 |
| SC-015 | Year difference 10+ | 1990 vs 2005 | Temporal = 0% | P2 |
| SC-016 | Same victim race | Both White | Victim race = 100% | P1 |
| SC-017 | Different victim race | White vs Black | Victim race = 0% | P1 |

**Implementation Location:**
- [`tests/backend/test_analysis/test_clustering.py`](../tests/backend/test_analysis/test_clustering.py:67)

#### 3.1.2 Weapon Categories

| Test ID | Scenario | Weapon Code | Expected Category | Priority |
|---------|----------|-------------|-------------------|----------|
| WC-001 | Firearm type not stated | 11 | firearm | P1 |
| WC-002 | Handgun | 12 | firearm | P1 |
| WC-003 | Rifle | 13 | firearm | P1 |
| WC-004 | Shotgun | 14 | firearm | P1 |
| WC-005 | Other gun | 15 | firearm | P1 |
| WC-006 | Knife | 20 | blade | P1 |
| WC-007 | Cutting instrument | 21 | blade | P1 |
| WC-008 | Blunt object | 30 | blunt | P1 |
| WC-009 | Club | 31 | blunt | P1 |
| WC-010 | Personal weapons | 40 | personal | P1 |
| WC-011 | Beating | 41 | personal | P1 |
| WC-012 | Strangulation | 80 | other | P1 |
| WC-013 | Unknown weapon | 99 | other | P2 |

**Implementation Location:**
- [`tests/backend/test_analysis/test_clustering.py`](../tests/backend/test_analysis/test_clustering.py:14)

#### 3.1.3 Similarity Weights

| Test ID | Scenario | Weights | Expected | Priority |
|---------|----------|---------|----------|----------|
| SW-001 | Default weights | Default | Sum = 100% | P1 |
| SW-002 | Custom weights | Custom values | Sum = 100% | P1 |
| SW-003 | Geographic emphasis | geo=50% | Higher geo impact | P2 |
| SW-004 | Weapon emphasis | weapon=40% | Higher weapon impact | P2 |

**Default Weights:**
```python
geographic: 35.0
weapon: 25.0
victim_sex: 20.0
victim_age: 10.0
temporal: 7.0
victim_race: 3.0
```

**Implementation Location:**
- [`tests/backend/test_analysis/test_clustering.py`](../tests/backend/test_analysis/test_clustering.py:46)

### 3.2 Cluster Detection Tests

| Test ID | Scenario | Input | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| CD-001 | Similar cases cluster | 5 similar cases | 1 cluster found | P1 |
| CD-002 | Min size filter | 3 cases, min_size=5 | No clusters | P1 |
| CD-003 | Max solve rate filter | 80% solved, max=33% | Filtered out | P1 |
| CD-004 | Similarity threshold | threshold=70% | Only high similarity | P1 |
| CD-005 | Multiple counties | Cases in 2 counties | 2 separate clusters | P1 |
| CD-006 | Empty dataset | 0 cases | Empty result | P1 |
| CD-007 | No similar pairs | All different | No clusters | P2 |
| CD-008 | Large dataset | 1000+ cases | Performance < 5s | P2 |

**Implementation Location:**
- [`tests/backend/test_analysis/test_clustering.py`](../tests/backend/test_analysis/test_clustering.py:263)

### 3.3 Cluster Configuration Tests

| Test ID | Scenario | Parameter | Range | Priority |
|---------|----------|-----------|-------|----------|
| CC-001 | Min cluster size | min_cluster_size | 3-100 | P1 |
| CC-002 | Max solve rate | max_solve_rate | 0-100% | P1 |
| CC-003 | Similarity threshold | similarity_threshold | 0-100% | P1 |
| CC-004 | Default config | All defaults | Valid config | P1 |
| CC-005 | Custom weights | All 6 weights | Sum = 100% | P1 |
| CC-006 | Edge: min_size=3 | Minimum allowed | Works correctly | P2 |
| CC-007 | Edge: min_size=100 | Maximum allowed | Works correctly | P2 |
| CC-008 | Edge: threshold=0 | All pairs match | Many clusters | P2 |
| CC-009 | Edge: threshold=100 | Only identical | Few/no clusters | P2 |

**Implementation Location:**
- [`tests/backend/test_analysis/test_clustering.py`](../tests/backend/test_analysis/test_clustering.py:385)

### 3.4 Cluster API Tests

| Test ID | Scenario | Endpoint | Expected | Priority |
|---------|----------|----------|----------|----------|
| CA-001 | Analyze minimal config | POST /api/clusters/analyze | 200 + clusters | P1 |
| CA-002 | Analyze with filters | POST + filter object | Filtered analysis | P1 |
| CA-003 | Analyze with weights | POST + custom weights | Uses custom weights | P1 |
| CA-004 | Get cluster detail | GET /api/clusters/:id | Cluster details | P1 |
| CA-005 | Get cluster cases | GET /api/clusters/:id/cases | Case list | P1 |
| CA-006 | Export cluster | GET /api/clusters/:id/export | CSV download | P1 |
| CA-007 | Nonexistent cluster | GET /api/clusters/INVALID | 404 | P1 |
| CA-008 | Empty result | Impossible filters | 0 clusters | P2 |
| CA-009 | Sorted by unsolved | Any analysis | Desc by unsolved | P2 |

**Implementation Location:**
- [`tests/backend/test_routes/test_clusters.py`](../tests/backend/test_routes/test_clusters.py:26)

---

## 4. Integration Test Scenarios

### 4.1 End-to-End Workflows

#### 4.1.1 Filter → View Cases Workflow

```
Test: E2E-001 - Basic Filter to Case View
Steps:
1. Load application
2. Select state filter: "ILLINOIS"
3. Set year range: 1990-2000
4. Set solved status: "unsolved"
5. Verify case table shows filtered results
6. Verify statistics panel shows correct counts
7. Click on a case row
8. Verify case detail modal shows correct data

Expected:
- All displayed cases are from Illinois
- All cases are between 1990-2000
- All cases are unsolved
- Statistics match displayed count
```

#### 4.1.2 Filter → Cluster Analysis Workflow

```
Test: E2E-002 - Filter to Cluster Analysis
Steps:
1. Apply filters: state=ILLINOIS, year=1990-2000, solved=unsolved
2. Navigate to Cluster Analysis view
3. Configure: min_size=5, max_solve_rate=33%, threshold=70%
4. Click "Run Analysis"
5. Verify clusters are displayed
6. Click on a cluster
7. Verify cluster detail shows cases
8. Export cluster to CSV

Expected:
- Analysis uses filtered case set
- Clusters meet configuration criteria
- Cluster detail shows correct cases
- CSV export contains all cluster cases
```

#### 4.1.3 Filter Reset Workflow

```
Test: E2E-003 - Filter Reset
Steps:
1. Apply multiple filters
2. Verify filter count badge shows correct number
3. Click "Reset All" button
4. Verify all filters return to defaults
5. Verify case table shows all cases

Expected:
- Filter count badge updates correctly
- Reset clears all filters
- Case table reflects reset state
```

### 4.2 API Integration Tests

#### 4.2.1 POST /api/cases/query

| Test ID | Scenario | Request Body | Expected | Priority |
|---------|----------|--------------|----------|----------|
| AQ-001 | Basic query | `{states: ['IL']}` | IL cases | P1 |
| AQ-002 | Year range | `{year_range: [1990, 2000]}` | 1990-2000 cases | P1 |
| AQ-003 | Solved filter | `{solved: 'unsolved'}` | Unsolved only | P1 |
| AQ-004 | Complex query | Multiple filters | AND combination | P1 |
| AQ-005 | Pagination | `{cursor: '1995:ID', limit: 100}` | Next page | P1 |
| AQ-006 | Empty result | Impossible filters | Empty array | P2 |

**Implementation Location:**
- `tests/backend/test_routes/test_cases.py` (NEW - POST endpoint tests)

#### 4.2.2 POST /api/cases/stats

| Test ID | Scenario | Request Body | Expected | Priority |
|---------|----------|--------------|----------|----------|
| AS-001 | No filters | `{}` | Total dataset stats | P1 |
| AS-002 | State filter | `{states: ['IL']}` | IL stats | P1 |
| AS-003 | Solved filter | `{solved: 'unsolved'}` | solve_rate = 0% | P1 |
| AS-004 | Complex filter | Multiple filters | Filtered stats | P1 |
| AS-005 | Empty result | Impossible filters | All zeros | P2 |

**Implementation Location:**
- `tests/backend/test_routes/test_cases.py` (NEW - POST stats endpoint tests)

### 4.3 Frontend Integration Tests

#### 4.3.1 Filter Store → API Integration

```typescript
// Test: FI-001 - Filter store triggers API call
describe('Filter to API Integration', () => {
  it('should call API when filters change', async () => {
    const { setFilter } = useFilterStore.getState()
    
    // Mock API
    const mockFetch = vi.fn().mockResolvedValue({ cases: [], pagination: {} })
    
    // Change filter
    act(() => {
      setFilter('states', ['ILLINOIS'])
    })
    
    // Verify API called with correct params
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({ states: ['ILLINOIS'] })
      )
    })
  })
})
```

#### 4.3.2 Cluster Config → Analysis Integration

```typescript
// Test: FI-002 - Cluster config triggers analysis
describe('Cluster Config Integration', () => {
  it('should run analysis with config values', async () => {
    const mockAnalyze = vi.fn().mockResolvedValue({ clusters: [] })
    
    render(<ClusterConfig onAnalyze={mockAnalyze} />)
    
    // Set config values
    fireEvent.change(screen.getByLabelText('Min Cluster Size'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Max Solve Rate'), { target: { value: '25' } })
    
    // Run analysis
    fireEvent.click(screen.getByText('Run Analysis'))
    
    // Verify config passed correctly
    expect(mockAnalyze).toHaveBeenCalledWith(
      expect.objectContaining({
        min_cluster_size: 10,
        max_solve_rate: 25
      })
    )
  })
})
```

---

## 5. Edge Cases Checklist

### 5.1 Filter Edge Cases

| ID | Edge Case | Test Scenario | Expected Behavior |
|----|-----------|---------------|-------------------|
| EC-001 | Empty filter arrays | All filters = [] | Return all cases |
| EC-002 | All filters active | Every filter has value | AND combination works |
| EC-003 | Conflicting filters | state=IL, county=CA county | Empty result |
| EC-004 | Year range inverted | year_min > year_max | Error or empty |
| EC-005 | Age range inverted | vic_age_min > vic_age_max | Error or empty |
| EC-006 | Special characters | Agency search with quotes | Properly escaped |
| EC-007 | SQL injection attempt | `'; DROP TABLE cases;--` | Safely handled |
| EC-008 | Very long string | 10000 char search | Truncated or error |
| EC-009 | Unicode characters | Japanese/Chinese chars | Properly handled |
| EC-010 | Null values in data | Case with null weapon | Doesn't crash |

### 5.2 Clustering Edge Cases

| ID | Edge Case | Test Scenario | Expected Behavior |
|----|-----------|---------------|-------------------|
| EC-011 | Single case | 1 case in dataset | No clusters |
| EC-012 | All identical cases | 100 identical cases | 1 large cluster |
| EC-013 | All different cases | No similar pairs | No clusters |
| EC-014 | Threshold = 0 | similarity_threshold = 0 | All cases cluster |
| EC-015 | Threshold = 100 | similarity_threshold = 100 | Only identical |
| EC-016 | Min size = 1 | min_cluster_size = 1 | Many small clusters |
| EC-017 | Max solve = 0 | max_solve_rate = 0 | Only 0% solved |
| EC-018 | Max solve = 100 | max_solve_rate = 100 | All clusters |
| EC-019 | Missing coordinates | lat/long = null | Uses county fallback |
| EC-020 | Unknown ages only | All vic_age = 999 | Age score = 0 |

### 5.3 Pagination Edge Cases

| ID | Edge Case | Test Scenario | Expected Behavior |
|----|-----------|---------------|-------------------|
| EC-021 | First page | No cursor | Returns first page |
| EC-022 | Last page | Cursor at end | has_more = false |
| EC-023 | Invalid cursor | Malformed cursor | Ignore, start fresh |
| EC-024 | Limit = 1 | limit = 1 | Single result |
| EC-025 | Limit = 10000 | limit = 10000 | Max allowed |
| EC-026 | Limit > 10000 | limit = 50000 | Capped at 10000 |
| EC-027 | Cursor + filter change | Cursor from old filter | Reset pagination |

### 5.4 Error Handling Edge Cases

| ID | Edge Case | Test Scenario | Expected Behavior |
|----|-----------|---------------|-------------------|
| EC-028 | Database connection lost | Query during disconnect | 500 error, retry |
| EC-029 | Query timeout | Very complex query | Timeout error |
| EC-030 | Invalid JSON body | Malformed POST body | 400 error |
| EC-031 | Missing required field | POST without required | 422 validation error |
| EC-032 | Type mismatch | String where int expected | 422 validation error |
| EC-033 | Cluster not found | GET /clusters/INVALID | 404 error |
| EC-034 | Case not found | GET /cases/INVALID | 404 error |

---

## 6. Test Implementation Priority

### 6.1 Priority 1 (Critical) - Implement First

These tests cover core functionality and should be implemented immediately.

#### Backend Tests (Priority 1)

| Test File | Tests to Add | Estimated Time |
|-----------|--------------|----------------|
| `test_cases.py` | POST /api/cases/query tests | 2 hours |
| `test_cases.py` | POST /api/cases/stats tests | 1 hour |
| `test_cases.py` | Situation filter tests | 30 min |
| `test_cases.py` | MSA filter tests | 30 min |
| `test_cases.py` | Relationship filter tests | 30 min |
| `test_cases.py` | Circumstance filter tests | 30 min |
| `test_clustering.py` | Geographic scoring with lat/long | 1 hour |

#### Frontend Tests (Priority 1)

| Test File | Tests to Add | Estimated Time |
|-----------|--------------|----------------|
| `PrimaryFilters.test.tsx` | NEW - State, Year, Solved filters | 2 hours |
| `VictimFilters.test.tsx` | NEW - Sex, Age, Race, Ethnicity | 2 hours |
| `CrimeFilters.test.tsx` | NEW - Weapon, Relationship, etc. | 2 hours |
| `GeographyFilters.test.tsx` | NEW - County, MSA filters | 1.5 hours |
| `SearchFilters.test.tsx` | NEW - Agency, Case ID search | 1 hour |

**Total Priority 1: ~14 hours**

### 6.2 Priority 2 (Important) - Implement Second

These tests cover important edge cases and secondary functionality.

#### Backend Tests (Priority 2)

| Test File | Tests to Add | Estimated Time |
|-----------|--------------|----------------|
| `test_clustering.py` | Edge cases for similarity | 2 hours |
| `test_clustering.py` | Large dataset performance | 1 hour |
| `test_cases.py` | Filter combination edge cases | 1.5 hours |
| `test_cases.py` | Pagination edge cases | 1 hour |

#### Frontend Tests (Priority 2)

| Test File | Tests to Add | Estimated Time |
|-----------|--------------|----------------|
| `ClusterView.test.tsx` | NEW - Cluster view component | 2 hours |
| `ClusterDetail.test.tsx` | NEW - Cluster detail component | 1.5 hours |
| `FilterPanel.test.tsx` | Filter combination interactions | 1 hour |

**Total Priority 2: ~10 hours**

### 6.3 Priority 3 (Nice to Have) - Implement Last

These tests cover edge cases and polish.

| Test File | Tests to Add | Estimated Time |
|-----------|--------------|----------------|
| All | SQL injection prevention | 1 hour |
| All | Unicode handling | 1 hour |
| All | Error boundary tests | 1 hour |
| E2E | Full workflow tests | 4 hours |

**Total Priority 3: ~7 hours**

### 6.4 Implementation Order

```
Week 1:
├── Day 1-2: Backend POST endpoint tests
├── Day 3: Backend filter tests (situation, MSA, relationship, circumstance)
├── Day 4-5: Frontend filter component tests (Primary, Victim)

Week 2:
├── Day 1-2: Frontend filter component tests (Crime, Geography, Search)
├── Day 3: Clustering edge case tests
├── Day 4: Frontend cluster component tests
├── Day 5: Integration tests

Week 3:
├── Day 1-2: Edge case tests
├── Day 3-4: E2E workflow tests
├── Day 5: Documentation and cleanup
```

---

## Appendix A: Test File Templates

### A.1 Backend Test Template

```python
"""Tests for [feature] functionality."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

from backend.main import app


@pytest.fixture
def client(populated_test_db):
    """Create test client with mocked database."""
    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = populated_test_db
        yield TestClient(app)


class TestFeatureName:
    """Test [feature] endpoint."""

    def test_basic_functionality(self, client):
        """Test that [feature] works with basic input."""
        response = client.get("/api/endpoint")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "expected_field" in data

    def test_with_filters(self, client):
        """Test that [feature] respects filters."""
        response = client.get("/api/endpoint?filter=value")
        
        assert response.status_code == 200
        # Assertions...

    def test_error_handling(self, client):
        """Test that [feature] handles errors gracefully."""
        with patch("backend.module.function") as mock_fn:
            mock_fn.side_effect = Exception("Error")
            
            response = client.get("/api/endpoint")
            
            assert response.status_code == 500
```

### A.2 Frontend Component Test Template

```typescript
/**
 * Test suite for [Component] component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import { ComponentName } from '../../../src/components/path/ComponentName'
import { useFilterStore } from '../../../src/stores/useFilterStore'

describe('ComponentName', () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetFilters } = useFilterStore.getState()
    act(() => {
      resetFilters()
    })
  })

  describe('Rendering', () => {
    it('should render the component', () => {
      render(<ComponentName />)
      
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should handle user input', () => {
      render(<ComponentName />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test' } })
      
      expect(input).toHaveValue('test')
    })
  })

  describe('State Management', () => {
    it('should update store on change', () => {
      render(<ComponentName />)
      
      // Trigger change
      fireEvent.click(screen.getByText('Button'))
      
      // Verify store updated
      const state = useFilterStore.getState()
      expect(state.someValue).toBe('expected')
    })
  })
})
```

---

## Appendix B: Test Data Fixtures

### B.1 Sample Case Data

```python
SAMPLE_CASES = [
    {
        "id": "IL-12345-1990",
        "state": "ILLINOIS",
        "year": 1990,
        "month": 6,
        "solved": 0,
        "vic_sex": "Female",
        "vic_age": 25,
        "vic_race": "White",
        "weapon": "Strangulation - hanging",
        "weapon_code": 80,
        "relationship": "Stranger",
        "circumstance": "Unknown",
        "situation": "Single victim/unknown offenders",
        "county_fips_code": 17031,
        "cntyfips": "Cook County",
        "msa": "Chicago-Naperville-Elgin",
        "agency": "Chicago Police Department",
        "latitude": 41.8781,
        "longitude": -87.6298,
    },
    # ... more cases
]
```

### B.2 Sample Cluster Data

```python
SAMPLE_CLUSTER = {
    "cluster_id": "ILLINOIS_17031_1234567890",
    "location_description": "ILLINOIS - County 17031",
    "total_cases": 5,
    "solved_cases": 1,
    "unsolved_cases": 4,
    "solve_rate": 20.0,
    "avg_similarity_score": 85.5,
    "first_year": 1990,
    "last_year": 1995,
    "primary_weapon": "Strangulation - hanging",
    "primary_victim_sex": "Female",
    "avg_victim_age": 27.5,
    "case_ids": ["IL-12345-1990", "IL-12346-1991", ...],
}
```

---

## Appendix C: Running Tests

### C.1 Backend Tests

```bash
# Run all backend tests
cd backend
pytest tests/ -v

# Run specific test file
pytest tests/backend/test_routes/test_cases.py -v

# Run with coverage
pytest tests/ --cov=backend --cov-report=html

# Run specific test class
pytest tests/backend/test_routes/test_cases.py::TestListCases -v

# Run specific test
pytest tests/backend/test_routes/test_cases.py::TestListCases::test_list_cases_filters_by_state -v
```

### C.2 Frontend Tests

```bash
# Run all frontend tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/frontend/components/FilterPanel.test.tsx

# Run in watch mode
npm test -- --watch

# Run with UI
npm test -- --ui
```

### C.3 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements-dev.txt
      - run: pytest tests/backend/ --cov=backend --cov-report=xml
      
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
```

---

*End of Test Plan Document*