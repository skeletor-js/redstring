"""Data transformation mappings and lookup tables for Redstring.

Provides all transformation constants and CSV lookup loaders for converting
raw Murder Data CSV values into numeric codes for efficient database storage
and algorithm processing.
"""

import logging
import re
from pathlib import Path
from typing import Dict, Tuple

import pandas as pd

from config import get_data_path

logger = logging.getLogger(__name__)

# State abbreviation to full name mapping
STATE_ABBREV_TO_NAME: Dict[str, str] = {
    "AL": "ALABAMA", "AK": "ALASKA", "AZ": "ARIZONA", "AR": "ARKANSAS",
    "CA": "CALIFORNIA", "CO": "COLORADO", "CT": "CONNECTICUT", "DE": "DELAWARE",
    "DC": "DISTRICT OF COLUMBIA", "FL": "FLORIDA", "GA": "GEORGIA", "HI": "HAWAII",
    "ID": "IDAHO", "IL": "ILLINOIS", "IN": "INDIANA", "IA": "IOWA",
    "KS": "KANSAS", "KY": "KENTUCKY", "LA": "LOUISIANA", "ME": "MAINE",
    "MD": "MARYLAND", "MA": "MASSACHUSETTS", "MI": "MICHIGAN", "MN": "MINNESOTA",
    "MS": "MISSISSIPPI", "MO": "MISSOURI", "MT": "MONTANA", "NE": "NEBRASKA",
    "NV": "NEVADA", "NH": "NEW HAMPSHIRE", "NJ": "NEW JERSEY", "NM": "NEW MEXICO",
    "NY": "NEW YORK", "NC": "NORTH CAROLINA", "ND": "NORTH DAKOTA", "OH": "OHIO",
    "OK": "OKLAHOMA", "OR": "OREGON", "PA": "PENNSYLVANIA", "RI": "RHODE ISLAND",
    "SC": "SOUTH CAROLINA", "SD": "SOUTH DAKOTA", "TN": "TENNESSEE", "TX": "TEXAS",
    "UT": "UTAH", "VT": "VERMONT", "VA": "VIRGINIA", "WA": "WASHINGTON",
    "WV": "WEST VIRGINIA", "WI": "WISCONSIN", "WY": "WYOMING",
    # Territories
    "PR": "PUERTO RICO", "VI": "VIRGIN ISLANDS", "GU": "GUAM",
}

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

    Creates a mapping from Murder Data format ("County, ST") to FIPS codes.
    The Murder Data CSV uses format like "Abbeville, SC" or "Cook, IL".
    
    The mapping process:
    1. Load County FIPS Lookout.csv which has "Autauga County" format
    2. Load State FIPS to get state codes
    3. Create normalized lookup: "abbeville, sc" -> 45001

    Returns:
        Dictionary mapping Murder Data county labels to 5-digit FIPS codes.
        Example: {"Abbeville, SC": 45001, "Cook, IL": 17031, ...}

    Raises:
        FileNotFoundError: If County FIPS Lookout.csv is missing
        ValueError: If CSV format is invalid
    """
    try:
        data_path = get_data_path()
        county_csv_path = data_path / "County FIPS Lookout.csv"
        state_csv_path = data_path / "State FIPS Lookout.csv"

        # Load state FIPS to get state code -> state name mapping
        state_df = pd.read_csv(state_csv_path)
        state_fips_to_name = dict(zip(state_df["FIPS Code"], state_df["state"].str.upper()))
        
        # Create reverse mapping: state name -> state abbreviation
        state_name_to_abbrev = {v: k for k, v in STATE_ABBREV_TO_NAME.items()}

        # Load county FIPS data
        county_df = pd.read_csv(county_csv_path)
        
        # Filter to only county-level entries (not state totals)
        county_df = county_df[county_df["county"].str.contains(
            "County|Parish|Borough|Census Area|city|Municipality",
            case=False, na=False
        )]

        county_fips = {}
        
        for _, row in county_df.iterrows():
            fips_code = int(row["FIPS Code"])
            county_name = row["county"]
            
            # Extract state FIPS from county FIPS (first 1-2 digits)
            state_fips = fips_code // 1000
            state_name = state_fips_to_name.get(state_fips, "")
            state_abbrev = state_name_to_abbrev.get(state_name, "")
            
            if not state_abbrev:
                continue
            
            # Normalize county name: remove "County", "Parish", etc.
            normalized_county = re.sub(
                r'\s*(County|Parish|Borough|Census Area|city|Municipality)$',
                '',
                county_name,
                flags=re.IGNORECASE
            ).strip()
            
            # Create key in Murder Data format: "County, ST"
            murder_data_key = f"{normalized_county}, {state_abbrev}"
            county_fips[murder_data_key] = fips_code
            
            # Also add lowercase version for case-insensitive matching
            county_fips[murder_data_key.lower()] = fips_code
        
        # Add special cases / edge cases that don't follow standard naming
        special_cases = {
            # Independent cities
            "Baltimore city, MD": 24510,
            "baltimore city, md": 24510,
            "St. Louis city, MO": 29510,
            "st. louis city, mo": 29510,
            "Carson City city, NV": 32510,
            "carson city city, nv": 32510,
            "Carson City, NV": 32510,
            "carson city, nv": 32510,
            # District of Columbia
            "District of Columbia": 11001,
            "district of columbia": 11001,
            "Washington, DC": 11001,
            "washington, dc": 11001,
            # Counties with apostrophes or special characters
            "Prince George's, MD": 24033,
            "prince george's, md": 24033,
            "Queen Anne's, MD": 24035,
            "queen anne's, md": 24035,
            "St. Mary's, MD": 24037,
            "st. mary's, md": 24037,
            "O'Brien, IA": 19141,
            "o'brien, ia": 19141,
            # Counties with "De" prefix variations
            "De Baca, NM": 35011,
            "de baca, nm": 35011,
            "DeBaca, NM": 35011,
            "debaca, nm": 35011,
            "De Kalb, AL": 1049,
            "de kalb, al": 1049,
            "DeKalb, AL": 1049,
            "dekalb, al": 1049,
            "De Kalb, GA": 13089,
            "de kalb, ga": 13089,
            "DeKalb, GA": 13089,
            "dekalb, ga": 13089,
            "De Kalb, MO": 29063,
            "de kalb, mo": 29063,
            "DeKalb, MO": 29063,
            "dekalb, mo": 29063,
            "De Soto, FL": 12027,
            "de soto, fl": 12027,
            "DeSoto, FL": 12027,
            "desoto, fl": 12027,
            "De Witt, TX": 48123,
            "de witt, tx": 48123,
            "DeWitt, TX": 48123,
            "dewitt, tx": 48123,
            # McKean (Mc prefix)
            "McKean, PA": 42083,
            "mckean, pa": 42083,
            # Miami-Dade (renamed from Dade)
            "Miami-Dade, FL": 12086,
            "miami-dade, fl": 12086,
            "Dade, FL": 12086,
            "dade, fl": 12086,
            # Broomfield (newer county, created 2001)
            "Broomfield, CO": 8014,
            "broomfield, co": 8014,
        }
        county_fips.update(special_cases)

        logger.info(f"Loaded {len(county_fips) // 2} county FIPS mappings")
        return county_fips

    except FileNotFoundError as e:
        logger.error(f"FIPS lookup file not found: {e}")
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
