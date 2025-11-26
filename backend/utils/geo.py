"""Geographic utility functions for clustering analysis.

Provides functions for calculating distances between coordinates and
geographic proximity scoring for case similarity analysis.
"""

import math
from typing import Optional, Tuple


def haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate the great-circle distance between two points on Earth.

    Uses the Haversine formula to compute the distance between two geographic
    coordinates in miles.

    Args:
        lat1: Latitude of first point (decimal degrees)
        lon1: Longitude of first point (decimal degrees)
        lat2: Latitude of second point (decimal degrees)
        lon2: Longitude of second point (decimal degrees)

    Returns:
        Distance in miles between the two points

    Example:
        >>> haversine_distance(41.8781, -87.6298, 34.0522, -118.2437)
        1745.47  # Chicago to Los Angeles
    """
    # Earth's radius in miles
    R = 3959.0

    # Convert latitude and longitude to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return round(distance, 2)


def calculate_geographic_score(
    case1_county_fips: Optional[int],
    case1_lat: Optional[float],
    case1_lon: Optional[float],
    case2_county_fips: Optional[int],
    case2_lat: Optional[float],
    case2_lon: Optional[float],
    max_distance_miles: float = 50.0,
) -> float:
    """Calculate geographic similarity score between two cases.

    Returns a score from 0-100 based on geographic proximity:
    - 100: Same county (exact match)
    - 100 to 0: Linear decay based on distance up to max_distance_miles
    - 0: Beyond max_distance_miles apart or missing coordinates

    Args:
        case1_county_fips: FIPS code for case 1's county (None if missing)
        case1_lat: Latitude for case 1 (None if missing)
        case1_lon: Longitude for case 1 (None if missing)
        case2_county_fips: FIPS code for case 2's county (None if missing)
        case2_lat: Latitude for case 2 (None if missing)
        case2_lon: Longitude for case 2 (None if missing)
        max_distance_miles: Maximum distance for scoring (default 50 miles)

    Returns:
        Geographic similarity score (0-100)

    Example:
        >>> # Same county
        >>> calculate_geographic_score(17031, 41.8, -87.6, 17031, 41.9, -87.5)
        100.0

        >>> # Different counties, close distance
        >>> calculate_geographic_score(17031, 41.8, -87.6, 17043, 41.7, -87.7)
        95.2  # ~2.4 miles apart
    """
    # If both have same county FIPS, perfect match
    if (
        case1_county_fips is not None
        and case2_county_fips is not None
        and case1_county_fips == case2_county_fips
    ):
        return 100.0

    # If we don't have coordinates for both cases, return 0
    if (
        case1_lat is None
        or case1_lon is None
        or case2_lat is None
        or case2_lon is None
    ):
        return 0.0

    # Calculate distance between coordinates
    distance = haversine_distance(case1_lat, case1_lon, case2_lat, case2_lon)

    # If distance exceeds maximum, return 0
    if distance >= max_distance_miles:
        return 0.0

    # Linear decay from 100 at 0 miles to 0 at max_distance_miles
    score = 100.0 * (1.0 - (distance / max_distance_miles))
    return round(score, 1)


def get_county_key(county_fips: Optional[int], state: str) -> str:
    """Generate a unique key for grouping cases by county.

    Args:
        county_fips: County FIPS code (None if missing)
        state: State name

    Returns:
        County grouping key in format "STATE:FIPS" or "STATE:UNKNOWN"

    Example:
        >>> get_county_key(17031, "ILLINOIS")
        "ILLINOIS:17031"

        >>> get_county_key(None, "CALIFORNIA")
        "CALIFORNIA:UNKNOWN"
    """
    if county_fips is None:
        return f"{state}:UNKNOWN"
    return f"{state}:{county_fips}"
