# Product Requirements Document: Murder Accountability Project Case Analyzer

## Executive Summary

Build a high-performance local desktop application that enables researchers and true crime analysts to explore and analyze homicide data from the Murder Accountability Project (MAP). The application will help identify suspicious clusters of unsolved murders that may indicate serial killer activity using the MAP's published clustering algorithm, combined with advanced filtering, visualization, and case similarity matching capabilities.

The application will be built as a native desktop app using Electron and React for the frontend interface, backed by a local Python engine for heavy data processing and algorithmic analysis.

---

## Project Context

### Background

The Murder Accountability Project maintains the most comprehensive database of homicides in the United States, containing **894,636 records spanning 1976–2023**. Approximately **262,179 cases (29.3%) remain unsolved**. The MAP has developed an algorithm to identify geographic and demographic clusters of unsolved homicides that may warrant investigation as potential serial murders.

### Target Users

The application serves researchers, students, journalists, and enthusiasts who want to explore patterns in unsolved homicides that may indicate serial criminal activity.

### User Personas

#### Primary Persona: Sarah - Criminology Graduate Student

**Background:**
- PhD candidate in criminology researching serial homicide patterns
- Strong analytical skills, moderate technical proficiency
- Comfortable with statistical software (SPSS, R) but prefers intuitive interfaces
- Works on research from home laptop, often late at night

**Goals:**
- Identify geographic clusters of unsolved cases for dissertation research
- Export filtered datasets for statistical analysis in other tools
- Build case collections to support academic publications
- Validate or challenge existing serial killer theories

**Pain Points:**
- Current MAP website only provides basic filtering
- No way to run custom clustering analysis
- Difficult to compare cases across jurisdictions
- Manual data manipulation is time-consuming

**Success Metrics:**
- Can identify relevant clusters in <10 minutes
- Export publication-ready datasets
- Build comprehensive case collections for longitudinal research

---

#### Secondary Persona: Marcus - Investigative Journalist

**Background:**
- Crime beat reporter for a regional newspaper
- Investigates cold cases and writes long-form features
- Self-taught data skills, uses Excel and basic visualization tools
- Works under deadline pressure

**Goals:**
- Find under-reported clusters of unsolved homicides for story leads
- Identify patterns that law enforcement may have missed
- Export data for fact-checking and source attribution
- Create visualizations for published articles

**Pain Points:**
- Needs to quickly validate if a "pattern" is statistically significant
- Requires exportable evidence for editorial review
- Must cite data sources accurately

**Success Metrics:**
- Identify newsworthy patterns in <30 minutes
- Export defensible, citable data for publication
- Create compelling visualizations for readers

---

#### Secondary Persona: Detective Linda - Law Enforcement Liaison

**Background:**
- Homicide detective with 15 years experience
- Collaborates with academic researchers on cold case reviews
- Limited time for data exploration—prefers actionable insights
- Conservative about technology, needs reliability over features

**Goals:**
- Cross-reference local unsolved cases with regional patterns
- Identify potential links between jurisdictions
- Generate reports for task force meetings
- Verify researcher claims about "serial" patterns

**Pain Points:**
- Suspicious of tools that might lead to false positives
- Needs to explain findings to non-technical colleagues
- Requires data provenance for legal credibility

**Success Metrics:**
- Quickly verify if cases match known clusters
- Generate clear reports for superiors
- Trust the tool's methodology

---

#### Tertiary Persona: Alex - True Crime Enthusiast

**Background:**
- Active member of true crime online communities
- Self-taught researcher with passion for unsolved cases
- No formal statistical training but high curiosity
- Uses podcasts, YouTube, and Reddit for case discussions

**Goals:**
- Explore data to develop theories about unsolved cases
- Find patterns that might have been overlooked
- Create shareable content for community discussions
- Learn about crime patterns in specific regions

**Pain Points:**
- Overwhelmed by large datasets without guidance
- Doesn't understand statistical concepts like "solve rate"
- Needs help interpreting what findings actually mean

**Success Metrics:**
- Successfully explore data without crashing or confusion
- Understand what clustering results represent
- Feel confident sharing insights with community

### User Stories

#### Data Exploration

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-01 | researcher | filter cases by state, year range, and victim demographics | I can focus on my specific research population | Must Have |
| US-02 | journalist | search for cases by agency name | I can investigate specific jurisdictions | Must Have |
| US-03 | enthusiast | browse all unsolved cases in my home state | I can learn about local cold cases | Must Have |
| US-04 | researcher | filter by weapon type and victim-offender relationship | I can analyze specific MO patterns | Must Have |
| US-05 | all users | see a count of results before loading all data | I know if my filters are too broad or narrow | Must Have |

#### Cluster Analysis

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-06 | researcher | run cluster analysis on my filtered dataset | I can identify statistically suspicious groupings | Must Have |
| US-07 | researcher | see why cases were grouped together | I can validate the clustering logic | Must Have |
| US-08 | journalist | sort clusters by unsolved count | I can prioritize the most significant patterns | Must Have |
| US-09 | detective | filter clusters to a specific time range | I can focus on cases relevant to my jurisdiction | Should Have |
| US-10 | researcher | adjust clustering thresholds | I can test sensitivity of pattern detection | Should Have |

#### Case Management

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-11 | researcher | save filtered results as a named collection | I can return to my research dataset later | Must Have |
| US-12 | researcher | add notes to individual cases | I can track my analysis observations | Should Have |
| US-13 | journalist | compare multiple cases side-by-side | I can identify common characteristics | Should Have |
| US-14 | enthusiast | export cases to CSV | I can explore data in spreadsheet software | Must Have |

#### Similarity Search

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-15 | detective | find cases similar to a specific unsolved homicide | I can identify potential linked crimes | Must Have |
| US-16 | researcher | understand which factors drove the similarity score | I can validate the matching logic | Must Have |
| US-17 | journalist | create an ad-hoc cluster from selected similar cases | I can build a story around related cases | Should Have |

#### Visualization

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-18 | all users | view cases on a map by county | I can see geographic distribution | Should Have |
| US-19 | researcher | see solve rates over time as a chart | I can analyze temporal trends | Should Have |
| US-20 | journalist | export visualizations as images | I can include them in published articles | Could Have |

#### System & Settings

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-21 | all users | toggle between dark and light mode | I can work comfortably in any lighting | Should Have |
| US-22 | researcher | save my filter combinations for reuse | I don't have to reconfigure for repeated analyses | Should Have |
| US-23 | all users | see progress during initial database setup | I know the app hasn't frozen | Must Have |

### Data Sources (Bundled with Application)

All data is pre-bundled with the application. Users do not need to import or upload any data files.

**Primary Data:**
1. `Murder Data SHR65 2023.csv` (~327MB) — Primary dataset with 894,636 homicide records
2. `UCR 2023 Data.csv` (~12MB) — Agency-level aggregate murder and clearance statistics

**Lookup Tables:**
3. `State FIPS Lookout.csv` — State name to FIPS code mapping (51 entries)
4. `County FIPS Lookout.csv` — County name to FIPS code mapping (~3,200 entries)
5. `US County Centroids.csv` — County geographic coordinates for map visualization (format: `state,county,cfips,latitude,longitude`)

**Documentation:**
6. `Algorithm.pdf` — MAP's SPSS algorithm for cluster detection
7. `Murder Accountability Project Definitions.pdf` — Complete data dictionary
8. `Murder Accountability Project Map Link.pdf` — Methodology for case linking (same incident) vs. matching (similar but unrelated cases)

**Note on UCR Data:** The `UCR 2023 Data.csv` file is available but **not required for MVP**. It contains agency-level aggregate statistics that can be used for benchmarking in future phases. Schema and integration details will be documented when this feature is implemented.

---

## Data Schema

### Primary Dataset: `Murder Data SHR65 2023.csv`

| Column      | Type    | Description                                                          |
|------------|---------|----------------------------------------------------------------------|
| ID         | String  | Unique 16-char identifier (YYYYMMINCIDENTORI)                        |
| CNTYFIPS   | String  | County FIPS label (e.g., "Anchorage, AK") — **requires mapping to numeric code** |
| Ori        | String  | Originating Agency code (7 char)                                     |
| State      | String  | Full state name                                                       |
| Agency     | String  | Law enforcement agency name                                           |
| Agentype   | String  | Agency type (Municipal police, Sheriff, etc.)                        |
| Source     | String  | FBI or FOIA obtained                                                  |
| Solved     | String  | "Yes" or "No" — **requires mapping to integer (1/0)**                |
| Year       | Integer | Year of homicide (1976–2023)                                         |
| Month      | String  | Month name (January, February, etc.) — **requires mapping to integer (1-12)** |
| Incident   | Integer | Case number within month                                              |
| ActionType | String  | Normal update or Adjustment                                           |
| Homicide   | String  | Murder/non-negligent manslaughter or Negligent manslaughter          |
| Situation  | String  | Victim/offender count combination                                     |
| VicAge     | Integer | Victim age (0–99, 999 = unknown)                                      |
| VicSex     | String  | Male, Female, Unknown — **requires mapping to code (1, 2, 9)**       |
| VicRace    | String  | White, Black, Asian, American Indian/Alaskan Native, Unknown          |
| VicEthnic  | String  | Hispanic Origin, Not Hispanic, Unknown                                |
| OffAge     | Integer | Offender age (999 = unknown/unidentified)                             |
| OffSex     | String  | Male, Female, Unknown                                                 |
| OffRace    | String  | Same categories as VicRace                                            |
| OffEthnic  | String  | Same categories as VicEthnic                                          |
| Weapon     | String  | Weapon category (18 types) — **requires mapping to numeric code (11-99)** |
| Relationship | String | Victim-offender relationship (28 categories)                         |
| Circumstance | String | Circumstances/motive (30+ categories)                                |
| Subcircum  | String  | Sub-circumstance for felon killed                                     |
| VicCount   | Integer | Additional victims in incident                                        |
| OffCount   | Integer | Additional offenders in incident                                      |
| FileDate   | String  | Report date (MMDDYY format)                                           |
| MSA        | String  | Metropolitan Statistical Area name — **requires mapping to numeric code** |
| decade     | Integer | Computed decade (e.g., 1980, 1990, etc.)                              |
| murdgrp1   | Integer | County clustering variable — **NOT in CSV, must be computed**  |
| murdgrp2   | Integer | MSA clustering variable — **NOT in CSV, must be computed**     |

### Critical Data Format Issue

**The CSV data format differs from what the algorithm requires.** The MAP algorithm expects numeric FIPS codes for county/MSA clustering, but the CSV contains human-readable labels:

```csv
CNTYFIPS: "Anchorage, AK"  (label string, not numeric FIPS)
MSA: "Anchorage, AK"  (label string, not numeric FIPS)
```

The definitions document confirms: *"When using the Comma Separated Values format file... the original FIPS coding is replaced with the label."*

**Resolution:** The data pipeline must include lookup tables to map labels to numeric codes. FIPS lookup tables are provided:

- `State FIPS Lookout.csv` - Format: `FIPS Code,state` (e.g., "17,ILLINOIS")
- `County FIPS Lookout.csv` - Format: `FIPS Code,county` (e.g., "1001,Autauga County")

**County Centroids:** Geographic coordinates for map visualization are provided in `US County Centroids.csv` with format: `state,county,cfips,latitude,longitude`

### Weapon Codes (18 Categories)

- Handgun - pistol, revolver, etc  
- Rifle  
- Shotgun  
- Firearm, type not stated  
- Other gun  
- Knife or cutting instrument  
- Blunt object - hammer, club, etc  
- Personal weapons, includes beating  
- Strangulation - hanging  
- Asphyxiation - includes death by gas  
- Fire  
- Poison - does not include gas  
- Pushed or thrown out window  
- Explosives  
- Drowning  
- Narcotics or drugs, sleeping pills  
- Other or type unknown  
- Weapon Not Reported  

### Relationship Categories (28 Total)

Key categories include: Wife, Husband, Girlfriend, Boyfriend, Ex-wife, Ex-husband, Mother, Father, Son, Daughter, Brother, Sister, Other family, In-law, Stepson, Stepdaughter, Stepfather, Stepmother, Common-law husband, Common-law wife, Friend, Acquaintance, Neighbor, Employer, Employee, Stranger, Other - known to victim, Relationship not determined.

### Situation Categories

- Single victim/single offender  
- Single victim/unknown offender(s)  
- Single victim/multiple offenders  
- Multiple victims/single offender  
- Multiple victims/unknown offender(s)  
- Multiple victims/multiple offenders  

---

## Data Transformation Requirements

### Bundled Lookup Tables

The following lookup tables are bundled with the application:

| File | Format | Purpose |
|------|--------|---------|
| `State FIPS Lookout.csv` | CSV | Map state names to 2-digit FIPS codes (51 entries) |
| `County FIPS Lookout.csv` | CSV | Map county names to 4-5 digit FIPS codes (~3,200 entries) |

**Note:** MSA FIPS codes are NOT used in MVP. County centroids for map visualization are provided in `US County Centroids.csv`.

### Data Transformation Mappings

All transformations applied during CSV import:

```python
# Solved status: String → Integer
SOLVED_MAP = {"Yes": 1, "No": 0}

# Victim sex: String → Numeric code (for clustering algorithm)
VIC_SEX_CODE = {"Male": 1, "Female": 2, "Unknown": 9}

# Month: String → Integer
MONTH_MAP = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12
}

# Weapon: String → Numeric code
WEAPON_CODE_MAP = {
    "Firearm, type not stated": 11,
    "Handgun - pistol, revolver, etc": 12,
    "Rifle": 13,
    "Shotgun": 14,
    "Other gun": 15,
    "Knife or cutting instrument": 20,
    "Blunt object - hammer, club, etc": 30,
    "Personal weapons, includes beating": 40,
    "Poison - does not include gas": 50,
    "Pushed or thrown out window": 55,
    "Explosives": 60,
    "Fire": 65,
    "Narcotics or drugs, sleeping pills": 70,
    "Drowning": 75,
    "Strangulation - hanging": 80,
    "Asphyxiation - includes death by gas": 85,
    "Other or type unknown": 90,
    "Weapon Not Reported": 99,
}

# State FIPS: Loaded from State FIPS Lookout.csv
# Format: FIPS Code, state (e.g., "17,ILLINOIS")
STATE_FIPS = {
    "ALABAMA": 1,
    "ALASKA": 2,
    "ILLINOIS": 17,
    # ... 51 states total
}

# County FIPS: Loaded from County FIPS Lookout.csv
# Format: FIPS Code, county (e.g., "17031,Cook County")
COUNTY_FIPS = {
    "Cook County": 17031,
    "Los Angeles County": 6037,
    "Anchorage Borough": 2020,
    # ... ~3,200 counties total
}
```

### Data Preprocessing for Clustering

**Note:** With the custom clustering algorithm, we do NOT need to compute MAP's `murdgrp1` and `murdgrp2` variables. Instead, we store the necessary data for flexible clustering:

**Required Transformations:**

```python
# Store numeric codes for algorithm efficiency
vic_sex_code: int  # 1=Male, 2=Female, 9=Unknown
weapon_code: int   # 11-99 (see weapon code mapping)
county_fips: int   # Numeric FIPS from lookup table
latitude: float    # From US County Centroids.csv
longitude: float   # From US County Centroids.csv

# Keep original labels for display
cntyfips_label: str    # "Anchorage, AK"
weapon_label: str      # "Strangulation - hanging"
vic_sex_label: str     # "Female"
```

**Geographic Data Enrichment:**

During import, join with `US County Centroids.csv` to add latitude/longitude to each case:

```python
# Pseudocode for import process
for case in csv_rows:
    # Map county label to FIPS code
    county_fips = lookup_county_fips(case.CNTYFIPS)

    # Get county centroid for geographic clustering
    centroid = lookup_county_centroid(county_fips)

    # Store both in database
    case.county_fips_code = county_fips
    case.latitude = centroid.latitude
    case.longitude = centroid.longitude
```

This enables both county-based and radius-based clustering without computing rigid MURDGRP codes.

### NULL Value Handling

The following rules apply when data is missing or invalid:

| Field | NULL Condition | Behavior |
|-------|---------------|----------|
| VicAge | Value = 999 | Stored as 999, excluded from age range filters unless "Include Unknown" checked |
| VicSex | Value = "Unknown" | Stored as-is, vic_sex_code = 9, included in clustering with reduced weight |
| CNTYFIPS | FIPS lookup fails | county_fips_code = NULL, logged as warning, case excluded from geographic clustering |
| Latitude/Longitude | No centroid found for county_fips | Both = NULL, case excluded from radius-based clustering; county-based uses county_fips_code directly (no coordinates needed) |
| Weapon | Empty or unrecognized | weapon_code = 99 (Other/Unknown), case included in analysis |
| Month | Unrecognized string | month = NULL, logged as error, row still imported |
| Solved | Not "Yes" or "No" | solved = NULL, excluded from solve rate calculations |

Cases with NULL clustering fields are:
- **Included** in browse/filter views
- **Excluded** from cluster analysis (with warning count shown)
- **Searchable** via explicit "Unknown/Missing" filter options

---

## Core Algorithm: MAP Cluster Detection

The MAP algorithm identifies suspicious clusters of unsolved murders. This is the core analytical feature of the application.

### Algorithm Logic (from `Algorithm.pdf`)

**Clustering Variables:**

```text
MURDGRP1 = (COUNTY_FIPS * 1000) + (VICTIM_SEX_CODE * 100) + WEAPON_CODE
MURDGRP2 = (MSA_FIPS * 1000) + (VICTIM_SEX_CODE * 100) + WEAPON_CODE
```

Where:

- **COUNTY_FIPS**: 5-digit numeric county FIPS code (mapped from label)
- **MSA_FIPS**: Numeric MSA code (mapped from label) — **See note below**
- **VICTIM_SEX_CODE**: 1 = Male, 2 = Female, 9 = Unknown
- **WEAPON_CODE**: Numeric weapon code (11–99)

**Filtering Criteria:**

1. Select victim sex (typically Female for initial analysis)
2. Filter clusters where solve rate ≤ 33%
3. Compute `UNSOLVED = TOTAL - SOLVED`
4. Sort by `UNSOLVED` count descending

### Custom Clustering Algorithm (Approved Approach)

**Decision:** Build a **custom clustering algorithm** that provides more flexibility than the rigid MAP formula. This approach:

1. **Eliminates MSA FIPS dependency** - no need to source Census Bureau CBSA data
2. **Provides richer pattern detection** - considers more factors than just county/weapon/sex
3. **More intuitive for users** - easier to understand and configure than numeric MURDGRP codes
4. **Geographically flexible** - can cluster by county, proximity radius, or custom regions

**Custom Clustering Factors:**

The algorithm will group cases based on configurable similarity thresholds across multiple dimensions:

| Factor | Weight (Default) | Configuration Options |
|--------|------------------|----------------------|
| Geographic proximity | 35% | County match OR within N miles radius |
| Weapon type match | 25% | Exact match or category match (all firearms, etc.) |
| Victim sex match | 20% | Male/Female/Unknown exact match |
| Victim age similarity | 10% | Within ±N years range |
| Temporal proximity | 7% | Within N years/months window |
| Victim race match | 3% | Exact match (optional weight) |

**Note:** These weights are used for *cluster detection* (grouping similar unsolved cases). The "Find Similar Cases" feature (F4) uses slightly different weights optimized for *case-to-case comparison*. See F4.1 for those weights.

**Similarity Scoring Formula:**

The similarity score between two cases is calculated as:

```python
def calculate_similarity(case_a, case_b, weights):
    """
    Calculate weighted similarity score between two cases.
    Returns score from 0-100 where 100 = identical on all factors.
    """
    scores = {}

    # Geographic proximity (35% default weight)
    if case_a.county_fips == case_b.county_fips:
        scores['geographic'] = 100
    elif haversine_distance(case_a, case_b) <= radius_miles:
        scores['geographic'] = max(0, 100 - (distance / radius_miles * 50))
    else:
        scores['geographic'] = 0

    # Weapon match (25% default weight)
    if case_a.weapon_code == case_b.weapon_code:
        scores['weapon'] = 100
    elif same_weapon_category(case_a.weapon_code, case_b.weapon_code):
        scores['weapon'] = 70  # Same category (e.g., all firearms)
    else:
        scores['weapon'] = 0

    # Victim sex match (20% default weight)
    scores['victim_sex'] = 100 if case_a.vic_sex == case_b.vic_sex else 0

    # Victim age similarity (10% default weight)
    if case_a.vic_age == 999 or case_b.vic_age == 999:
        scores['victim_age'] = 50  # Neutral score for unknown
    else:
        age_diff = abs(case_a.vic_age - case_b.vic_age)
        scores['victim_age'] = max(0, 100 - (age_diff * 5))  # -5 per year diff

    # Temporal proximity (7% default weight)
    year_diff = abs(case_a.year - case_b.year)
    scores['temporal'] = max(0, 100 - (year_diff * 10))  # -10 per year

    # Victim race match (3% default weight)
    scores['victim_race'] = 100 if case_a.vic_race == case_b.vic_race else 0

    # Weighted average
    total = sum(scores[k] * weights[k] for k in scores)
    max_possible = sum(weights.values()) * 100
    return round(total / max_possible * 100, 1)
```

**Weapon Categories for Partial Matching:**
- Firearms: Handgun, Rifle, Shotgun, Other gun, Firearm type not stated (codes 11-15)
- Sharp: Knife or cutting instrument (code 20)
- Blunt: Blunt object (code 30)
- Personal: Personal weapons/beating (code 40)
- Asphyxiation: Strangulation, Asphyxiation (codes 80, 85)
- Other: All remaining codes

**Cluster Detection Process:**

1. **Filter by solved status:** Focus on unsolved cases (or user-selected subset)
2. **Geographic grouping:** Group cases by county OR custom radius from centroid
3. **Pattern matching:** Within each geographic group, identify cases with matching characteristics
4. **Threshold application:** Cluster must have minimum N cases (default: 5) with similarity score ≥ threshold
5. **Solve rate filter:** Flag clusters where solve rate ≤ 33% (user-adjustable)
6. **Ranking:** Sort by unsolved case count and average similarity score

**Advantages Over MAP Algorithm:**

- **Flexible weighting:** Users can adjust importance of each factor in Settings
- **Multi-modal geography:** Support county-level OR radius-based clustering
- **Temporal analysis:** Include time windows (e.g., "within 2 years") for active period detection
- **Easier validation:** Intuitive factors that can be manually verified
- **Better UX:** Clear explanations of why cases are clustered together

### Implementation Requirements

1. **Data Pipeline:**
   - Load FIPS lookup tables (`State FIPS Lookout.csv`, `County FIPS Lookout.csv`)
   - Load county centroids (`US County Centroids.csv`) for distance calculations
   - Store both original labels AND numeric codes in database
   - **No MURDGRP1/MURDGRP2 computation needed** - using custom algorithm instead

2. **Clustering Algorithm (Python):**
   - Implement custom similarity scoring function using weighted factors
   - Support county-based grouping (fast) and radius-based grouping (flexible)
   - Calculate pairwise case similarity within geographic groups
   - Identify clusters using minimum similarity threshold and case count
   - Calculate cluster statistics: total cases, solved count, solve rate, date range
   - Rank clusters by unsolved count and average similarity score

3. **API Endpoints:**
   - `POST /clusters/analyze` - Run clustering with configurable parameters:
     - `geographic_mode`: "county" or "radius" (default: "county")
     - `radius_miles`: For radius mode (default: 50)
     - `min_cluster_size`: Minimum cases per cluster (default: 5)
     - `max_solve_rate`: Maximum solve rate to flag (default: 0.33)
     - `victim_sex`: Filter by sex (default: "Female")
     - `weights`: Custom factor weights (optional)
   - `GET /clusters/{cluster_id}/cases` - Get all cases in a cluster
   - `GET /clusters/export` - Export cluster analysis results to CSV

4. **Frontend Display:**
   - Cluster results table with sortable columns
   - Show cluster characteristics: location, weapon, victim profile, date range
   - Display similarity score and contributing factors for each cluster
   - Drill-down to view all cases within cluster
   - Highlight matching attributes between cases in cluster view  

---

## Functional Requirements

### F1: Data Management

#### F1.1: Initial Database Setup (First Run)

On first application launch, the bundled CSV data is loaded into a local SQLite database:

- Load bundled `Murder Data SHR65 2023.csv` into SQLite database with proper indexing
- Load FIPS lookup tables (`State FIPS Lookout.csv`, `County FIPS Lookout.csv`)
- Load county centroids (`US County Centroids.csv`) and join with cases
- Apply all data transformations (see Data Transformation Requirements)
- Create computed columns: decade, numeric month, victim sex code, weapon code, county FIPS
- Add geographic columns: latitude, longitude (from county centroid lookup)
- Store both original labels and numeric codes for all mapped fields
- **Note:** No MURDGRP1/MURDGRP2 computation needed (using custom clustering algorithm)
- Estimated initial setup time: **< 60 seconds** for full dataset
- Database stored in user's application data directory
- Show progress indicator during initial setup
- Log any rows that fail transformation with reason

**Interrupted Setup Handling:**

- Database setup is atomic: uses transactions with rollback on failure
- On application restart, check for database metadata table with `setup_complete` flag
- If database exists but setup is incomplete (`setup_complete=0`), delete and restart import
- If import fails, show error dialog with option to view logs and retry
- Progress is shown with: "Setting up database... Processing X of 894,636 records (Y%)"

#### F1.2: Data Indexing

Create indexes on frequently queried columns:

- State  
- Year  
- Solved  
- VicSex  
- VicRace  
- VicAge  
- Weapon  
- CNTYFIPS  
- MSA  
- county_fips_code (numeric)
- latitude
- longitude
- weapon_code
- vic_sex_code

---

### F2: Filtering & Search

#### F2.1: Primary Filters

- State — Multi-select dropdown (51 options)  
- Year Range — Slider or dual date picker (1976–2023)  
- Solved Status — Radio buttons (All / Solved / Unsolved)  
- Agency Type — Multi-select  

#### F2.2: Victim Filters

- Age Range — Min/max numeric input (0–99)
  - **VicAge=999 Handling:** Unknown ages (999) are excluded from age range filters by default
  - Separate "Unknown Age" checkbox to explicitly include VicAge=999 records
- Sex — Checkboxes (Male / Female / Unknown)
- Race — Multi-select
- Ethnicity — Multi-select  

#### F2.3: Crime Filters

- Weapon Category — Multi-select (18 options)  
- Relationship — Multi-select (28 options)  
- Circumstance — Multi-select  
- Situation — Multi-select (single/multiple victim/offender)  

#### F2.4: Geographic Filters

- County — Searchable dropdown  
- MSA / Metropolitan Area — Searchable dropdown  

#### F2.5: Text Search

- Search case ID (exact match)
- Search Agency name (substring match, case-insensitive)
- Full-text search across circumstance descriptions using SQLite FTS5
  - Index fields: `Circumstance`, `Subcircum`, `Relationship`
  - Search syntax: Standard FTS5 query syntax (phrase queries with "", AND/OR/NOT operators)
  - Configuration: `CREATE VIRTUAL TABLE cases_fts USING fts5(circumstance, subcircum, relationship, content=cases)`  

#### F2.6: Result Set Management

- Default page size: 100 rows
- Maximum rows per request: 10,000
- Use TanStack Virtual for table virtualization
- Implement cursor-based pagination for consistent results
- Display total count for current filter selection

**Large Result Set Handling:**

- Show warning modal if result set exceeds 50,000 rows:
  - Warning: "This query returned 262,179 results. Large result sets may impact performance. Consider narrowing your filters."
  - Options: "Proceed Anyway" or "Refine Filters"
- No hard limit enforced - users can proceed past warning
- Query timeout: 30 seconds (enforced via SQLite `PRAGMA busy_timeout = 30000`)
- If timeout occurs, cancel query and show: "Query took too long. Try narrowing your filters to reduce results."

---

### F3: Cluster Analysis (Core Feature)

#### F3.1: Cluster Detection Dashboard

- Run custom clustering algorithm on current filtered results
- Display ranked list of suspicious clusters
- Show for each cluster:
  - Geographic location (County name or "Within 50mi of X County")
  - Primary victim demographic (sex, age range)
  - Primary weapon type(s)
  - Total cases in cluster
  - Solved cases
  - Unsolved cases
  - Solve rate percentage
  - Average similarity score (0-100%)
  - Date range (first to last case)
  - Top matching factors (e.g., "Same weapon: 100%, Same county: 100%, Age within ±5y: 87%")  

#### F3.2: Cluster Configuration

**Geographic Mode:**
- County-based clustering (fast, groups by county boundaries)
- Radius-based clustering (flexible, groups cases within N miles)
- Adjustable radius (default: 50 miles)

**Detection Thresholds:**
- Maximum solve rate to flag (default: ≤33%)
- Minimum cluster size (default: ≥5 cases)
- Minimum similarity score (default: 60%)

**Filters:**
- Victim sex (Male / Female / Unknown / All)
- Date range for analysis
- Weapon categories to include/exclude

**Advanced Settings (Phase 4):**
- Adjust factor weights (geographic, weapon, victim demographics, temporal)
- Custom similarity threshold per factor
- Export and import clustering configurations  

#### F3.3: Cluster Drill-Down

- Click cluster to view all cases within it
- Timeline visualization of cases in cluster
- Map view of cases (using county/MSA centroids)
- Export cluster cases to CSV

#### F3.4: Cluster Result Persistence

**Persistence Model:**
- Cluster analysis results are **session-ephemeral** by default
- Results stored in `cluster_results` and `cluster_membership` tables
- Previous results are cleared when new analysis is run
- **Save Analysis** button allows naming and persisting a specific analysis
- Saved analyses remain until explicitly deleted by user

**Saved Analysis Includes:**
- Configuration parameters used (geographic mode, thresholds, filters)
- Full cluster results with membership
- Timestamp of analysis
- User-provided name and optional description

**Storage Limits:**
- Maximum 50 saved analyses per user
- Oldest auto-deleted when limit exceeded (with warning)

---

### F4: Case Similarity Detection (Advanced Feature)

#### F4.1: "Find Similar Cases" Function

Given a selected case, find other cases with similar characteristics.

**Similarity Factors (weighted):**

| Factor | Weight | Rationale |
|--------|--------|-----------|
| Same victim sex | Required | Primary demographic filter |
| Same weapon category | 30 | Strong indicator of MO pattern |
| Geographic proximity (same county/MSA) | 25 | Serial offenders often operate in defined areas |
| Similar victim age (±10 years) | 20 | Victim selection pattern |
| Temporal proximity (within 5 years) | 15 | Active period clustering |
| Same victim race | 5 | Secondary demographic indicator |
| Same circumstance category | 3 | Contextual pattern |
| Same relationship type | 2 | Contextual pattern |

**Note:** Weights are initial estimates based on criminological research patterns. Users can adjust weights in Settings (Phase 4). Future versions may implement ML-based weight optimization.

#### F4.2: Similarity Algorithm

- Compute weighted scoring based on factors above
- Return top N most similar cases (default: 50)
- Display similarity score (0–100%)  
- Highlight matching attributes  

#### F4.3: Similar Case Output

- List of similar cases with scores  
- Visual comparison table  
- Option to create ad-hoc cluster from selected cases  

---

### F5: Visualizations

#### F5.1: Map View

**Implementation Note:** The data schema contains NO latitude/longitude fields. Map visualization will use:

- County centroids (from `US County Centroids.csv` lookup table with latitude/longitude)
- MSA centroids for metropolitan area views (future phase - requires MSA FIPS mapping)
- State-level aggregation for overview maps

**Features:**
- Plot case counts on interactive map using county/MSA centroids
- Choropleth visualization showing case density by geography
- Cluster markers for county/MSA level aggregations  
- Color code by: solved status, victim sex, weapon type, or decade  
- Click marker to see aggregated statistics and drill down to cases
- Filter map to current query results  

#### F5.2: Timeline View

- Horizontal timeline of cases  
- Filterable by current query  
- Color code by attribute  
- Zoom to year/decade level  
- Show density/frequency  

#### F5.3: Statistical Charts

- Solve Rate by Year — Line chart showing trend  
- Victim Demographics — Pie/bar charts (sex, race, age distribution)  
- Weapon Distribution — Bar chart  
- Circumstances Breakdown — Bar chart  
- Geographic Distribution — Choropleth map by state  
- Monthly Patterns — Seasonal analysis  

#### F5.4: Cluster Visualization

- Network graph showing cluster relationships  
- Heatmap of clusters by geography and weapon  
- Scatter plot: cluster size vs. solve rate  

---

### F6: Case Management

#### F6.1: Case Detail View

- Full case information display  
- All fields formatted clearly  
- Link to "Find Similar Cases"  
- Add to custom case list  

#### F6.2: Case Lists / Collections

- Save filtered results as named collection  
- Create manual case lists  
- Compare multiple cases side-by-side  
- Add notes to cases (stored locally)  

#### F6.3: Export

- Export filtered results to CSV  
- Export cluster analysis results  
- Export case comparison reports  
- Export visualizations as PNG  

---

### F7: Application Features

#### F7.1: Query History

- Save recent searches  
- Save named queries for reuse  
- Quick filters (preset queries)  

#### F7.2: Settings

- Dark mode / light mode toggle  
- Adjust similarity weights  
- Configure default filters  
- Set default cluster thresholds  

---

## Technical Architecture

### Chosen Stack: Electron + React + Python

This architecture ensures a professional, native-application feel while leveraging Python's robust data science capabilities for the large dataset and analysis algorithms.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ELECTRON MAIN PROCESS                           │
├─────────────────────────────────────────────────────────────────────────┤
│  • Window management                                                     │
│  • Python process lifecycle (spawn, monitor, restart, kill)             │
│  • IPC message routing                                                   │
│  • Native dialogs (file open, save)                                     │
│  • System tray / dock integration                                        │
└────────────────────────┬───────────────────────────────────────────────┘
                         │ IPC
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ELECTRON RENDERER (REACT)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  State Layer:                                                            │
│  ├── Zustand (UI state, filter selections)                              │
│  └── TanStack Query (server state, caching, sync)                       │
│                                                                          │
│  UI Layer:                                                               │
│  ├── Filter Panel (src/components/filters/)                             │
│  ├── Data Grid (TanStack Table with virtual scrolling)                  │
│  ├── Map View (MapLibre GL JS)                                          │
│  ├── Charts (Recharts)                                                  │
│  └── Case Detail Modal                                                   │
└────────────────────────┬───────────────────────────────────────────────┘
                         │ HTTP (localhost:5xxx)
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PYTHON BACKEND (FastAPI)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  API Routes:                                                             │
│  ├── /cases - CRUD, filtering, pagination                               │
│  ├── /clusters - Run MAP algorithm, get results                         │
│  ├── /similarity - Find similar cases                                   │
│  ├── /stats - Aggregations for charts                                   │
│  └── /health - Liveness check                                           │
│                                                                          │
│  Data Layer:                                                             │
│  ├── SQLite (homicides.db)                                              │
│  ├── Pandas (complex aggregations)                                      │
│  └── NumPy/Scikit-learn (similarity scoring)                            │
│                                                                          │
│  Bundled Data (in resources/):                                           │
│  ├── Murder Data SHR65 2023.csv (primary dataset)                       │
│  ├── UCR 2023 Data.csv (agency statistics)                              │
│  ├── State FIPS Lookout.csv (state → FIPS mapping)                      │
│  └── County FIPS Lookout.csv (county → FIPS mapping)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Project Structure

```text
project-root/
├── package.json              # Node dependencies (Electron, React)
├── electron/                 # Electron Main Process
│   ├── main.js               # Window management & startup
│   ├── preload.js            # IPC Bridge
│   └── python-manager.js     # Python lifecycle management
├── src/                      # React Renderer Process (Frontend)
│   ├── components/           # UI Components
│   │   ├── filters/          # Filter panels
│   │   ├── visuals/          # Maps & Charts
│   │   └── Layout.jsx
│   ├── stores/               # Zustand state stores
│   ├── services/             # API calls to Python backend
│   └── App.jsx
├── backend/                  # Python Backend (Server-side logic)
│   ├── app.py                # FastAPI entry point
│   ├── database.py           # SQLite connection & queries
│   ├── analysis/
│   │   ├── clustering.py     # MAP algorithm logic
│   │   └── similarity.py     # Case matching logic
│   └── requirements.txt      # Python dependencies
├── resources/                # Bundled data files
│   ├── Murder Data SHR65 2023.csv
│   ├── UCR 2023 Data.csv
│   ├── State FIPS Lookout.csv
│   ├── County FIPS Lookout.csv
│   └── US County Centroids.csv
└── data/                     # User data directory (created at runtime)
    └── homicides.db          # SQLite Database (generated on first run)
```

### Backend Process Management

#### Startup Sequence

1. Electron main process spawns Python as child process
2. Python selects available port (5000-5099 range)
3. Python writes selected port to stdout
4. Electron reads port and configures API base URL
5. Electron polls `/health` endpoint until ready (max 10s)
6. If ready, renderer process can start making API calls

#### Error Handling

- If Python fails to start within 10s, show error dialog with log details
- If Python crashes during operation, attempt automatic restart (max 3 attempts)
- Log all Python stderr to application log file
- Show user-friendly error message with option to view logs or restart

#### Shutdown Procedure

1. Electron sends SIGTERM to Python process
2. Python gracefully closes database connections
3. Wait up to 5s for clean shutdown
4. Force kill if unresponsive after timeout

### Database Design

```sql
-- Main cases table
CREATE TABLE cases (
    id TEXT PRIMARY KEY,
    cntyfips TEXT,           -- Original label from CSV
    county_fips_code INTEGER, -- Numeric FIPS code (mapped)
    ori TEXT,
    state TEXT,
    agency TEXT,
    agentype TEXT,
    source TEXT,
    solved INTEGER,          -- 0=No, 1=Yes (transformed from Yes/No)
    year INTEGER,
    month INTEGER,           -- 1-12 numeric (transformed from month name)
    month_name TEXT,         -- Original month name
    incident INTEGER,
    action_type TEXT,
    homicide TEXT,
    situation TEXT,
    vic_age INTEGER,
    vic_sex TEXT,            -- Original text: Male/Female/Unknown
    vic_sex_code INTEGER,    -- 1=M, 2=F, 9=U (for algorithm)
    vic_race TEXT,
    vic_ethnic TEXT,
    off_age INTEGER,
    off_sex TEXT,
    off_race TEXT,
    off_ethnic TEXT,
    weapon TEXT,             -- Original text label
    weapon_code INTEGER,     -- Numeric code 11-99 (for algorithm)
    relationship TEXT,
    circumstance TEXT,
    subcircum TEXT,
    vic_count INTEGER,
    off_count INTEGER,
    file_date TEXT,
    msa TEXT,                -- Original label from CSV
    msa_fips_code INTEGER,   -- Reserved for future use (NULL in MVP)
    decade INTEGER,
    latitude REAL,           -- County centroid latitude for geographic clustering
    longitude REAL           -- County centroid longitude for geographic clustering
);

-- Indexes for performance
CREATE INDEX idx_state ON cases(state);
CREATE INDEX idx_year ON cases(year);
CREATE INDEX idx_solved ON cases(solved);
CREATE INDEX idx_vic_sex ON cases(vic_sex);
CREATE INDEX idx_vic_race ON cases(vic_race);
CREATE INDEX idx_weapon ON cases(weapon);
CREATE INDEX idx_cntyfips ON cases(cntyfips);
CREATE INDEX idx_msa ON cases(msa);
CREATE INDEX idx_vic_age ON cases(vic_age);
CREATE INDEX idx_county_fips_code ON cases(county_fips_code);
CREATE INDEX idx_latitude ON cases(latitude);
CREATE INDEX idx_longitude ON cases(longitude);
CREATE INDEX idx_weapon_code ON cases(weapon_code);
CREATE INDEX idx_vic_sex_code ON cases(vic_sex_code);

-- User collections table
CREATE TABLE collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection membership
CREATE TABLE collection_cases (
    collection_id INTEGER,
    case_id TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, case_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id),
    FOREIGN KEY (case_id) REFERENCES cases(id)
);

-- Case notes
CREATE TABLE case_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);

-- Saved queries
CREATE TABLE saved_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    filters_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cluster results table (populated by Python clustering algorithm)
CREATE TABLE cluster_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id TEXT NOT NULL,          -- UUID for this cluster
    analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    geographic_mode TEXT,              -- "county" or "radius"
    config_json TEXT,                  -- Full configuration used for this analysis
    location_description TEXT,         -- e.g., "Cook County, IL" or "Within 50mi of Cook County"
    total_cases INTEGER,
    solved_cases INTEGER,
    unsolved_cases INTEGER,
    solve_rate REAL,
    avg_similarity_score REAL,         -- Average similarity score (0-100)
    first_year INTEGER,
    last_year INTEGER,
    primary_weapon TEXT,               -- Most common weapon in cluster
    primary_victim_sex TEXT,           -- Most common victim sex
    avg_victim_age REAL                -- Average victim age in cluster
);

-- Cluster membership (links cases to clusters)
CREATE TABLE cluster_membership (
    cluster_id TEXT NOT NULL,
    case_id TEXT NOT NULL,
    similarity_score REAL,             -- This case's similarity score to cluster centroid
    PRIMARY KEY (cluster_id, case_id),
    FOREIGN KEY (cluster_id) REFERENCES cluster_results(cluster_id),
    FOREIGN KEY (case_id) REFERENCES cases(id)
);

-- Saved cluster analyses (for F3.4 persistence)
CREATE TABLE saved_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    config_json TEXT NOT NULL,          -- Full configuration used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link saved analyses to their cluster results
CREATE TABLE saved_analysis_clusters (
    saved_analysis_id INTEGER,
    cluster_id TEXT,
    PRIMARY KEY (saved_analysis_id, cluster_id),
    FOREIGN KEY (saved_analysis_id) REFERENCES saved_analyses(id) ON DELETE CASCADE,
    FOREIGN KEY (cluster_id) REFERENCES cluster_results(cluster_id)
);
```

### Key Dependencies

**Python Backend:**

- `fastapi` (API Server)  
- `uvicorn` (ASGI Server)
- `pandas` (Data manipulation)  
- `numpy` (Math)  
- `scikit-learn` (Similarity/Clustering)  
- `sqlite3` (Built-in)  

**Frontend (React/Node):**

- `electron`  
- `react`, `react-dom`  
- `zustand` (Global state management)
- `@tanstack/react-query` (Server state management)
- `@tanstack/react-table` (Data tables with virtual scrolling)
- `@tanstack/react-virtual` (List virtualization)
- `axios` (API requests)  
- `maplibre-gl` (Mapping - no tile server required)
- `recharts` (Statistical Charts)  

### State Management Strategy

**UI State (Zustand):**
- Filter selections
- Active tab / view state
- Modal open/close state
- Theme preference (dark/light)

**Server State (TanStack Query):**
- Query results (with caching)
- Cluster analysis results
- Case details
- Similarity search results
- Auto-refetch on filter changes
- Optimistic updates for notes/collections

---

## User Interface Design

### Layout Structure (Wireframe)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  MURDER ACCOUNTABILITY PROJECT ANALYZER              [Settings] [?] │
├─────────────────────────────────────────────────────────────────────┤
│  [Filters]  [Clusters]  [Map]  [Timeline]  [Stats]  [Case Lists]    │
├───────────────────┬─────────────────────────────────────────────────┤
│                   │                                                 │
│  FILTER PANEL     │              MAIN CONTENT AREA                  │
│  ─────────────    │                                                 │
│                   │  Shows: Search results, cluster analysis,       │
│  State:           │  maps, charts, case details depending on        │
│  [Multi-select]   │  selected tab                                   │
│                   │                                                 │
│  Year Range:      │                                                 │
│  [1976]──[2023]   │                                                 │
│                   │                                                 │
│  Solved:          │                                                 │
│  ○ All ● Unsolved │                                                 │
│                   │                                                 │
│  Victim Sex:      │                                                 │
│  ☑ Female ☐ Male  │                                                 │
│                   │                                                 │
│  Weapon:          │                                                 │
│  [Multi-select]   │                                                 │
│                   │                                                 │
│  [+ More Filters] │                                                 │
│                   │                                                 │
│  ─────────────    │                                                 │
│  Results: 12,847  │                                                 │
│  [Apply Filters]  │                                                 │
│                   │                                                 │
└───────────────────┴─────────────────────────────────────────────────┘
```

### Cluster Analysis View

```text
┌─────────────────────────────────────────────────────────────────────┐
│  CLUSTER ANALYSIS                                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Mode: ● County-level ○ Radius (Phase 2)    Max Solve Rate: [33]%   │
│  Victim Sex: ● Female ○ Male ○ All   Min Cluster Size: [5]          │
│                                                                     │
│  [Run Analysis]                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  SUSPICIOUS CLUSTERS (47 found)                      [Export CSV]   │
├─────────────────────────────────────────────────────────────────────┤
│  #  │ Location          │ Weapon        │ Total │ Unsolved │ Rate  │
│  ─────────────────────────────────────────────────────────────────  │
│  1  │ Cook County, IL   │ Strangulation │  127  │   98     │ 22.8% │
│  2  │ Los Angeles, CA   │ Strangulation │   89  │   71     │ 20.2% │
│  3  │ Harris County, TX │ Asphyxiation  │   64  │   52     │ 18.8% │
│  4  │ Wayne County, MI  │ Strangulation │   58  │   47     │ 19.0% │
│  ...                                                                │
├─────────────────────────────────────────────────────────────────────┤
│  Click cluster to view cases │ Selected: Cook County Strangulation  │
│                                                                     │
│  CLUSTER DETAILS                                                    │
│  ────────────────                                                   │
│  Cases span: 1979 - 2019 (40 years)                                │
│  98 unsolved female strangulation homicides                         │
│                                                                     │
│  [View All Cases] [Find Similar Clusters] [Export]                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Case Detail Modal

```text
┌─────────────────────────────────────────────────────────────────────┐
│  CASE: 199203015IL01643                              [×]            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STATUS: ● UNSOLVED                                                 │
│                                                                     │
│  ┌─ INCIDENT ────────────────┐  ┌─ VICTIM ──────────────────────┐  │
│  │ Date: March 1992          │  │ Age: 24                       │  │
│  │ Agency: Chicago Police    │  │ Sex: Female                   │  │
│  │ State: Illinois           │  │ Race: Black                   │  │
│  │ County: Cook County, IL   │  │ MSA: Chicago, IL              │  │
│  └───────────────────────────┘  └───────────────────────────────┘  │
│                                                                     │
│  ┌─ OFFENDER ────────────────┐  ┌─ CRIME ───────────────────────┐  │
│  │ Age: Unknown              │  │ Weapon: Strangulation         │  │
│  │ Sex: Unknown              │  │ Relationship: Not determined  │  │
│  │ Race: Unknown             │  │ Circumstance: Undetermined    │  │
│  │ Ethnicity: Unknown        │  │ Situation: Single vic/unknown │  │
│  └───────────────────────────┘  └───────────────────────────────┘  │
│                                                                     │
│  [Find Similar Cases]  [Add to List]  [Export Case]                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Accessibility Requirements

The application must meet **WCAG 2.1 AA** compliance:

- Full keyboard navigation for all interactive elements
- Semantic HTML structure for screen reader compatibility
- Minimum color contrast ratio of 4.5:1 for text
- Focus indicators visible on all interactive elements
- Alt text for all meaningful images and visualizations
- Skip navigation links
- Proper heading hierarchy
- ARIA labels for complex UI components

### Dark Mode Design

Design tokens for both themes will be maintained:

```css
/* Light Theme */
--color-bg-primary: #ffffff;
--color-bg-secondary: #f5f5f5;
--color-text-primary: #1a1a1a;
--color-text-secondary: #666666;
--color-accent: #0066cc;
--color-solved: #28a745;
--color-unsolved: #dc3545;

/* Dark Theme */
--color-bg-primary: #1a1a1a;
--color-bg-secondary: #2d2d2d;
--color-text-primary: #f5f5f5;
--color-text-secondary: #a0a0a0;
--color-accent: #4dabf7;
--color-solved: #51cf66;
--color-unsolved: #ff6b6b;
```

### First-Run Experience

#### Welcome Flow (First Launch Only)

1. **Welcome Screen**
   - Brief introduction to the application purpose
   - "Analyzing [X] homicide records to identify patterns in unsolved cases"
   - "Setup takes about 60 seconds" notice
   - [Get Started] button

2. **Database Setup** (automatic)
   - Progress bar with percentage
   - "Processing record X of 894,636..."
   - Tip carousel during wait: "Did you know: 29.3% of homicides remain unsolved"

3. **Quick Tour** (skippable, 4 steps)
   - Step 1: "Filter Panel" - highlight left sidebar
   - Step 2: "Cluster Analysis" - highlight Clusters tab
   - Step 3: "Case Details" - show sample case modal
   - Step 4: "Export" - highlight export buttons
   - [Skip Tour] always visible

4. **Quick Start Options**
   - "Explore all unsolved cases" (pre-set filter)
   - "Run sample cluster analysis on female victims"
   - "Browse by state" (state selector)
   - "Start from scratch" (empty filters)

---

## Error Handling Requirements

### Error Types and Responses

| Error Type | User Message | Recovery Action |
|------------|--------------|-----------------|
| Database connection failed | "Unable to access database. Click Restart to try again." | Show dialog, offer restart button |
| CSV import failed (single row) | "Data import warning: Skipped row X due to invalid data." | Log error, skip row, continue import |
| CSV import failed (critical) | "Data import failed: [reason]. Please verify the CSV file." | Show dialog, abort import, offer retry |
| Query timeout (>30s) | "Query took too long. Try narrowing your filters to reduce results." | Cancel query, suggest filter adjustments |
| Python backend crash | "Analysis engine stopped unexpectedly. Restarting..." | Auto-restart (up to 3 attempts), then show error dialog |
| Network port unavailable | "Cannot start analysis engine. Port in use." | Try alternate ports, show error if all fail |
| FIPS lookup failure | "Unknown county/MSA: [label]. Case will have limited clustering." | Log warning, set FIPS to null, continue |
| Out of memory | "Insufficient memory for this operation. Try with fewer results." | Cancel operation, suggest reducing scope |

### Error Logging

All errors are logged with:
- Timestamp (ISO 8601)
- Error level (DEBUG, INFO, WARN, ERROR)
- Component/module name
- Error message
- Stack trace (for ERROR level)
- User context (active filters, operation)

---

## Data Maintenance

### Data Update Strategy

The MAP dataset is updated annually. Data updates are delivered through application updates:

#### How Updates Work
- New data is bundled with new application versions
- When the application detects updated bundled data, it rebuilds the database automatically
- User data (notes, collections, saved queries) is preserved during updates

#### Update Process
1. Application checks bundled data version against database version on startup
2. If newer data detected, shows notification: "Updated homicide data available. Database will be rebuilt."
3. Database rebuild runs with progress indicator
4. User's notes, collections, and saved queries remain intact

#### User Data Preservation
- Notes, collections, and saved queries stored in separate tables
- Automatic backup created before any database rebuild (`homicides_backup_YYYYMMDD.db`)
- Version tracking in database metadata table

---

## Logging and Diagnostics

### Application Logging

```text
Log Location: {user app data directory}/logs/
Log Format: YYYY-MM-DD HH:mm:ss.SSS [LEVEL] [component] message

Log Rotation:
- Maximum file size: 10MB
- Keep 5 rotated files
- Separate files for:
  - app.log (Electron main process)
  - renderer.log (React frontend)
  - backend.log (Python server)

Log Levels:
- DEBUG: Detailed debugging information
- INFO: General operational events
- WARN: Warning conditions (recoverable)
- ERROR: Error conditions with stack traces
```

### Diagnostic Features
- View logs from Settings > Diagnostics
- Export logs for support (zip file)
- Database integrity check command
- Performance metrics collection (query times)

---

## Testing Requirements

### Test Coverage Targets

| Component | Coverage Target |
|-----------|-----------------|
| Python backend (clustering, similarity) | 90% |
| Data transformation logic | 95% |
| React components | 80% |
| API endpoints | 90% |
| Integration tests | Core workflows covered |

### Test Types

#### Unit Tests
- Data transformation functions (all mappings)
- Clustering algorithm correctness
- Similarity scoring calculations
- Filter query generation

#### Integration Tests
- CSV import → database verification
- API endpoints → correct data returned
- Filter → query → results pipeline

#### Algorithm Validation

**Note:** Using custom clustering algorithm instead of MAP's MURDGRP formula. Validation approach:

- **Similarity scoring validation:** Test with known similar cases (same perpetrator, same location/weapon/victim profile)
- **Geographic clustering validation:** Verify distance calculations using known coordinates
- **Solve rate calculations:** Verify accuracy: `ROUND(SUM(solved) / COUNT(*) * 100, 1)`
- **Manual validation:** Spot-check known high-profile clusters:
  - Chicago strangulation cases (Cook County, female victims, strangulation weapon)
  - Los Angeles serial murder clusters
  - Other documented serial killer case series
- **Comparative validation:** Compare cluster results with MAP's published findings where available
- **Edge cases:** Test with single-case counties, missing geographic data, unknown victim demographics

#### Performance Benchmarks
- Log query execution times
- Alert if queries exceed targets
- CI/CD performance regression detection

---

## Distribution and Installation

### Target Platforms

| Platform | Format | Code Signing | Minimum Requirements |
|----------|--------|--------------|----------------------|
| macOS | DMG | Apple Developer ID ($99/year) | macOS 11+, 8GB RAM, 4GB disk |
| Windows | MSI / NSIS | EV Code Signing Certificate (~$400/year) | Windows 10+, 8GB RAM, 4GB disk |
| Linux | AppImage | GPG signature (free) | Ubuntu 20.04+, 8GB RAM, 4GB disk |

**Estimated Application Size:**

- Electron app + Python runtime: ~300-500MB
- Bundled CSV data files: ~340MB
- Total installed size: **~900MB-1GB**
- Minimum disk requirement updated to **4GB** to account for database generation and updates

### Python Bundling Strategy

Python environment bundled using PyInstaller:
- All Python dependencies frozen
- No external Python installation required
- Platform-specific binaries generated during build

### Installation Contents

```text
Application Package Contents:
├── Electron application
├── Bundled Python runtime + dependencies
├── Bundled data files:
│   ├── Murder Data SHR65 2023.csv (primary dataset)
│   ├── UCR 2023 Data.csv (agency statistics)
│   ├── State FIPS Lookout.csv
│   └── County FIPS Lookout.csv

First Run:
1. Application displays "Setting up database..." with progress
2. Database created in user's app data directory
3. All bundled data loaded and transformed
4. Application ready for use (no user action required)
```

### Auto-Update Mechanism

- Update check on startup (with user preference to disable)
- Download in background
- Install on next application restart
- Preserve user data during update

---

## Data Usage and Disclaimer

**First-Launch Acknowledgment:**

Users must acknowledge the following before accessing the application:

> **Important Notice**
>
> This application provides access to homicide data from the Murder Accountability Project for research and educational purposes.
>
> **Please understand:**
> - Clustering results indicate statistical patterns, NOT confirmed serial crimes
> - Low solve rates may reflect reporting issues, not actual patterns
> - This data should not be used to accuse or harass individuals
> - Identified patterns require professional law enforcement investigation
>
> By continuing, you acknowledge that this tool is for research purposes only and that pattern identification does not constitute evidence of criminal activity.

[I Understand] button required to proceed

---

## Implementation Phases

### Phase 1: Foundation (MVP)

**Goal:** Core functionality with cluster analysis

**MVP Scope Boundaries:**
- ✅ County-based clustering ONLY (radius-based deferred to Phase 2)
- ✅ Default similarity weights (weight customization deferred to Phase 4)
- ✅ Basic filtering (all fields) with pagination
- ✅ Cluster results table with drill-down
- ✅ CSV export for clusters and filtered results
- ❌ NO MSA-level clustering (data not available)
- ❌ NO map visualization (Phase 2)
- ❌ NO timeline view (Phase 2)
- ❌ NO case similarity "Find Similar" feature (Phase 3)

1. **Technical Setup**
   - Initialize Electron + React boilerplate
   - Set up Python FastAPI backend environment
   - Create IPC/API bridge between Electron and Python
   - Implement Python process lifecycle management

2. **Data Pipeline**
   - Bundle lookup tables with application (`State FIPS Lookout.csv`, `County FIPS Lookout.csv`, `US County Centroids.csv`)
   - Implement first-run database setup from bundled CSV (894,636 records)
   - Implement all data transformations (month names → numeric, weapon → codes, etc.)
   - Enrich cases with geographic data (latitude/longitude from county centroids)
   - Handle lookup failures gracefully (log warnings, set FIPS/coordinates to NULL)
   - Create indexes on all filterable columns including latitude/longitude
   - **No MURDGRP computation** - using custom clustering algorithm instead

3. **Basic Filtering (React)**
   - State, year range, solved status UI components
   - Victim sex, age, race UI components
   - Weapon type UI components
   - Implement pagination and virtualization

4. **Cluster Analysis (Python → React)**
   - Implement custom clustering algorithm in `clustering.py`:
     - Geographic grouping (county-based only in MVP)
     - Multi-factor similarity scoring with configurable weights
     - Cluster detection with configurable thresholds
   - Create `/clusters/analyze` API endpoint with full configuration options
   - Connect React frontend to cluster analysis API
   - Display cluster results in sortable, filterable table (TanStack Table)
   - Show similarity scores and matching factors for each cluster
   - Implement cluster drill-down (view all cases with similarity details)
   - Add CSV export for cluster results with full metadata

5. **State Management**
   - Set up Zustand for UI state
   - Set up TanStack Query for server state

### Phase 2: Visualization

**Goal:** Rich visual analysis

1. **Map Visualization**
   - Integrate MapLibre GL JS
   - Load county centroid data
   - Plot aggregated case data on map
   - Implement choropleth views

2. **Statistical Charts**
   - Integrate Recharts
   - Solve rate trends, demographic distributions

3. **Timeline View**
   - Cases over time
   - Cluster temporal analysis

### Phase 3: Advanced Analysis

**Goal:** Sophisticated pattern detection

1. **Case Similarity**
   - Implement similarity algorithm in Python
   - Weighted scoring logic
   - "Find Similar" UI flow

2. **Case Comparison**
   - Side-by-side comparison
   - Multiple case selection

### Phase 4: Polish

**Goal:** Production-ready experience

1. **UI Refinement**
   - Dark mode / Light mode implementation
   - Loading states and error boundaries
   - Accessibility audit and fixes

2. **Performance Optimization**
   - Python query optimization
   - React component memoization

3. **Distribution**
   - Package Electron executable
   - Code signing for all platforms
   - Installer creation
   - Auto-update mechanism

---

## Success Criteria

### Performance Targets

| Operation Type | Target |
|----------------|--------|
| Data load (full CSV) | < 60 seconds |
| Single filter query | < 500ms |
| Multi-filter query (3-5 filters) | < 2 seconds |
| Full-text search | < 3 seconds |
| Cluster analysis (full dataset) | < 5 seconds |
| Similarity search (top 50) | < 3 seconds |

### Functional Criteria

- [ ] Load full dataset successfully
- [ ] All 18 weapon types correctly categorized and coded
- [ ] All 51 states represented
- [ ] FIPS code mapping successful for >99% of records
- [ ] Solve rate calculations match MAP methodology
- [ ] Export produces valid CSV

### User Experience

- [ ] Intuitive filter interface
- [ ] Clear cluster analysis results
- [ ] Responsive map visualization (county-level)
- [ ] Case details easily accessible
- [ ] Works offline (local data)
- [ ] Keyboard accessible
- [ ] Screen reader compatible

### Analysis Quality

- [ ] Identifies known high-risk clusters (validate against MAP published results)
- [ ] Similarity detection produces relevant matches
- [ ] Statistical summaries are accurate
- [ ] Export data is complete and usable

---

## Appendix A: Weapon Code Mapping

For clustering algorithm, convert weapon strings to numeric codes:

| Weapon                                | Code |
|---------------------------------------|------|
| Firearm, type not stated              | 11   |
| Handgun - pistol, revolver, etc       | 12   |
| Rifle                                 | 13   |
| Shotgun                               | 14   |
| Other gun                             | 15   |
| Knife or cutting instrument           | 20   |
| Blunt object - hammer, club, etc      | 30   |
| Personal weapons, includes beating    | 40   |
| Poison - does not include gas         | 50   |
| Pushed or thrown out window           | 55   |
| Explosives                            | 60   |
| Fire                                  | 65   |
| Narcotics or drugs, sleeping pills    | 70   |
| Drowning                              | 75   |
| Strangulation - hanging               | 80   |
| Asphyxiation - includes death by gas  | 85   |
| Other or type unknown                 | 90   |
| Weapon Not Reported                   | 99   |

---

## Appendix B: Key Statistics Reference

| Metric           | Value                  |
|------------------|------------------------|
| Total Records    | 894,636                |
| Date Range       | 1976–2023              |
| Unique States    | 51                     |
| Unique Counties  | 3,079                  |
| Unique MSAs      | 409                    |
| Solved Cases     | 632,457 (70.7%)        |
| Unsolved Cases   | 262,179 (29.3%)        |
| Male Victims     | ~79%                   |
| Female Victims   | ~21%                   |
| Top Weapon       | Handgun (~51%)         |

---

## Appendix C: UCR Dataset Usage

The `UCR 2023 Data.csv` file contains agency-level aggregate statistics. **This dataset is NOT required for MVP** and will be integrated in a future phase.

**Future Use Cases:**

1. **Agency Benchmarking**: Compare individual agency solve rates against national/state averages
2. **Clearance Rate Validation**: Cross-reference cluster solve rates with UCR statistics
3. **Context Display**: Show agency-level context when viewing cases
4. **Anomaly Detection**: Flag agencies with solve rates significantly below benchmarks

**Schema Documentation Required:** Before implementing UCR integration, document:

- CSV column headers and data types
- Join key (likely ORI code or Agency name)
- Data coverage and completeness
- Aggregation methodology

---

## Appendix D: Case Linking vs. Matching

Per `Murder Accountability Project Map Link.pdf`:

- **Linked Cases**: Multiple victim records from the same incident (same ID prefix, different victim counts)
- **Matched Cases**: Separate incidents with similar characteristics (identified by similarity algorithm)

The application distinguishes between:
1. Incident linking (automatic, based on ID structure)
2. Pattern matching (user-initiated, via similarity search)

---

## Document Change Log

### Version 2.3 - November 2025

**Final Pre-Implementation Cleanup:**

1. Removed outdated MSA FIPS reference in data transformation section
2. Removed msa_fips_code from indexing list (index was already removed)
3. Clarified NULL lat/long handling for county-based clustering
4. Added US County Centroids.csv to project structure resources
5. Updated cluster analysis wireframe to show "Radius (Phase 2)" instead of "MSA-level"
6. Aligned Phase 1 clustering description with MVP scope (county-based only)
7. Fixed typo: "~1KB app" → "~1GB app"
8. Added saved_analyses and saved_analysis_clusters tables for F3.4 persistence
9. Added clarifying note distinguishing cluster detection weights from case similarity weights

**Document is now ready for implementation.**

### Version 2.2 - November 2025

**Updates Based on Comprehensive PRD Review:**

1. **Added User Personas** - Four detailed personas: Criminology Grad Student (primary), Investigative Journalist, Law Enforcement Liaison, True Crime Enthusiast
2. **Added User Stories** - 23 prioritized user stories covering core workflows
3. **Added NULL Value Handling** - Explicit behavior for missing/unknown data
4. **Added Similarity Scoring Formula** - Pseudocode implementation with weapon categories
5. **Clarified MVP Scope** - Explicit boundaries for Phase 1 deliverables
6. **Added Cluster Persistence Model** - Session-ephemeral default with save option
7. **Added Onboarding Flow** - First-run experience with welcome, setup, and tour
8. **Added Data Disclaimer** - Required acknowledgment for responsible use
9. **Fixed MSA FIPS References** - Removed index, marked column as future use
10. **Updated Version** - 2.1 → 2.2

### Version 2.1 - November 2025

**Major Updates Based on Data File Inspection:**

1. **Data Format Verification (RESOLVED)**
   - Confirmed CSV format: `CNTYFIPS` contains labels like "Anchorage, AK" (not numeric FIPS)
   - Confirmed lookup table formats match PRD specifications
   - Verified `murdgrp1` and `murdgrp2` columns DO NOT exist in CSV - must be computed

2. **Missing Data Sources (RESOLVED)**
   - `State FIPS Lookout.csv`: Confirmed present, format verified
   - `County FIPS Lookout.csv`: Confirmed present, format verified
   - `US County Centroids.csv`: **Located and added to PRD** - provides lat/long for map visualization
   - MSA FIPS lookup: **Not provided** - decided to skip MSA clustering in MVP

3. **Technical Specifications Added**
   - **Full-Text Search:** Added SQLite FTS5 configuration details
   - **VicAge=999 Handling:** Unknown ages excluded from range filters by default, separate checkbox for explicit inclusion
   - **Query Timeout:** 30-second timeout via SQLite `PRAGMA busy_timeout = 30000`
   - **Large Result Warning:** No hard limit, users can proceed past 50,000 row warning
   - **Interrupted Setup:** Atomic database transactions with `setup_complete` flag and restart logic

4. **MVP Scope Clarification**
   - **County-level clustering only** (`MURDGRP1`) for MVP
   - MSA-level clustering (`MURDGRP2`) deferred to Phase 2+ (requires MSA FIPS sourcing)
   - UCR dataset integration deferred to future phase
   - Algorithm validation approach documented (no MAP reference results available)

5. **Distribution Requirements**
   - Updated disk requirement: 2GB → **4GB** (accounts for ~1GB app + database + updates)
   - Code signing costs documented: Apple $99/year, Windows EV ~$400/year
   - Application size estimate: ~900MB-1GB installed

6. **Clustering Algorithm Decision**
   - **Approved:** Custom clustering algorithm with configurable multi-factor similarity scoring
   - Advantages: More flexible, eliminates MSA FIPS dependency, better UX
   - No MURDGRP1/MURDGRP2 computation needed
   - Geographic data enrichment using county centroids (latitude/longitude)

**All critical blocking issues from PRD-Review.md have been resolved.**

---

**Document Version:** 2.3
**Created:** November 2025
**Updated:** November 2025 (final pre-implementation cleanup)
**For use with Claude Code**
