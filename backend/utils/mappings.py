"""Data transformation mappings and lookup tables for Redstring.

Provides all transformation constants and CSV lookup loaders for converting
raw Murder Data CSV values into numeric codes for efficient database storage
and algorithm processing.
"""

import logging
from pathlib import Path
from typing import Dict, Tuple

import pandas as pd

from config import get_data_path

logger = logging.getLogger(__name__)

# =============================================================================
# TRANSFORMATION CONSTANTS
# =============================================================================

SOLVED_MAP: Dict[str, int] = {
    "Yes": 1,
    "No": 0,
}

VIC_SEX_CODE: Dict[str, int] = {
    "Male": 1,
    "Female": 2,
    "Unknown": 9,
}

MONTH_MAP: Dict[str, int] = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12,
}

WEAPON_CODE_MAP: Dict[str, int] = {
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

# =============================================================================
# FIPS LOOKUP LOADERS
# =============================================================================


def load_state_fips() -> Dict[str, int]:
    """Load state name to FIPS code mapping from CSV.

    Returns:
        Dictionary mapping uppercase state names to 2-digit FIPS codes.
        Example: {"ALABAMA": 1, "ALASKA": 2, ...}

    Raises:
        FileNotFoundError: If State FIPS Lookout.csv is missing
        ValueError: If CSV format is invalid
    """
    try:
        data_path = get_data_path()
        csv_path = data_path / "State FIPS Lookout.csv"

        df = pd.read_csv(csv_path)
        state_fips = dict(zip(df["state"], df["FIPS Code"]))

        logger.info(f"Loaded {len(state_fips)} state FIPS mappings")
        return state_fips

    except FileNotFoundError:
        logger.error(f"State FIPS lookup file not found: {csv_path}")
        raise
    except Exception as e:
        logger.error(f"Error loading state FIPS mappings: {e}", exc_info=True)
        raise ValueError(f"Failed to load State FIPS Lookout.csv: {e}")


def load_county_fips() -> Dict[str, int]:
    """Load county label to FIPS code mapping from CSV.

    The CSV contains labels like "Anchorage, AK" or "Cook County" that need
    to be matched against the Murder Data CSV's CNTYFIPS column.

    Returns:
        Dictionary mapping county labels to 4-5 digit FIPS codes.
        Example: {"Autauga County": 1001, "Cook County": 17031, ...}

    Raises:
        FileNotFoundError: If County FIPS Lookout.csv is missing
        ValueError: If CSV format is invalid
    """
    try:
        data_path = get_data_path()
        csv_path = data_path / "County FIPS Lookout.csv"

        df = pd.read_csv(csv_path)
        # Skip rows where county is just the state name (e.g., "Alabama")
        df = df[df["county"].str.contains("County|Parish|Borough|Census Area|city", case=False, na=False)]

        county_fips = dict(zip(df["county"], df["FIPS Code"]))

        logger.info(f"Loaded {len(county_fips)} county FIPS mappings")
        return county_fips

    except FileNotFoundError:
        logger.error(f"County FIPS lookup file not found: {csv_path}")
        raise
    except Exception as e:
        logger.error(f"Error loading county FIPS mappings: {e}", exc_info=True)
        raise ValueError(f"Failed to load County FIPS Lookout.csv: {e}")


def load_county_centroids() -> Dict[int, Tuple[float, float]]:
    """Load county FIPS to geographic centroid mapping from CSV.

    Returns:
        Dictionary mapping county FIPS codes to (latitude, longitude) tuples.
        Example: {1001: (32.5081, -86.6513), 17031: (41.8, -87.75), ...}

    Raises:
        FileNotFoundError: If US County Centroids.csv is missing
        ValueError: If CSV format is invalid
    """
    try:
        data_path = get_data_path()
        csv_path = data_path / "US County Centroids.csv"

        df = pd.read_csv(csv_path)
        # Create dict: {cfips: (latitude, longitude)}
        centroids = {
            row["cfips"]: (row["latitude"], row["longitude"])
            for _, row in df.iterrows()
        }

        logger.info(f"Loaded {len(centroids)} county centroid coordinates")
        return centroids

    except FileNotFoundError:
        logger.error(f"County centroids file not found: {csv_path}")
        raise
    except Exception as e:
        logger.error(f"Error loading county centroids: {e}", exc_info=True)
        raise ValueError(f"Failed to load US County Centroids.csv: {e}")


# =============================================================================
# MODULE-LEVEL CACHING
# =============================================================================

# Load lookup tables once at module import time (~300KB total, O(1) access)
_STATE_FIPS_CACHE: Dict[str, int] | None = None
_COUNTY_FIPS_CACHE: Dict[str, int] | None = None
_CENTROIDS_CACHE: Dict[int, Tuple[float, float]] | None = None


def get_state_fips() -> Dict[str, int]:
    """Get cached state FIPS mappings."""
    global _STATE_FIPS_CACHE
    if _STATE_FIPS_CACHE is None:
        _STATE_FIPS_CACHE = load_state_fips()
    return _STATE_FIPS_CACHE


def get_county_fips() -> Dict[str, int]:
    """Get cached county FIPS mappings."""
    global _COUNTY_FIPS_CACHE
    if _COUNTY_FIPS_CACHE is None:
        _COUNTY_FIPS_CACHE = load_county_fips()
    return _COUNTY_FIPS_CACHE


def get_county_centroids() -> Dict[int, Tuple[float, float]]:
    """Get cached county centroid coordinates."""
    global _CENTROIDS_CACHE
    if _CENTROIDS_CACHE is None:
        _CENTROIDS_CACHE = load_county_centroids()
    return _CENTROIDS_CACHE
