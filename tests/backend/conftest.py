"""Shared pytest fixtures for backend tests.

Provides test database setup, sample data fixtures, and API client configuration.
"""

# Path setup must happen before any backend imports
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
backend_dir = project_root / "backend"
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(backend_dir))

import os
import sqlite3
import tempfile
from contextlib import contextmanager
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
        List of case dictionaries with realistic test data covering
        various filter combinations including situation, MSA, relationship,
        and circumstance filters.
    """
    return [
        # Illinois cases - Cook County, Chicago MSA
        {
            "case_id": "IL-12345-1990",
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
            "case_id": "IL-12346-1991",
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
            "case_id": "IL-12347-1992",
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
            "case_id": "IL-12348-1993",
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
            "case_id": "IL-12349-1994",
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
        # California case - Los Angeles County, LA MSA - different situation, relationship, circumstance
        {
            "case_id": "CA-56789-1995",
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
        # Additional cases for comprehensive filter testing
        # Multiple victims case
        {
            "case_id": "TX-11111-1996",
            "cntyfips": "Harris County",
            "county_fips_code": 48201,
            "ori": "TX11111",
            "state": "TEXAS",
            "agency": "Houston Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 0,
            "year": 1996,
            "month": 2,
            "month_name": "February",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Multiple victims/single offender",
            "vic_age": 22,
            "vic_sex": "Female",
            "vic_sex_code": 2,
            "vic_race": "White",
            "vic_ethnic": "Hispanic or Latino",
            "off_age": 999,
            "off_sex": "Unknown",
            "off_race": "Unknown",
            "off_ethnic": "Unknown",
            "weapon": "Knife or cutting instrument",
            "weapon_code": 20,
            "relationship": "Stranger",
            "circumstance": "Felony type",
            "subcircum": "Rape",
            "vic_count": 2,
            "off_count": 1,
            "file_date": "2023-12-31",
            "msa": "Houston-The Woodlands-Sugar Land, TX",
            "msa_fips_code": 26420,
            "decade": 1990,
            "latitude": 29.7604,
            "longitude": -95.3698,
        },
        # Gang-related case
        {
            "case_id": "CA-22222-1997",
            "cntyfips": "Los Angeles County",
            "county_fips_code": 6037,
            "ori": "CA22222",
            "state": "CALIFORNIA",
            "agency": "Los Angeles Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 1,
            "year": 1997,
            "month": 9,
            "month_name": "September",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/multiple offenders",
            "vic_age": 19,
            "vic_sex": "Male",
            "vic_sex_code": 1,
            "vic_race": "Black",
            "vic_ethnic": "Not Hispanic",
            "off_age": 21,
            "off_sex": "Male",
            "off_race": "Black",
            "off_ethnic": "Not Hispanic",
            "weapon": "Handgun - pistol, revolver, etc",
            "weapon_code": 12,
            "relationship": "Stranger",
            "circumstance": "Juvenile gang",
            "subcircum": "",
            "vic_count": 1,
            "off_count": 3,
            "file_date": "2023-12-31",
            "msa": "Los Angeles-Long Beach-Anaheim, CA",
            "msa_fips_code": 31080,
            "decade": 1990,
            "latitude": 34.0522,
            "longitude": -118.2437,
        },
        # Family relationship case
        {
            "case_id": "NY-33333-1998",
            "cntyfips": "New York County",
            "county_fips_code": 36061,
            "ori": "NY33333",
            "state": "NEW YORK",
            "agency": "New York City Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 1,
            "year": 1998,
            "month": 11,
            "month_name": "November",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/single offender",
            "vic_age": 45,
            "vic_sex": "Female",
            "vic_sex_code": 2,
            "vic_race": "White",
            "vic_ethnic": "Not Hispanic",
            "off_age": 48,
            "off_sex": "Male",
            "off_race": "White",
            "off_ethnic": "Not Hispanic",
            "weapon": "Personal weapons, includes beating",
            "weapon_code": 40,
            "relationship": "Husband",
            "circumstance": "Argument",
            "subcircum": "Domestic violence",
            "vic_count": 1,
            "off_count": 1,
            "file_date": "2023-12-31",
            "msa": "New York-Newark-Jersey City, NY-NJ-PA",
            "msa_fips_code": 35620,
            "decade": 1990,
            "latitude": 40.7128,
            "longitude": -74.0060,
        },
        # Unknown offender case with unknown age victim
        {
            "case_id": "FL-44444-1999",
            "cntyfips": "Miami-Dade County",
            "county_fips_code": 12086,
            "ori": "FL44444",
            "state": "FLORIDA",
            "agency": "Miami Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 0,
            "year": 1999,
            "month": 4,
            "month_name": "April",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/unknown offenders",
            "vic_age": 999,
            "vic_sex": "Unknown",
            "vic_sex_code": 9,
            "vic_race": "Unknown",
            "vic_ethnic": "Unknown",
            "off_age": 999,
            "off_sex": "Unknown",
            "off_race": "Unknown",
            "off_ethnic": "Unknown",
            "weapon": "Firearm, type not stated",
            "weapon_code": 11,
            "relationship": "Unknown",
            "circumstance": "Unknown",
            "subcircum": "",
            "vic_count": 1,
            "off_count": 0,
            "file_date": "2023-12-31",
            "msa": "Miami-Fort Lauderdale-Pompano Beach, FL",
            "msa_fips_code": 33100,
            "decade": 1990,
            "latitude": 25.7617,
            "longitude": -80.1918,
        },
        # Multiple victims/multiple offenders case
        {
            "case_id": "IL-55555-1976",
            "cntyfips": "Cook County",
            "county_fips_code": 17031,
            "ori": "IL55555",
            "state": "ILLINOIS",
            "agency": "Chicago Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 0,
            "year": 1976,
            "month": 1,
            "month_name": "January",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Multiple victims/multiple offenders",
            "vic_age": 32,
            "vic_sex": "Male",
            "vic_sex_code": 1,
            "vic_race": "White",
            "vic_ethnic": "Not Hispanic",
            "off_age": 999,
            "off_sex": "Unknown",
            "off_race": "Unknown",
            "off_ethnic": "Unknown",
            "weapon": "Rifle",
            "weapon_code": 13,
            "relationship": "Unknown",
            "circumstance": "Gangland",
            "subcircum": "",
            "vic_count": 3,
            "off_count": 2,
            "file_date": "2023-12-31",
            "msa": "Chicago-Naperville-Elgin, IL-IN-WI",
            "msa_fips_code": 16980,
            "decade": 1970,
            "latitude": 41.8781,
            "longitude": -87.6298,
        },
        # Other circumstance case
        {
            "case_id": "WA-66666-2000",
            "cntyfips": "King County",
            "county_fips_code": 53033,
            "ori": "WA66666",
            "state": "WASHINGTON",
            "agency": "Seattle Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 1,
            "year": 2000,
            "month": 6,
            "month_name": "June",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Single victim/single offender",
            "vic_age": 55,
            "vic_sex": "Male",
            "vic_sex_code": 1,
            "vic_race": "Asian",
            "vic_ethnic": "Not Hispanic",
            "off_age": 28,
            "off_sex": "Male",
            "off_race": "White",
            "off_ethnic": "Not Hispanic",
            "weapon": "Blunt object - hammer, club, etc",
            "weapon_code": 30,
            "relationship": "Neighbor",
            "circumstance": "Other",
            "subcircum": "Dispute over property",
            "vic_count": 1,
            "off_count": 1,
            "file_date": "2023-12-31",
            "msa": "Seattle-Tacoma-Bellevue, WA",
            "msa_fips_code": 42660,
            "decade": 2000,
            "latitude": 47.6062,
            "longitude": -122.3321,
        },
        # Multiple victims/unknown offenders case
        {
            "case_id": "AZ-77777-2001",
            "cntyfips": "Maricopa County",
            "county_fips_code": 4013,
            "ori": "AZ77777",
            "state": "ARIZONA",
            "agency": "Phoenix Police Dept",
            "agentype": "Municipal Police",
            "source": "FBI",
            "solved": 0,
            "year": 2001,
            "month": 10,
            "month_name": "October",
            "incident": 1,
            "action_type": "Murder or Manslaughter",
            "homicide": "Murder and nonnegligent manslaughter",
            "situation": "Multiple victims/unknown offenders",
            "vic_age": 40,
            "vic_sex": "Female",
            "vic_sex_code": 2,
            "vic_race": "White",
            "vic_ethnic": "Hispanic or Latino",
            "off_age": 999,
            "off_sex": "Unknown",
            "off_race": "Unknown",
            "off_ethnic": "Unknown",
            "weapon": "Strangulation - hanging",
            "weapon_code": 80,
            "relationship": "Unknown",
            "circumstance": "Unknown",
            "subcircum": "",
            "vic_count": 2,
            "off_count": 0,
            "file_date": "2023-12-31",
            "msa": "Phoenix-Mesa-Chandler, AZ",
            "msa_fips_code": 38060,
            "decade": 2000,
            "latitude": 33.4484,
            "longitude": -112.0740,
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
