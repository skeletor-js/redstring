"""Database schema creation and management for Redstring.

Defines all table schemas, indexes, and provides functions to initialize
the database structure. Tables are created with IF NOT EXISTS for idempotency.
"""

import logging

from database.connection import get_db_connection

logger = logging.getLogger(__name__)

# =============================================================================
# TABLE CREATION SQL
# =============================================================================

CREATE_METADATA_TABLE = """
CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);
"""

CREATE_CASES_TABLE = """
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    cntyfips TEXT,
    county_fips_code INTEGER,
    ori TEXT,
    state TEXT,
    agency TEXT,
    agentype TEXT,
    source TEXT,
    solved INTEGER,
    year INTEGER,
    month INTEGER,
    month_name TEXT,
    incident INTEGER,
    action_type TEXT,
    homicide TEXT,
    situation TEXT,
    vic_age INTEGER,
    vic_sex TEXT,
    vic_sex_code INTEGER,
    vic_race TEXT,
    vic_ethnic TEXT,
    off_age INTEGER,
    off_sex TEXT,
    off_race TEXT,
    off_ethnic TEXT,
    weapon TEXT,
    weapon_code INTEGER,
    relationship TEXT,
    circumstance TEXT,
    subcircum TEXT,
    vic_count INTEGER,
    off_count INTEGER,
    file_date TEXT,
    msa TEXT,
    msa_fips_code INTEGER,
    decade INTEGER,
    latitude REAL,
    longitude REAL
);
"""

CREATE_COLLECTIONS_TABLE = """
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_COLLECTION_CASES_TABLE = """
CREATE TABLE IF NOT EXISTS collection_cases (
    collection_id INTEGER,
    case_id TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, case_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);
"""

CREATE_CASE_NOTES_TABLE = """
CREATE TABLE IF NOT EXISTS case_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);
"""

CREATE_SAVED_QUERIES_TABLE = """
CREATE TABLE IF NOT EXISTS saved_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    filters_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_CLUSTER_RESULTS_TABLE = """
CREATE TABLE IF NOT EXISTS cluster_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id TEXT NOT NULL UNIQUE,
    analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    geographic_mode TEXT,
    config_json TEXT,
    location_description TEXT,
    total_cases INTEGER,
    solved_cases INTEGER,
    unsolved_cases INTEGER,
    solve_rate REAL,
    avg_similarity_score REAL,
    first_year INTEGER,
    last_year INTEGER,
    primary_weapon TEXT,
    primary_victim_sex TEXT,
    avg_victim_age REAL
);
"""

CREATE_CLUSTER_MEMBERSHIP_TABLE = """
CREATE TABLE IF NOT EXISTS cluster_membership (
    cluster_id TEXT NOT NULL,
    case_id TEXT NOT NULL,
    similarity_score REAL,
    PRIMARY KEY (cluster_id, case_id),
    FOREIGN KEY (cluster_id) REFERENCES cluster_results(cluster_id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);
"""

CREATE_SAVED_ANALYSES_TABLE = """
CREATE TABLE IF NOT EXISTS saved_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    config_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_SAVED_ANALYSIS_CLUSTERS_TABLE = """
CREATE TABLE IF NOT EXISTS saved_analysis_clusters (
    saved_analysis_id INTEGER,
    cluster_id TEXT,
    PRIMARY KEY (saved_analysis_id, cluster_id),
    FOREIGN KEY (saved_analysis_id) REFERENCES saved_analyses(id) ON DELETE CASCADE,
    FOREIGN KEY (cluster_id) REFERENCES cluster_results(cluster_id)
);
"""

# =============================================================================
# INDEX CREATION SQL (Created AFTER data import for performance)
# =============================================================================

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_state ON cases(state);",
    "CREATE INDEX IF NOT EXISTS idx_year ON cases(year);",
    "CREATE INDEX IF NOT EXISTS idx_solved ON cases(solved);",
    "CREATE INDEX IF NOT EXISTS idx_vic_sex ON cases(vic_sex);",
    "CREATE INDEX IF NOT EXISTS idx_vic_race ON cases(vic_race);",
    "CREATE INDEX IF NOT EXISTS idx_weapon ON cases(weapon);",
    "CREATE INDEX IF NOT EXISTS idx_cntyfips ON cases(cntyfips);",
    "CREATE INDEX IF NOT EXISTS idx_msa ON cases(msa);",
    "CREATE INDEX IF NOT EXISTS idx_vic_age ON cases(vic_age);",
    "CREATE INDEX IF NOT EXISTS idx_county_fips_code ON cases(county_fips_code);",
    "CREATE INDEX IF NOT EXISTS idx_latitude ON cases(latitude);",
    "CREATE INDEX IF NOT EXISTS idx_longitude ON cases(longitude);",
    "CREATE INDEX IF NOT EXISTS idx_weapon_code ON cases(weapon_code);",
    "CREATE INDEX IF NOT EXISTS idx_vic_sex_code ON cases(vic_sex_code);",
]

# =============================================================================
# SCHEMA MANAGEMENT FUNCTIONS
# =============================================================================


def create_schema() -> None:
    """Create all database tables.

    Creates all tables in the correct order to satisfy foreign key dependencies.
    Uses IF NOT EXISTS for idempotency - safe to call multiple times.

    Raises:
        sqlite3.OperationalError: If table creation fails
    """
    logger.info("Creating database schema...")

    with get_db_connection() as conn:
        # Create metadata table first
        conn.execute(CREATE_METADATA_TABLE)

        # Create main cases table (no dependencies)
        conn.execute(CREATE_CASES_TABLE)

        # Create collections and related tables
        conn.execute(CREATE_COLLECTIONS_TABLE)
        conn.execute(CREATE_COLLECTION_CASES_TABLE)
        conn.execute(CREATE_CASE_NOTES_TABLE)

        # Create saved queries (independent)
        conn.execute(CREATE_SAVED_QUERIES_TABLE)

        # Create cluster tables
        conn.execute(CREATE_CLUSTER_RESULTS_TABLE)
        conn.execute(CREATE_CLUSTER_MEMBERSHIP_TABLE)

        # Create saved analyses tables
        conn.execute(CREATE_SAVED_ANALYSES_TABLE)
        conn.execute(CREATE_SAVED_ANALYSIS_CLUSTERS_TABLE)

    logger.info("Database schema created successfully")


def create_indexes() -> None:
    """Create all database indexes.

    IMPORTANT: Call this AFTER bulk data import for 3-5x better performance.
    SQLite rebuilds indexes on every INSERT, so creating them after import
    is much faster than creating them first.

    Raises:
        sqlite3.OperationalError: If index creation fails
    """
    logger.info("Creating database indexes...")

    with get_db_connection() as conn:
        for index_sql in INDEX_STATEMENTS:
            conn.execute(index_sql)

    logger.info(f"Created {len(INDEX_STATEMENTS)} indexes successfully")


def initialize_metadata() -> None:
    """Initialize metadata table with default values.

    Sets setup_complete flag to track whether initial data import has finished.

    Raises:
        sqlite3.OperationalError: If metadata initialization fails
    """
    logger.info("Initializing metadata...")

    with get_db_connection() as conn:
        # Insert setup_complete flag if it doesn't exist
        conn.execute(
            """
            INSERT OR IGNORE INTO metadata (key, value)
            VALUES ('setup_complete', '0')
            """
        )

    logger.info("Metadata initialized")


def mark_setup_complete() -> None:
    """Mark database setup as complete.

    Updates the setup_complete flag in metadata table to indicate
    that the initial CSV import has finished successfully.

    Raises:
        sqlite3.OperationalError: If update fails
    """
    logger.info("Marking setup as complete...")

    with get_db_connection() as conn:
        conn.execute(
            """
            UPDATE metadata
            SET value = '1'
            WHERE key = 'setup_complete'
            """
        )

    logger.info("Setup marked as complete")


def is_setup_complete() -> bool:
    """Check if database setup has been completed.

    Returns:
        True if setup is complete, False otherwise

    Raises:
        sqlite3.OperationalError: If query fails
    """
    try:
        with get_db_connection() as conn:
            result = conn.execute(
                """
                SELECT value FROM metadata
                WHERE key = 'setup_complete'
                """
            ).fetchone()

            if result is None:
                return False

            return result["value"] == "1"

    except Exception as e:
        logger.error(f"Error checking setup status: {e}")
        return False


def get_case_count() -> int:
    """Get total number of cases in database.

    Returns:
        Number of records in cases table

    Raises:
        sqlite3.OperationalError: If query fails
    """
    try:
        with get_db_connection() as conn:
            result = conn.execute("SELECT COUNT(*) as count FROM cases").fetchone()
            return result["count"] if result else 0

    except Exception as e:
        logger.error(f"Error getting case count: {e}")
        return 0
