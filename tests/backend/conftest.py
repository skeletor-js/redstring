"""Shared pytest fixtures for backend tests.

Provides test database setup, sample data fixtures, and API client configuration.
"""

import os
import sqlite3
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Dict, Generator, List

import pytest
from fastapi.testclient import TestClient

# Set up test environment before importing backend modules
os.environ["REDSTRING_DATABASE_PATH"] = ":memory:"


@pytest.fixture(scope="function")
def temp_db_path() -> Generator[Path, None, None]:
    """Create a temporary database file for testing.

    Yields:
        Path to temporary database file
    """
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)

    yield db_path

    # Cleanup
    if db_path.exists():
        db_path.unlink()


@pytest.fixture(scope="function")
def test_db_connection(temp_db_path: Path) -> Generator[sqlite3.Connection, None, None]:
    """Create an in-memory test database connection.

    Yields:
        SQLite connection with row factory configured
    """
    conn = sqlite3.connect(str(temp_db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    yield conn

    conn.close()


@pytest.fixture(scope="function")
def sample_cases() -> List[Dict]:
    """Generate sample case data for testing.

    Returns:
        List of case dictionaries with realistic test data
    """
    return [
        {
            "id": "IL-12345-1990",
            "cntyfips": "Cook County",
            "county_fips_code": 17031,
            "ori": "IL01234",
            "state": "ILLINOIS",
            "agency": "Chicago Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 0,
            "year": 1990,
            "month": 6,
            "month_name": "June",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/single offender",
            "vic_age": 25,
            "vic_sex": "Female",
            "vic_sex_code": 2,
            "vic_race": "White",
            "vic_ethnic": "Not Hispanic",
            "off_age": 999,
            "off_sex": "Unknown",
            "off_race": "Unknown",
            "off_ethnic": "Unknown",
            "weapon": "Strangulation - hanging",
            "weapon_code": 80,
            "relationship": "Unknown",
            "circumstance": "Unknown",
            "subcircum": "",
            "vic_count": 1,
            "off_count": 1,
            "file_date": "2023-12-31",
            "msa": "Chicago-Naperville-Elgin, IL-IN-WI",
            "msa_fips_code": 16980,
            "decade": 1990,
            "latitude": 41.8781,
            "longitude": -87.6298,
        },
        {
            "id": "IL-12346-1991",
            "cntyfips": "Cook County",
            "county_fips_code": 17031,
            "ori": "IL01234",
            "state": "ILLINOIS",
            "agency": "Chicago Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 0,
            "year": 1991,
            "month": 8,
            "month_name": "August",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/single offender",
            "vic_age": 28,
            "vic_sex": "Female",
            "vic_sex_code": 2,
            "vic_race": "White",
            "vic_ethnic": "Not Hispanic",
            "off_age": 999,
            "off_sex": "Unknown",
            "off_race": "Unknown",
            "off_ethnic": "Unknown",
            "weapon": "Strangulation - hanging",
            "weapon_code": 80,
            "relationship": "Unknown",
            "circumstance": "Unknown",
            "subcircum": "",
            "vic_count": 1,
            "off_count": 1,
            "file_date": "2023-12-31",
            "msa": "Chicago-Naperville-Elgin, IL-IN-WI",
            "msa_fips_code": 16980,
            "decade": 1990,
            "latitude": 41.8781,
            "longitude": -87.6298,
        },
        {
            "id": "IL-12347-1992",
            "cntyfips": "Cook County",
            "county_fips_code": 17031,
            "ori": "IL01234",
            "state": "ILLINOIS",
            "agency": "Chicago Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 0,
            "year": 1992,
            "month": 3,
            "month_name": "March",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/single offender",
            "vic_age": 30,
            "vic_sex": "Female",
            "vic_sex_code": 2,
            "vic_race": "White",
            "vic_ethnic": "Not Hispanic",
            "off_age": 999,
            "off_sex": "Unknown",
            "off_race": "Unknown",
            "off_ethnic": "Unknown",
            "weapon": "Strangulation - hanging",
            "weapon_code": 80,
            "relationship": "Unknown",
            "circumstance": "Unknown",
            "subcircum": "",
            "vic_count": 1,
            "off_count": 1,
            "file_date": "2023-12-31",
            "msa": "Chicago-Naperville-Elgin, IL-IN-WI",
            "msa_fips_code": 16980,
            "decade": 1990,
            "latitude": 41.8781,
            "longitude": -87.6298,
        },
        {
            "id": "IL-12348-1993",
            "cntyfips": "Cook County",
            "county_fips_code": 17031,
            "ori": "IL01234",
            "state": "ILLINOIS",
            "agency": "Chicago Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 0,
            "year": 1993,
            "month": 12,
            "month_name": "December",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/single offender",
            "vic_age": 27,
            "vic_sex": "Female",
            "vic_sex_code": 2,
            "vic_race": "White",
            "vic_ethnic": "Not Hispanic",
            "off_age": 999,
            "off_sex": "Unknown",
            "off_race": "Unknown",
            "off_ethnic": "Unknown",
            "weapon": "Strangulation - hanging",
            "weapon_code": 80,
            "relationship": "Unknown",
            "circumstance": "Unknown",
            "subcircum": "",
            "vic_count": 1,
            "off_count": 1,
            "file_date": "2023-12-31",
            "msa": "Chicago-Naperville-Elgin, IL-IN-WI",
            "msa_fips_code": 16980,
            "decade": 1990,
            "latitude": 41.8781,
            "longitude": -87.6298,
        },
        {
            "id": "IL-12349-1994",
            "cntyfips": "Cook County",
            "county_fips_code": 17031,
            "ori": "IL01234",
            "state": "ILLINOIS",
            "agency": "Chicago Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 0,
            "year": 1994,
            "month": 5,
            "month_name": "May",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/single offender",
            "vic_age": 26,
            "vic_sex": "Female",
            "vic_sex_code": 2,
            "vic_race": "White",
            "vic_ethnic": "Not Hispanic",
            "off_age": 999,
            "off_sex": "Unknown",
            "off_race": "Unknown",
            "off_ethnic": "Unknown",
            "weapon": "Strangulation - hanging",
            "weapon_code": 80,
            "relationship": "Unknown",
            "circumstance": "Unknown",
            "subcircum": "",
            "vic_count": 1,
            "off_count": 1,
            "file_date": "2023-12-31",
            "msa": "Chicago-Naperville-Elgin, IL-IN-WI",
            "msa_fips_code": 16980,
            "decade": 1990,
            "latitude": 41.8781,
            "longitude": -87.6298,
        },
        # Different location for comparison
        {
            "id": "CA-56789-1995",
            "cntyfips": "Los Angeles County",
            "county_fips_code": 6037,
            "ori": "CA56789",
            "state": "CALIFORNIA",
            "agency": "Los Angeles Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 1,
            "year": 1995,
            "month": 7,
            "month_name": "July",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/single offender",
            "vic_age": 35,
            "vic_sex": "Male",
            "vic_sex_code": 1,
            "vic_race": "Black",
            "vic_ethnic": "Not Hispanic",
            "off_age": 30,
            "off_sex": "Male",
            "off_race": "Black",
            "off_ethnic": "Not Hispanic",
            "weapon": "Handgun - pistol, revolver, etc",
            "weapon_code": 12,
            "relationship": "Acquaintance",
            "circumstance": "Argument",
            "subcircum": "",
            "vic_count": 1,
            "off_count": 1,
            "file_date": "2023-12-31",
            "msa": "Los Angeles-Long Beach-Anaheim, CA",
            "msa_fips_code": 31080,
            "decade": 1990,
            "latitude": 34.0522,
            "longitude": -118.2437,
        },
    ]


@pytest.fixture(scope="function")
def populated_test_db(
    test_db_connection: sqlite3.Connection, sample_cases: List[Dict]
) -> sqlite3.Connection:
    """Create a test database with schema and sample data.

    Args:
        test_db_connection: SQLite connection
        sample_cases: Sample case data

    Returns:
        SQLite connection with populated test data
    """
    # Import here to avoid circular dependencies
    from backend.database.schema import (
        CREATE_CASES_TABLE,
        CREATE_CLUSTER_MEMBERSHIP_TABLE,
        CREATE_CLUSTER_RESULTS_TABLE,
        CREATE_METADATA_TABLE,
        INDEX_STATEMENTS,
    )

    conn = test_db_connection

    # Create tables
    conn.execute(CREATE_METADATA_TABLE)
    conn.execute(CREATE_CASES_TABLE)
    conn.execute(CREATE_CLUSTER_RESULTS_TABLE)
    conn.execute(CREATE_CLUSTER_MEMBERSHIP_TABLE)

    # Create indexes
    for index_sql in INDEX_STATEMENTS:
        conn.execute(index_sql)

    # Insert sample cases
    columns = list(sample_cases[0].keys())
    placeholders = ",".join("?" * len(columns))
    insert_sql = f"INSERT INTO cases ({','.join(columns)}) VALUES ({placeholders})"

    for case in sample_cases:
        values = [case[col] for col in columns]
        conn.execute(insert_sql, values)

    # Insert metadata
    conn.execute(
        "INSERT INTO metadata (key, value) VALUES ('setup_complete', '1')"
    )

    conn.commit()
    return conn


@pytest.fixture(scope="function")
def api_client(populated_test_db: sqlite3.Connection) -> TestClient:
    """Create a FastAPI test client with mocked database.

    Args:
        populated_test_db: Populated test database connection

    Returns:
        FastAPI TestClient for making API requests
    """
    from backend.main import app

    # Mock the database connection to use test database
    from unittest.mock import patch

    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = populated_test_db
        client = TestClient(app)
        yield client
