# Redstring API Documentation

> Comprehensive reference for the Redstring backend API endpoints, data models, and examples.

**API Version**: 0.1.0
**Base URL**: `http://localhost:5000` (development)
**Status**: MVP Phase 1 Complete (Phase 5: Clustering Algorithm)

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Security](#authentication--security)
3. [Error Handling](#error-handling)
4. [Health & Setup Endpoints](#health--setup-endpoints)
5. [Case Endpoints](#case-endpoints)
6. [Cluster Endpoints](#cluster-endpoints)
7. [Data Models](#data-models)
8. [Query Parameters Reference](#query-parameters-reference)
9. [Error Responses](#error-responses)
10. [Examples](#examples)

---

## Overview

The Redstring API provides REST endpoints for:
- **Database Setup**: Initialize and monitor the homicide database import
- **Case Queries**: Search and filter 894,636 homicide records (1976-2023)
- **Cluster Analysis**: Detect suspicious patterns in unsolved murders
- **Data Export**: Export cases and cluster results to CSV

### Key Features

- **Comprehensive Filtering**: 14+ filter types across demographics, crime characteristics, and geography
- **Cursor-based Pagination**: Efficient handling of large result sets
- **Real-time Progress**: Monitor database setup with progress polling
- **Multi-factor Similarity**: Configurable clustering algorithm with 6 weighted factors
- **CSV Export**: Download cases and cluster results as CSV files

### Technical Details

- **Framework**: FastAPI (Python 3.11)
- **Database**: SQLite (homicides.db)
- **Data Format**: JSON (requests/responses), CSV (exports)
- **Performance Targets**:
  - Single filter query: < 500ms
  - Multi-filter query: < 2 seconds
  - Database setup: < 60 seconds
  - Cluster analysis: < 5 seconds

---

## Authentication & Security

**MVP Phase 1 Scope**: No authentication required.

The API is intended to run on `localhost:5000` only, accessed from the Electron renderer process via HTTP. CORS is configured to allow requests from any origin (file://, http://localhost:3000, etc.) for development purposes.

### Security Notes

- The API should **never be exposed publicly** without authentication
- All endpoints are unprotected; assume local-only access
- Future phases may add authentication and encryption

---

## Error Handling

All errors follow a consistent JSON format.

### Response Format

```json
{
  "detail": "Human-readable error message"
}
```

### HTTP Status Codes

| Status | Meaning | Use Cases |
|--------|---------|-----------|
| `200 OK` | Success | Standard successful response |
| `400 Bad Request` | Client error | Invalid query parameters, malformed input |
| `404 Not Found` | Resource missing | Case/cluster not found |
| `422 Unprocessable Entity` | Validation error | Invalid data types, constraint violations |
| `500 Internal Server Error` | Server error | Database errors, unexpected exceptions |

### Error Response Examples

#### 400 Bad Request
```json
{
  "detail": "Invalid parameters: states list is required"
}
```

#### 404 Not Found
```json
{
  "detail": "Case not found"
}
```

#### 422 Validation Error
```json
{
  "detail": "Value error, vic_age_min must be between 0 and 999"
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Failed to fetch cases. Please try again."
}
```

---

## Health & Setup Endpoints

### GET /health

Health check endpoint for Electron process monitoring.

**Response Model:**
```json
{
  "status": "healthy",
  "service": "redstring-api",
  "version": "0.1.0"
}
```

**Example:**
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "redstring-api",
  "version": "0.1.0"
}
```

---

### GET /api/setup/status

Check database initialization status and record count.

**Response Model:**

| Field | Type | Description |
|-------|------|-------------|
| `initialized` | boolean | Whether database has been fully initialized |
| `record_count` | integer | Total homicide records in database (0 if not initialized) |
| `database_exists` | boolean | Whether database file exists |

**Example:**
```bash
curl http://localhost:5000/api/setup/status
```

**Response (Not Initialized):**
```json
{
  "initialized": false,
  "record_count": 0,
  "database_exists": false
}
```

**Response (Initialized):**
```json
{
  "initialized": true,
  "record_count": 894636,
  "database_exists": true
}
```

---

### POST /api/setup/initialize

Run first-time database setup. Executes the complete pipeline:
1. Create database schema
2. Import 894,636 CSV records in chunks
3. Create indexes on all filterable columns
4. Enrich with geographic coordinates

**Request:**
```bash
curl -X POST http://localhost:5000/api/setup/initialize
```

**Response Model:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Either `"success"` or `"error"` |
| `message` | string | Human-readable status message |
| `record_count` | integer | Number of records imported (null on error) |

**Response (Success):**
```json
{
  "status": "success",
  "message": "Database initialized successfully",
  "record_count": 894636
}
```

**Response (Already Initialized):**
```json
{
  "detail": "Database is already initialized"
}
```
Status: **400 Bad Request**

**Response (Setup Failed):**
```json
{
  "detail": "Setup failed: CSV file not found at /path/to/Murder Data SHR65 2023.csv"
}
```
Status: **500 Internal Server Error**

**Notes:**
- This is a **blocking endpoint** that may take 30-60 seconds to complete
- Use `/api/setup/progress` to poll for status updates during setup
- Cannot be called if database is already initialized

---

### GET /api/setup/progress

Get real-time progress during database setup. Poll this endpoint regularly during setup to show progress to the user.

**Response Model:**

| Field | Type | Description |
|-------|------|-------------|
| `current` | integer | Number of records processed so far |
| `total` | integer | Total records to process (always 894,636) |
| `stage` | string | Current setup stage: `"idle"`, `"creating_schema"`, `"importing"`, `"indexing"`, `"enriching"`, `"complete"`, or `"error"` |
| `percentage` | float | Progress percentage (0-100) |
| `error` | string or null | Error message if stage is `"error"`, null otherwise |

**Example:**
```bash
curl http://localhost:5000/api/setup/progress
```

**Response (In Progress):**
```json
{
  "current": 450000,
  "total": 894636,
  "stage": "importing",
  "percentage": 50.3,
  "error": null
}
```

**Response (Complete):**
```json
{
  "current": 894636,
  "total": 894636,
  "stage": "complete",
  "percentage": 100.0,
  "error": null
}
```

**Response (Error):**
```json
{
  "current": 250000,
  "total": 894636,
  "stage": "error",
  "percentage": 27.9,
  "error": "Disk space full"
}
```

**Recommended Poll Interval:** 500ms during setup

---

## Case Endpoints

### GET /api/cases

Get paginated list of cases with comprehensive filtering.

**Query Parameters:**

#### Demographic Filters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `states` | string | Comma-separated state names | `ILLINOIS,CALIFORNIA` |
| `vic_sex` | string | Victim sex (comma-separated) | `Male,Female` |
| `vic_race` | string | Victim race (comma-separated) | `White,Black` |
| `vic_ethnic` | string | Victim ethnicity (comma-separated) | `Hispanic Origin` |
| `vic_age_min` | integer | Minimum victim age (0-99, 999=unknown) | `18` |
| `vic_age_max` | integer | Maximum victim age (0-99, 999=unknown) | `65` |
| `include_unknown_age` | boolean | Include cases with unknown age (999) | `false` |

#### Temporal Filters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `year_min` | integer | Minimum year (1976-2023) | `1990` |
| `year_max` | integer | Maximum year (1976-2023) | `2020` |

#### Case Status
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `solved` | integer | 0=unsolved, 1=solved | `0` |

#### Crime Characteristics
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `weapon` | string | Comma-separated weapon types | `Handgun - pistol, revolver, etc` |
| `relationship` | string | Comma-separated relationships | `Stranger` |
| `circumstance` | string | Comma-separated circumstances | `Drug related` |
| `situation` | string | Situation categories | `Single victim, single offender` |

#### Geographic Filters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `county` | string | Comma-separated county names | `Cook County,Los Angeles County` |
| `msa` | string | Comma-separated MSA names | `Chicago` |

#### Search & Pagination
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `agency_search` | string | Agency name substring (case-insensitive) | `Chicago Police` |
| `case_id` | string | Exact case ID match | `IL-12345-1990` |
| `cursor` | string | Pagination cursor (format: `year:id`) | `1995:IL-12345` |
| `limit` | integer | Results per page (1-10000, default: 100) | `100` |

**Response Model:**

```json
{
  "cases": [
    {
      "id": "IL-12345-1990",
      "state": "ILLINOIS",
      "year": 1990,
      "month": 5,
      "month_name": "May",
      "solved": 0,
      "vic_sex": "Female",
      "vic_age": 28,
      "vic_race": "White",
      "vic_ethnic": "Not Hispanic",
      "vic_sex_code": 2,
      "weapon": "Handgun - pistol, revolver, etc",
      "weapon_code": 11,
      "county_fips_code": 17031,
      "cntyfips": "17031",
      "state_fips_code": 17,
      "msa": "Chicago, IL",
      "msa_fips_code": 16980,
      "agency": "Chicago Police Department",
      "ori": "IL0210200",
      "agentype": "Local Police",
      "source": "SHR",
      "incident": 1,
      "action_type": "Justifiable Homicide",
      "homicide": "First Degree Murder",
      "situation": "Single victim, single offender",
      "relationship": "Stranger",
      "circumstance": "Other Felony",
      "subcircum": "Robbery",
      "vic_count": 1,
      "off_count": 1,
      "off_age": 35,
      "off_sex": "Male",
      "off_race": "Black",
      "off_ethnic": "Not Hispanic",
      "file_date": "1990-12-31",
      "decade": 1990,
      "latitude": 41.8781,
      "longitude": -87.6298
    }
  ],
  "pagination": {
    "next_cursor": "1989:IL-12346",
    "has_more": true,
    "current_page_size": 100,
    "total_count": 15234,
    "large_result_warning": false
  }
}
```

**Performance:**
- Single filter: < 500ms
- Multi-filter: < 2 seconds
- Large result warning issued if total_count > 50,000

**Example:**
```bash
# Get unsolved cases in Illinois from 1990-2020, limited to 100 results
curl "http://localhost:5000/api/cases?states=ILLINOIS&year_min=1990&year_max=2020&solved=0&limit=100"

# Get cases with specific victim demographics
curl "http://localhost:5000/api/cases?states=CALIFORNIA&vic_sex=Female&vic_age_min=20&vic_age_max=35"

# Use pagination cursor for next page
curl "http://localhost:5000/api/cases?states=ILLINOIS&cursor=1989:IL-12346&limit=100"
```

---

### GET /api/cases/{case_id}

Get detailed information for a single case.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `case_id` | string | Case ID (e.g., `IL-12345-1990`) |

**Response:** CaseResponse model (see `/api/cases` endpoint for field definitions)

**Examples:**

```bash
curl http://localhost:5000/api/cases/IL-12345-1990
```

**Response:**
```json
{
  "id": "IL-12345-1990",
  "state": "ILLINOIS",
  "year": 1990,
  "month": 5,
  "month_name": "May",
  "solved": 0,
  "vic_sex": "Female",
  "vic_age": 28,
  "vic_race": "White",
  "vic_ethnic": "Not Hispanic",
  "vic_sex_code": 2,
  "weapon": "Handgun - pistol, revolver, etc",
  "weapon_code": 11,
  ...
}
```

**Error:**
```json
{
  "detail": "Case not found"
}
```
Status: **404 Not Found**

---

### GET /api/stats/summary

Get statistical summary for filtered cases.

Calculates aggregate counts and solve rate without pagination. Same filter parameters as `/api/cases` (except `cursor` and `limit`).

**Query Parameters:** Same as `/api/cases` (excluding pagination parameters)

**Response Model:**

| Field | Type | Description |
|-------|------|-------------|
| `total_cases` | integer | Total cases matching filters |
| `solved_cases` | integer | Number of solved cases |
| `unsolved_cases` | integer | Number of unsolved cases |
| `solve_rate` | float | Percentage of cases solved (0-100) |

**Example:**
```bash
curl "http://localhost:5000/api/stats/summary?states=ILLINOIS&year_min=1990&year_max=2020&solved=0"
```

**Response:**
```json
{
  "total_cases": 15234,
  "solved_cases": 0,
  "unsolved_cases": 15234,
  "solve_rate": 0.0
}
```

**Response (Mixed Solved/Unsolved):**
```json
{
  "total_cases": 50000,
  "solved_cases": 31500,
  "unsolved_cases": 18500,
  "solve_rate": 63.0
}
```

---

## Cluster Endpoints

### POST /api/clusters/analyze

Run cluster analysis to detect suspicious patterns in homicide cases.

Executes the custom clustering algorithm to identify geographic clusters with high similarity and low solve rates.

**Request Body:**

```json
{
  "min_cluster_size": 5,
  "max_solve_rate": 33.0,
  "similarity_threshold": 70.0,
  "weights": {
    "geographic": 35.0,
    "weapon": 25.0,
    "victim_sex": 20.0,
    "victim_age": 10.0,
    "temporal": 7.0,
    "victim_race": 3.0
  },
  "filter": {
    "states": ["ILLINOIS"],
    "year_min": 1990,
    "year_max": 2020,
    "solved": 0
  }
}
```

**Request Parameters:**

| Field | Type | Default | Range | Description |
|-------|------|---------|-------|-------------|
| `min_cluster_size` | integer | 5 | 3-100 | Minimum cases to form a cluster |
| `max_solve_rate` | float | 33.0 | 0-100 | Maximum solve rate (%) for suspicious clusters |
| `similarity_threshold` | float | 70.0 | 0-100 | Minimum similarity score for clustering |
| `weights` | object | See below | - | Custom similarity weights |
| `filter` | object | null | - | Optional CaseFilter for case selection |

**Default Weights** (sum = 100.0):
```json
{
  "geographic": 35.0,
  "weapon": 25.0,
  "victim_sex": 20.0,
  "victim_age": 10.0,
  "temporal": 7.0,
  "victim_race": 3.0
}
```

**Response Model:**

```json
{
  "clusters": [
    {
      "cluster_id": "ILLINOIS_17031_1701234567890",
      "location_description": "ILLINOIS - County 17031",
      "total_cases": 12,
      "solved_cases": 2,
      "unsolved_cases": 10,
      "solve_rate": 16.7,
      "avg_similarity_score": 82.3,
      "first_year": 1995,
      "last_year": 2005,
      "primary_weapon": "Handgun - pistol, revolver, etc",
      "primary_victim_sex": "Female",
      "avg_victim_age": 28.5
    }
  ],
  "total_clusters": 42,
  "total_cases_analyzed": 15234,
  "analysis_time_seconds": 3.2,
  "config": {
    "min_cluster_size": 5,
    "max_solve_rate": 33.0,
    "similarity_threshold": 70.0,
    "weights": {...}
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `clusters` | array | Detected clusters sorted by unsolved count (descending) |
| `total_clusters` | integer | Number of clusters found |
| `total_cases_analyzed` | integer | Total cases included in analysis |
| `analysis_time_seconds` | float | Execution time in seconds |
| `config` | object | Configuration used for analysis |

**Performance:**
- Target: < 5 seconds for full dataset
- Actual time varies by filter scope and cluster count

**Example:**
```bash
curl -X POST http://localhost:5000/api/clusters/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "min_cluster_size": 5,
    "max_solve_rate": 33.0,
    "similarity_threshold": 70.0,
    "weights": {
      "geographic": 35.0,
      "weapon": 25.0,
      "victim_sex": 20.0,
      "victim_age": 10.0,
      "temporal": 7.0,
      "victim_race": 3.0
    },
    "filter": {
      "states": ["ILLINOIS"],
      "solved": 0
    }
  }'
```

---

### GET /api/clusters/{cluster_id}

Get detailed information for a specific cluster.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `cluster_id` | string | Unique cluster identifier (format: `STATE_FIPS_TIMESTAMP`) |

**Response Model:**

```json
{
  "cluster_id": "ILLINOIS_17031_1701234567890",
  "location_description": "ILLINOIS - County 17031",
  "total_cases": 12,
  "solved_cases": 2,
  "unsolved_cases": 10,
  "solve_rate": 16.7,
  "avg_similarity_score": 82.3,
  "first_year": 1995,
  "last_year": 2005,
  "primary_weapon": "Handgun - pistol, revolver, etc",
  "primary_victim_sex": "Female",
  "avg_victim_age": 28.5,
  "case_ids": [
    "IL-12345-95",
    "IL-12346-96",
    "IL-12347-97"
  ]
}
```

**Example:**
```bash
curl http://localhost:5000/api/clusters/ILLINOIS_17031_1701234567890
```

**Error:**
```json
{
  "detail": "Cluster ILLINOIS_17031_1701234567890 not found"
}
```
Status: **404 Not Found**

---

### GET /api/clusters/{cluster_id}/cases

Get full case details for all cases in a cluster.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `cluster_id` | string | Unique cluster identifier |

**Response:** Array of CaseResponse objects with all 37 fields

**Example:**
```bash
curl http://localhost:5000/api/clusters/ILLINOIS_17031_1701234567890/cases
```

**Response:**
```json
[
  {
    "id": "IL-12345-95",
    "state": "ILLINOIS",
    "year": 1995,
    "solved": 0,
    "vic_sex": "Female",
    "vic_age": 28,
    "vic_race": "White",
    "weapon": "Handgun - pistol, revolver, etc",
    "weapon_code": 11,
    ...
  },
  {
    "id": "IL-12346-96",
    ...
  }
]
```

**Error:**
```json
{
  "detail": "Cluster ILLINOIS_17031_1701234567890 not found or has no cases"
}
```
Status: **404 Not Found**

---

### GET /api/clusters/{cluster_id}/export

Export all cases in a cluster to CSV file.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `cluster_id` | string | Unique cluster identifier |

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="cluster_{cluster_id}_cases.csv"`

**CSV Format:**
- Header row with all 37 case field names
- One row per case
- Proper CSV escaping for special characters

**Example:**
```bash
curl http://localhost:5000/api/clusters/ILLINOIS_17031_1701234567890/export \
  -o cluster_cases.csv
```

**CSV Content:**
```
id,state,year,month,month_name,solved,vic_sex,vic_age,vic_race,vic_ethnic,vic_sex_code,weapon,weapon_code,county_fips_code,...
IL-12345-95,ILLINOIS,1995,5,May,0,Female,28,White,Not Hispanic,2,Handgun - pistol, revolver, etc,11,17031,...
IL-12346-96,ILLINOIS,1996,6,June,0,Female,32,White,Not Hispanic,2,Handgun - pistol, revolver, etc,11,17031,...
```

**Error:**
```json
{
  "detail": "Cluster ILLINOIS_17031_1701234567890 not found or has no cases"
}
```
Status: **404 Not Found**

---

## Data Models

### Case Model

Complete schema for a homicide case record.

**Fields (37 total):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique case identifier (format: `STATE-AGENCY_ID-YEAR`) |
| `state` | string | State name (e.g., `ILLINOIS`) |
| `year` | integer | Year of incident (1976-2023) |
| `month` | integer | Month (1-12) |
| `month_name` | string | Month name (January-December) |
| `solved` | integer | 0=unsolved, 1=solved |
| `incident` | integer | Incident number |
| `vic_sex` | string | Victim sex: `Male`, `Female`, `Unknown` |
| `vic_sex_code` | integer | Victim sex code: 1=Male, 2=Female, 3=Unknown |
| `vic_age` | integer | Victim age (0-99, 999=unknown) |
| `vic_race` | string | Victim race: `White`, `Black`, `Asian`, `American Indian/Alaskan Native`, `Unknown` |
| `vic_ethnic` | string | Victim ethnicity: `Hispanic Origin`, `Not Hispanic`, `Unknown` |
| `off_sex` | string | Offender sex: `Male`, `Female`, `Unknown` |
| `off_age` | integer | Offender age (0-99, 999=unknown) |
| `off_race` | string | Offender race (same values as victim race) |
| `off_ethnic` | string | Offender ethnicity (same values as victim ethnic) |
| `vic_count` | integer | Number of victims |
| `off_count` | integer | Number of offenders |
| `weapon` | string | Weapon type (18 categories) |
| `weapon_code` | integer | Weapon code (11-99) |
| `relationship` | string | Victim-offender relationship (28 categories) |
| `circumstance` | string | Circumstance/motive category |
| `subcircum` | string | Sub-circumstance (more specific category) |
| `situation` | string | Situation: `Single victim, single offender`, `Single victim, multiple offenders`, etc. |
| `action_type` | string | Action taken: `Justifiable Homicide`, `Criminal Homicide` |
| `homicide` | string | Homicide category: `First Degree Murder`, `Second Degree Murder`, etc. |
| `county_fips_code` | integer | County FIPS code |
| `cntyfips` | string | County FIPS code as string |
| `state_fips_code` | integer | State FIPS code |
| `msa` | string | Metropolitan Statistical Area name |
| `msa_fips_code` | integer | MSA FIPS code |
| `agency` | string | Reporting law enforcement agency name |
| `ori` | string | Originating Agency Identifier (ORI code) |
| `agentype` | string | Agency type: `Local Police`, `State Police`, `Sheriff`, etc. |
| `source` | string | Data source: `SHR` (Supplementary Homicide Reports) |
| `file_date` | string | Date record was filed (YYYY-MM-DD format) |
| `decade` | integer | Decade of incident (e.g., 1990, 2000) |
| `latitude` | float | County centroid latitude |
| `longitude` | float | County centroid longitude |

### CaseFilter Model

Request model for filtering cases.

```json
{
  "states": ["ILLINOIS", "CALIFORNIA"],
  "vic_sex": ["Female"],
  "vic_race": ["White", "Black"],
  "vic_ethnic": ["Not Hispanic"],
  "vic_age_min": 18,
  "vic_age_max": 65,
  "include_unknown_age": false,
  "year_min": 1990,
  "year_max": 2020,
  "solved": 0,
  "weapon": ["Handgun - pistol, revolver, etc", "Strangulation"],
  "relationship": ["Stranger"],
  "circumstance": ["Drug related"],
  "situation": ["Single victim, single offender"],
  "county": ["Cook County"],
  "msa": ["Chicago"],
  "agency_search": "Chicago Police",
  "case_id": "IL-12345-1990",
  "cursor": "1995:IL-12346",
  "limit": 100
}
```

### ClusterConfig Model

Request model for cluster analysis configuration.

```json
{
  "min_cluster_size": 5,
  "max_solve_rate": 33.0,
  "similarity_threshold": 70.0,
  "weights": {
    "geographic": 35.0,
    "weapon": 25.0,
    "victim_sex": 20.0,
    "victim_age": 10.0,
    "temporal": 7.0,
    "victim_race": 3.0
  },
  "filter": {
    "states": ["ILLINOIS"],
    "year_min": 1990,
    "year_max": 2020,
    "solved": 0
  }
}
```

**Configuration Parameters:**

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `min_cluster_size` | integer | 5 | 3-100 | Minimum cases to form a cluster |
| `max_solve_rate` | float | 33.0 | 0-100 | Maximum solve rate (%) to flag as suspicious |
| `similarity_threshold` | float | 70.0 | 0-100 | Minimum similarity score for inclusion |
| `weights.geographic` | float | 35.0 | 0-100 | Geographic proximity weight |
| `weights.weapon` | float | 25.0 | 0-100 | Weapon type match weight |
| `weights.victim_sex` | float | 20.0 | 0-100 | Victim sex match weight |
| `weights.victim_age` | float | 10.0 | 0-100 | Victim age proximity weight |
| `weights.temporal` | float | 7.0 | 0-100 | Temporal proximity weight |
| `weights.victim_race` | float | 3.0 | 0-100 | Victim race match weight |

### ClusterResult Model

Response model for cluster analysis results.

```json
{
  "clusters": [
    {
      "cluster_id": "ILLINOIS_17031_1701234567890",
      "location_description": "ILLINOIS - County 17031",
      "total_cases": 12,
      "solved_cases": 2,
      "unsolved_cases": 10,
      "solve_rate": 16.7,
      "avg_similarity_score": 82.3,
      "first_year": 1995,
      "last_year": 2005,
      "primary_weapon": "Handgun - pistol, revolver, etc",
      "primary_victim_sex": "Female",
      "avg_victim_age": 28.5
    }
  ],
  "total_clusters": 42,
  "total_cases_analyzed": 15234,
  "analysis_time_seconds": 3.2,
  "config": {
    "min_cluster_size": 5,
    "max_solve_rate": 33.0,
    "similarity_threshold": 70.0,
    "weights": {...}
  }
}
```

### Statistics Model

Response model for statistics summary.

```json
{
  "total_cases": 50000,
  "solved_cases": 31500,
  "unsolved_cases": 18500,
  "solve_rate": 63.0
}
```

---

## Query Parameters Reference

### Weapon Types (18 categories)

```
Handgun - pistol, revolver, etc
Rifle
Shotgun
Firearm (type unknown)
Knife
Blunt object
Strangulation
Fire
Explosives
Poison
Narcotics
Asphyxiation
Suffocation
Drowning
Fall
Motor vehicle
Other
Unknown
```

### Victim Sex

```
Male
Female
Unknown
```

### Victim Race

```
White
Black
Asian
American Indian/Alaskan Native
Unknown
```

### Victim Ethnicity

```
Hispanic Origin
Not Hispanic
Unknown
```

### Solved Status

```
0 - Unsolved
1 - Solved
```

### Situation Categories

```
Single victim, single offender
Single victim, multiple offenders
Multiple victims, single offender
Multiple victims, multiple offenders
```

### State Names

All 50 US states plus DC:
```
ALABAMA, ALASKA, ARIZONA, ARKANSAS, CALIFORNIA, COLORADO, CONNECTICUT,
DELAWARE, FLORIDA, GEORGIA, HAWAII, IDAHO, ILLINOIS, INDIANA, IOWA,
KANSAS, KENTUCKY, LOUISIANA, MAINE, MARYLAND, MASSACHUSETTS, MICHIGAN,
MINNESOTA, MISSISSIPPI, MISSOURI, MONTANA, NEBRASKA, NEVADA, NEW HAMPSHIRE,
NEW JERSEY, NEW MEXICO, NEW YORK, NORTH CAROLINA, NORTH DAKOTA, OHIO,
OKLAHOMA, OREGON, PENNSYLVANIA, RHODE ISLAND, SOUTH CAROLINA, SOUTH DAKOTA,
TENNESSEE, TEXAS, UTAH, VERMONT, VIRGINIA, WASHINGTON, WEST VIRGINIA,
WISCONSIN, WYOMING, DISTRICT OF COLUMBIA
```

---

## Error Responses

### Common Error Scenarios

#### 400 Bad Request - Invalid Query Parameters

**Cause:** Malformed or invalid query parameters

**Example:**
```json
{
  "detail": "Invalid parameters: states list is required"
}
```

#### 400 Bad Request - Database Already Initialized

**Cause:** Attempt to call `/api/setup/initialize` when database is already set up

**Example:**
```json
{
  "detail": "Database is already initialized"
}
```

#### 404 Not Found - Case Not Found

**Cause:** Case ID does not exist in database

**Example:**
```json
{
  "detail": "Case not found"
}
```

#### 404 Not Found - Cluster Not Found

**Cause:** Cluster ID does not exist or has no cases

**Example:**
```json
{
  "detail": "Cluster ILLINOIS_17031_1701234567890 not found or has no cases"
}
```

#### 422 Unprocessable Entity - Validation Error

**Cause:** Invalid data type or constraint violation

**Example:**
```json
{
  "detail": "Value error, vic_age_min must be between 0 and 999"
}
```

#### 500 Internal Server Error - Query Execution Failed

**Cause:** Database error or unexpected exception

**Example:**
```json
{
  "detail": "Failed to fetch cases. Please try again."
}
```

#### 500 Internal Server Error - Setup Failed

**Cause:** Database initialization error (missing files, disk space, etc.)

**Example:**
```json
{
  "detail": "Setup failed: CSV file not found at /path/to/Murder Data SHR65 2023.csv"
}
```

#### 500 Internal Server Error - Cluster Analysis Failed

**Cause:** Unexpected error during cluster analysis

**Example:**
```json
{
  "detail": "Cluster analysis failed: Unable to connect to database"
}
```

---

## Examples

### Example 1: Basic Database Setup

1. Check setup status:
```bash
curl http://localhost:5000/api/setup/status
```

Response:
```json
{
  "initialized": false,
  "record_count": 0,
  "database_exists": false
}
```

2. Start initialization:
```bash
curl -X POST http://localhost:5000/api/setup/initialize
```

Response:
```json
{
  "status": "success",
  "message": "Database initialized successfully",
  "record_count": 894636
}
```

3. Poll for progress (while setup is running):
```bash
curl http://localhost:5000/api/setup/progress
```

Response:
```json
{
  "current": 450000,
  "total": 894636,
  "stage": "importing",
  "percentage": 50.3,
  "error": null
}
```

### Example 2: Query Cases with Multiple Filters

Get unsolved cases from Illinois involving female victims aged 20-35, killed with a handgun, from 1990-2010:

```bash
curl "http://localhost:5000/api/cases?states=ILLINOIS&vic_sex=Female&vic_age_min=20&vic_age_max=35&weapon=Handgun+-+pistol,+revolver,+etc&solved=0&year_min=1990&year_max=2010&limit=100"
```

Response:
```json
{
  "cases": [
    {
      "id": "IL-12345-1995",
      "state": "ILLINOIS",
      "year": 1995,
      "month": 5,
      "month_name": "May",
      "solved": 0,
      "vic_sex": "Female",
      "vic_age": 28,
      "vic_race": "White",
      "weapon": "Handgun - pistol, revolver, etc",
      "weapon_code": 11,
      ...
    }
  ],
  "pagination": {
    "next_cursor": "1994:IL-12346",
    "has_more": true,
    "current_page_size": 100,
    "total_count": 2534,
    "large_result_warning": false
  }
}
```

### Example 3: Pagination Using Cursor

Fetch next page using cursor from previous response:

```bash
curl "http://localhost:5000/api/cases?states=ILLINOIS&cursor=1994:IL-12346&limit=100"
```

### Example 4: Get Statistics for Filtered Set

Get statistics on unsolved cases in Texas from 2000-2023:

```bash
curl "http://localhost:5000/api/stats/summary?states=TEXAS&year_min=2000&year_max=2023&solved=0"
```

Response:
```json
{
  "total_cases": 8923,
  "solved_cases": 0,
  "unsolved_cases": 8923,
  "solve_rate": 0.0
}
```

### Example 5: Run Cluster Analysis

Detect suspicious patterns in unsolved cases in Illinois:

```bash
curl -X POST http://localhost:5000/api/clusters/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "min_cluster_size": 5,
    "max_solve_rate": 33.0,
    "similarity_threshold": 70.0,
    "weights": {
      "geographic": 35.0,
      "weapon": 25.0,
      "victim_sex": 20.0,
      "victim_age": 10.0,
      "temporal": 7.0,
      "victim_race": 3.0
    },
    "filter": {
      "states": ["ILLINOIS"],
      "solved": 0
    }
  }'
```

Response:
```json
{
  "clusters": [
    {
      "cluster_id": "ILLINOIS_17031_1701234567890",
      "location_description": "ILLINOIS - County 17031",
      "total_cases": 12,
      "solved_cases": 2,
      "unsolved_cases": 10,
      "solve_rate": 16.7,
      "avg_similarity_score": 82.3,
      "first_year": 1995,
      "last_year": 2005,
      "primary_weapon": "Handgun - pistol, revolver, etc",
      "primary_victim_sex": "Female",
      "avg_victim_age": 28.5
    },
    {
      "cluster_id": "ILLINOIS_17097_1701234567891",
      "location_description": "ILLINOIS - County 17097",
      "total_cases": 8,
      "solved_cases": 1,
      "unsolved_cases": 7,
      "solve_rate": 12.5,
      "avg_similarity_score": 79.1,
      "first_year": 2001,
      "last_year": 2008,
      "primary_weapon": "Handgun - pistol, revolver, etc",
      "primary_victim_sex": "Female",
      "avg_victim_age": 26.3
    }
  ],
  "total_clusters": 42,
  "total_cases_analyzed": 15234,
  "analysis_time_seconds": 3.2,
  "config": {
    "min_cluster_size": 5,
    "max_solve_rate": 33.0,
    "similarity_threshold": 70.0,
    "weights": {...}
  }
}
```

### Example 6: Get Cluster Details and Cases

Fetch detailed information about a specific cluster:

```bash
curl http://localhost:5000/api/clusters/ILLINOIS_17031_1701234567890
```

Response:
```json
{
  "cluster_id": "ILLINOIS_17031_1701234567890",
  "location_description": "ILLINOIS - County 17031",
  "total_cases": 12,
  "solved_cases": 2,
  "unsolved_cases": 10,
  "solve_rate": 16.7,
  "avg_similarity_score": 82.3,
  "first_year": 1995,
  "last_year": 2005,
  "primary_weapon": "Handgun - pistol, revolver, etc",
  "primary_victim_sex": "Female",
  "avg_victim_age": 28.5,
  "case_ids": [
    "IL-12345-95",
    "IL-12346-96",
    "IL-12347-97",
    "IL-12348-98",
    "IL-12349-99",
    "IL-12350-00",
    "IL-12351-01",
    "IL-12352-02",
    "IL-12353-03",
    "IL-12354-04",
    "IL-12355-05",
    "IL-12356-05"
  ]
}
```

Fetch full case details for all cases in the cluster:

```bash
curl http://localhost:5000/api/clusters/ILLINOIS_17031_1701234567890/cases
```

Response:
```json
[
  {
    "id": "IL-12345-95",
    "state": "ILLINOIS",
    "year": 1995,
    "month": 3,
    "month_name": "March",
    "solved": 0,
    "vic_sex": "Female",
    "vic_age": 28,
    "vic_race": "White",
    "vic_ethnic": "Not Hispanic",
    "vic_sex_code": 2,
    "weapon": "Handgun - pistol, revolver, etc",
    "weapon_code": 11,
    "county_fips_code": 17031,
    "cntyfips": "17031",
    "msa": "Chicago, IL",
    "agency": "Chicago Police Department",
    "ori": "IL0210200",
    "agentype": "Local Police",
    "source": "SHR",
    "latitude": 41.8781,
    "longitude": -87.6298,
    ...
  },
  {
    "id": "IL-12346-96",
    ...
  }
]
```

### Example 7: Export Cluster Cases to CSV

Download all cases in a cluster as CSV:

```bash
curl http://localhost:5000/api/clusters/ILLINOIS_17031_1701234567890/export \
  -o cluster_ILLINOIS_17031_1701234567890_cases.csv
```

The CSV file will contain:
```
id,state,year,month,month_name,solved,vic_sex,vic_age,vic_race,vic_ethnic,vic_sex_code,weapon,weapon_code,...
IL-12345-95,ILLINOIS,1995,3,March,0,Female,28,White,Not Hispanic,2,Handgun - pistol, revolver, etc,11,...
IL-12346-96,ILLINOIS,1996,4,April,0,Female,32,White,Not Hispanic,2,Handgun - pistol, revolver, etc,11,...
...
```

### Example 8: Analyze Specific County Only

Run cluster analysis limited to a specific county (Cook County, Illinois):

```bash
curl -X POST http://localhost:5000/api/clusters/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "min_cluster_size": 3,
    "max_solve_rate": 40.0,
    "similarity_threshold": 65.0,
    "filter": {
      "states": ["ILLINOIS"],
      "county": ["Cook County"],
      "solved": 0
    }
  }'
```

### Example 9: Custom Similarity Weights

Run analysis with custom weights emphasizing temporal proximity:

```bash
curl -X POST http://localhost:5000/api/clusters/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "min_cluster_size": 5,
    "max_solve_rate": 33.0,
    "similarity_threshold": 70.0,
    "weights": {
      "geographic": 20.0,
      "weapon": 15.0,
      "victim_sex": 20.0,
      "victim_age": 15.0,
      "temporal": 25.0,
      "victim_race": 5.0
    },
    "filter": {
      "states": ["CALIFORNIA"],
      "year_min": 2000,
      "solved": 0
    }
  }'
```

---

## Additional Resources

- **Project Documentation**: See [CLAUDE.md](../CLAUDE.md) for project overview
- **Database Schema**: See `backend/database/schema.py`
- **Data Pipeline**: See `backend/services/data_loader.py`
- **Clustering Algorithm**: See `backend/analysis/clustering.py`
- **Data Definitions**: See `resources/docs/Murder Accountability Project Definitions.pdf`
- **Algorithm Reference**: See `resources/docs/Algorithm.pdf`

---

**Last Updated**: November 2024
**Status**: MVP Phase 1 - Phase 5 Complete (Clustering Algorithm Ready)
**Next Phase**: Frontend Testing & Dark/Light Theme Toggle
