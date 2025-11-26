"""Data loading service for importing Murder Data CSV into SQLite.

Handles chunked CSV import with data transformations, FIPS code enrichment,
and geographic coordinate mapping. Provides progress reporting for UI feedback.
"""

import logging
from pathlib import Path
from typing import Callable, Optional

import pandas as pd

from config import get_data_path
from database.connection import get_db_connection
from database.schema import create_indexes, create_schema, initialize_metadata, mark_setup_complete
from utils.mappings import (
    MONTH_MAP,
    SOLVED_MAP,
    VIC_SEX_CODE,
    WEAPON_CODE_MAP,
    get_county_centroids,
    get_county_fips,
)

logger = logging.getLogger(__name__)

# Type alias for progress callback
ProgressCallback = Callable[[int, int, str], None]


class DataLoader:
    """Manages CSV import and transformation for Murder Data.

    Loads 894,636 records in chunks, applies all transformations, and enriches
    with FIPS codes and geographic coordinates. Provides progress callbacks
    for UI display.

    Attributes:
        progress_callback: Optional callback function(current, total, stage)
        total_rows: Expected total number of records (894,636)
        processed_rows: Number of rows processed so far
    """

    def __init__(self, progress_callback: Optional[ProgressCallback] = None):
        """Initialize data loader.

        Args:
            progress_callback: Optional function to call with progress updates.
                Signature: callback(current: int, total: int, stage: str)
        """
        self.progress_callback = progress_callback
        self.total_rows = 894636
        self.processed_rows = 0
        self._county_fips = get_county_fips()
        self._centroids = get_county_centroids()

    def _report_progress(self, stage: str) -> None:
        """Report progress to callback if registered.

        Args:
            stage: Current processing stage (e.g., "importing", "indexing")
        """
        if self.progress_callback:
            self.progress_callback(self.processed_rows, self.total_rows, stage)

    def transform_chunk(self, chunk: pd.DataFrame) -> pd.DataFrame:
        """Apply all data transformations to a DataFrame chunk.

        Transformations applied:
        - Solved: "Yes"/"No" → 1/0
        - Month: Month name → 1-12
        - VicSex: Male/Female/Unknown → 1/2/9
        - Weapon: Text description → numeric code (11-99)
        - CNTYFIPS: County label → numeric FIPS code
        - Geographic enrichment: FIPS → latitude/longitude

        Args:
            chunk: DataFrame chunk from CSV

        Returns:
            Transformed DataFrame ready for database insertion

        Note:
            NULL handling per PRD specification:
            - VicAge=999 → stored as-is
            - FIPS lookup failure → county_fips_code=NULL, logged
            - Missing centroids → latitude/longitude=NULL
            - Unknown weapon → weapon_code=99
        """
        # Apply solved status transformation
        chunk["solved"] = chunk["Solved"].map(SOLVED_MAP)

        # Apply month transformation
        chunk["month"] = chunk["Month"].map(MONTH_MAP)

        # Apply victim sex code transformation
        chunk["vic_sex_code"] = chunk["VicSex"].map(VIC_SEX_CODE)

        # Apply weapon code transformation (use 99 for unmapped values)
        chunk["weapon_code"] = chunk["Weapon"].map(WEAPON_CODE_MAP).fillna(99).astype(int)

        # Map county FIPS codes
        # Note: CNTYFIPS in CSV is a label like "Anchorage, AK" or "Cook County"
        # We need to clean it and match against our lookup
        chunk["county_fips_code"] = chunk["CNTYFIPS"].map(self._county_fips)

        # Log warning for missing FIPS codes
        missing_fips = chunk["county_fips_code"].isna().sum()
        if missing_fips > 0:
            logger.warning(
                f"{missing_fips} records with unmapped county FIPS codes in this chunk"
            )

        # Enrich with geographic coordinates
        def get_centroid(fips_code):
            """Get (lat, lon) tuple for FIPS code, or (None, None) if not found."""
            if pd.isna(fips_code):
                return None, None
            return self._centroids.get(int(fips_code), (None, None))

        chunk[["latitude", "longitude"]] = chunk["county_fips_code"].apply(
            get_centroid
        ).apply(pd.Series)

        # Rename columns to match database schema
        # Keep original columns with different names where needed
        chunk = chunk.rename(
            columns={
                "ID": "id",
                "CNTYFIPS": "cntyfips",
                "Ori": "ori",
                "State": "state",
                "Agency": "agency",
                "Agentype": "agentype",
                "Source": "source",
                "Year": "year",
                "Month": "month_name",  # Store original month name
                "Incident": "incident",
                "ActionType": "action_type",
                "Homicide": "homicide",
                "Situation": "situation",
                "VicAge": "vic_age",
                "VicSex": "vic_sex",
                "VicRace": "vic_race",
                "VicEthnic": "vic_ethnic",
                "OffAge": "off_age",
                "OffSex": "off_sex",
                "OffRace": "off_race",
                "OffEthnic": "off_ethnic",
                "Weapon": "weapon",
                "Relationship": "relationship",
                "Circumstance": "circumstance",
                "Subcircum": "subcircum",
                "VicCount": "vic_count",
                "OffCount": "off_count",
                "FileDate": "file_date",
                "MSA": "msa",
                "decade": "decade",
            }
        )

        # Add placeholder for MSA FIPS code (not used in MVP)
        chunk["msa_fips_code"] = None

        # Select only columns that exist in database schema
        db_columns = [
            "id",
            "cntyfips",
            "county_fips_code",
            "ori",
            "state",
            "agency",
            "agentype",
            "source",
            "solved",
            "year",
            "month",
            "month_name",
            "incident",
            "action_type",
            "homicide",
            "situation",
            "vic_age",
            "vic_sex",
            "vic_sex_code",
            "vic_race",
            "vic_ethnic",
            "off_age",
            "off_sex",
            "off_race",
            "off_ethnic",
            "weapon",
            "weapon_code",
            "relationship",
            "circumstance",
            "subcircum",
            "vic_count",
            "off_count",
            "file_date",
            "msa",
            "msa_fips_code",
            "decade",
            "latitude",
            "longitude",
        ]

        return chunk[db_columns]

    def import_murder_data(self) -> None:
        """Import Murder Data CSV into database.

        Loads the 894,636 record CSV file in chunks of 10,000 rows, applies
        all transformations, and inserts into the cases table. Reports progress
        via callback if registered.

        Raises:
            FileNotFoundError: If Murder Data CSV is not found
            pd.errors.ParserError: If CSV parsing fails
            sqlite3.OperationalError: If database insert fails
        """
        data_path = get_data_path()
        csv_path = data_path / "Murder Data SHR65 2023.csv"

        if not csv_path.exists():
            raise FileNotFoundError(f"Murder Data CSV not found: {csv_path}")

        logger.info(f"Starting import from: {csv_path}")
        logger.info(f"Expected records: {self.total_rows}")

        self.processed_rows = 0
        chunk_size = 10000

        try:
            # Read and process CSV in chunks for memory efficiency
            for chunk_num, chunk in enumerate(
                pd.read_csv(csv_path, chunksize=chunk_size), start=1
            ):
                logger.info(f"Processing chunk {chunk_num} ({len(chunk)} rows)...")

                # Apply transformations
                transformed_chunk = self.transform_chunk(chunk)

                # Insert into database
                with get_db_connection() as conn:
                    transformed_chunk.to_sql(
                        "cases", conn, if_exists="append", index=False, method="multi"
                    )

                # Update progress
                self.processed_rows += len(chunk)
                self._report_progress("importing")

                logger.info(
                    f"Chunk {chunk_num} complete. "
                    f"Total processed: {self.processed_rows}/{self.total_rows}"
                )

            logger.info(f"Import complete! Total records imported: {self.processed_rows}")

        except Exception as e:
            logger.error(f"Import failed: {e}", exc_info=True)
            raise

    def run_full_setup(self) -> None:
        """Run complete database setup: schema, import, indexes.

        Executes the full setup pipeline:
        1. Create database schema (all tables)
        2. Initialize metadata
        3. Import CSV data (894,636 records)
        4. Create indexes (for performance)
        5. Mark setup as complete

        Raises:
            Exception: If any setup step fails (transaction will rollback)
        """
        logger.info("=" * 60)
        logger.info("Starting full database setup...")
        logger.info("=" * 60)

        try:
            # Step 1: Create schema
            logger.info("Step 1/5: Creating database schema...")
            create_schema()
            self._report_progress("schema")

            # Step 2: Initialize metadata
            logger.info("Step 2/5: Initializing metadata...")
            initialize_metadata()
            self._report_progress("metadata")

            # Step 3: Import data
            logger.info("Step 3/5: Importing CSV data...")
            self.import_murder_data()

            # Step 4: Create indexes
            logger.info("Step 4/5: Creating database indexes...")
            self._report_progress("indexing")
            create_indexes()

            # Step 5: Mark complete
            logger.info("Step 5/5: Marking setup as complete...")
            mark_setup_complete()
            self._report_progress("complete")

            logger.info("=" * 60)
            logger.info("Database setup completed successfully!")
            logger.info("=" * 60)

        except Exception as e:
            logger.error("=" * 60)
            logger.error(f"Database setup FAILED: {e}")
            logger.error("=" * 60)
            raise
