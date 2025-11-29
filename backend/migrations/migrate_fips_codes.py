#!/usr/bin/env python3
"""Migration script to populate county_fips_code and coordinates in existing database.

This script updates the cases table with:
1. county_fips_code - derived from cntyfips column using the updated mapping
2. latitude/longitude - derived from county_fips_code using centroid lookup

Run this script after updating the FIPS mapping logic in utils/mappings.py.

Usage:
    python backend/migrations/migrate_fips_codes.py
"""

import logging
import sqlite3
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import get_database_path
from utils.mappings import get_county_centroids, get_county_fips

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def migrate_fips_codes():
    """Migrate county_fips_code and coordinates for all cases."""
    
    db_path = get_database_path()
    logger.info(f"Database path: {db_path}")
    
    if not db_path.exists():
        logger.error("Database not found!")
        return False
    
    # Load mappings
    logger.info("Loading FIPS mappings...")
    county_fips = get_county_fips()
    centroids = get_county_centroids()
    
    logger.info(f"Loaded {len(county_fips) // 2} county FIPS mappings")
    logger.info(f"Loaded {len(centroids)} county centroids")
    
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    
    try:
        # Get all distinct cntyfips values
        logger.info("Fetching distinct cntyfips values...")
        cursor = conn.execute("SELECT DISTINCT cntyfips FROM cases WHERE cntyfips IS NOT NULL")
        distinct_cntyfips = [row["cntyfips"] for row in cursor.fetchall()]
        logger.info(f"Found {len(distinct_cntyfips)} distinct cntyfips values")
        
        # Build update mapping
        updates = {}
        matched = 0
        unmatched = []
        
        for cntyfips in distinct_cntyfips:
            # Try exact match first, then lowercase
            fips_code = county_fips.get(cntyfips) or county_fips.get(cntyfips.lower() if cntyfips else None)
            
            if fips_code:
                lat, lon = centroids.get(fips_code, (None, None))
                updates[cntyfips] = (fips_code, lat, lon)
                matched += 1
            else:
                unmatched.append(cntyfips)
        
        logger.info(f"Matched {matched}/{len(distinct_cntyfips)} cntyfips values ({100*matched/len(distinct_cntyfips):.1f}%)")
        
        if unmatched and len(unmatched) <= 20:
            logger.warning(f"Unmatched values: {unmatched}")
        elif unmatched:
            logger.warning(f"First 20 unmatched values: {unmatched[:20]}")
        
        # Update database in batches
        logger.info("Updating database...")
        
        total_updated = 0
        batch_size = 100
        
        for i, (cntyfips, (fips_code, lat, lon)) in enumerate(updates.items()):
            conn.execute(
                """
                UPDATE cases 
                SET county_fips_code = ?, latitude = ?, longitude = ?
                WHERE cntyfips = ?
                """,
                (fips_code, lat, lon, cntyfips)
            )
            
            if (i + 1) % batch_size == 0:
                conn.commit()
                logger.info(f"Updated {i + 1}/{len(updates)} cntyfips values...")
        
        conn.commit()
        
        # Verify results
        logger.info("Verifying results...")
        
        total = conn.execute("SELECT COUNT(*) as c FROM cases").fetchone()["c"]
        with_fips = conn.execute(
            "SELECT COUNT(*) as c FROM cases WHERE county_fips_code IS NOT NULL"
        ).fetchone()["c"]
        with_coords = conn.execute(
            "SELECT COUNT(*) as c FROM cases WHERE latitude IS NOT NULL AND longitude IS NOT NULL"
        ).fetchone()["c"]
        
        logger.info(f"Total cases: {total}")
        logger.info(f"Cases with county_fips_code: {with_fips} ({100*with_fips/total:.1f}%)")
        logger.info(f"Cases with coordinates: {with_coords} ({100*with_coords/total:.1f}%)")
        
        logger.info("Migration completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Migration failed: {e}", exc_info=True)
        conn.rollback()
        return False
        
    finally:
        conn.close()


if __name__ == "__main__":
    success = migrate_fips_codes()
    sys.exit(0 if success else 1)