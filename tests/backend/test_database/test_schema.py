"""Tests for database schema creation and management."""
import sqlite3

import pytest

from backend.database.schema import (
    INDEX_STATEMENTS,
    create_indexes,
    create_schema,
    get_case_count,
    initialize_metadata,
    is_setup_complete,
    mark_setup_complete,
)


class TestSchemaCreation:
    """Test database schema creation."""

    def test_create_schema_creates_all_tables(self, test_db_connection):
        """Test that create_schema creates all 9 required tables."""
        create_schema()

        cursor = test_db_connection.execute(
            """
            SELECT name FROM sqlite_master
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
            """
        )
        tables = [row[0] for row in cursor.fetchall()]

        expected_tables = [
            "case_notes",
            "cases",
            "cluster_membership",
            "cluster_results",
            "collection_cases",
            "collections",
            "metadata",
            "saved_analyses",
            "saved_analysis_clusters",
            "saved_queries",
        ]

        assert sorted(tables) == sorted(expected_tables)

    def test_create_schema_is_idempotent(self, test_db_connection):
        """Test that create_schema can be called multiple times safely."""
        # First call
        create_schema()

        # Second call should not raise an error
        create_schema()

        # Verify tables still exist
        cursor = test_db_connection.execute(
            """
            SELECT COUNT(*) as count FROM sqlite_master
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            """
        )
        count = cursor.fetchone()[0]
        assert count == 10  # 9 app tables + metadata

    def test_cases_table_has_correct_columns(self, test_db_connection):
        """Test that cases table has all required columns."""
        create_schema()

        cursor = test_db_connection.execute("PRAGMA table_info(cases)")
        columns = {row[1] for row in cursor.fetchall()}

        required_columns = {
            "id",
            "state",
            "year",
            "month",
            "solved",
            "vic_age",
            "vic_sex",
            "vic_sex_code",
            "vic_race",
            "vic_ethnic",
            "off_age",
            "off_sex",
            "off_race",
            "weapon",
            "weapon_code",
            "county_fips_code",
            "latitude",
            "longitude",
        }

        assert required_columns.issubset(columns)

    def test_foreign_key_constraints_enabled(self, test_db_connection):
        """Test that foreign key constraints are properly configured."""
        cursor = test_db_connection.execute("PRAGMA foreign_keys")
        result = cursor.fetchone()
        assert result[0] == 1  # Foreign keys should be ON


class TestIndexCreation:
    """Test database index creation."""

    def test_create_indexes_creates_all_indexes(self, test_db_connection):
        """Test that create_indexes creates all 14 required indexes."""
        create_schema()
        create_indexes()

        cursor = test_db_connection.execute(
            """
            SELECT name FROM sqlite_master
            WHERE type='index' AND name LIKE 'idx_%'
            ORDER BY name
            """
        )
        indexes = [row[0] for row in cursor.fetchall()]

        assert len(indexes) == len(INDEX_STATEMENTS)

    def test_create_indexes_is_idempotent(self, test_db_connection):
        """Test that create_indexes can be called multiple times safely."""
        create_schema()

        # First call
        create_indexes()

        # Second call should not raise an error
        create_indexes()

        # Verify indexes still exist
        cursor = test_db_connection.execute(
            """
            SELECT COUNT(*) as count FROM sqlite_master
            WHERE type='index' AND name LIKE 'idx_%'
            """
        )
        count = cursor.fetchone()[0]
        assert count == len(INDEX_STATEMENTS)

    def test_indexes_on_correct_columns(self, test_db_connection):
        """Test that indexes are created on the correct columns."""
        create_schema()
        create_indexes()

        expected_index_names = [
            "idx_state",
            "idx_year",
            "idx_solved",
            "idx_vic_sex",
            "idx_vic_race",
            "idx_weapon",
            "idx_county_fips_code",
            "idx_weapon_code",
            "idx_vic_sex_code",
        ]

        cursor = test_db_connection.execute(
            """
            SELECT name FROM sqlite_master
            WHERE type='index' AND name LIKE 'idx_%'
            """
        )
        indexes = [row[0] for row in cursor.fetchall()]

        for expected_index in expected_index_names:
            assert expected_index in indexes


class TestMetadataManagement:
    """Test metadata table management functions."""

    def test_initialize_metadata_creates_setup_flag(self, test_db_connection):
        """Test that initialize_metadata creates the setup_complete flag."""
        create_schema()
        initialize_metadata()

        cursor = test_db_connection.execute(
            "SELECT value FROM metadata WHERE key = 'setup_complete'"
        )
        result = cursor.fetchone()

        assert result is not None
        assert result[0] == "0"

    def test_initialize_metadata_is_idempotent(self, test_db_connection):
        """Test that initialize_metadata can be called multiple times."""
        create_schema()

        initialize_metadata()
        initialize_metadata()

        cursor = test_db_connection.execute(
            "SELECT COUNT(*) as count FROM metadata WHERE key = 'setup_complete'"
        )
        count = cursor.fetchone()[0]

        assert count == 1  # Should only have one entry

    def test_mark_setup_complete_updates_flag(self, test_db_connection):
        """Test that mark_setup_complete updates the flag to '1'."""
        create_schema()
        initialize_metadata()

        mark_setup_complete()

        cursor = test_db_connection.execute(
            "SELECT value FROM metadata WHERE key = 'setup_complete'"
        )
        result = cursor.fetchone()

        assert result[0] == "1"

    def test_is_setup_complete_returns_false_initially(self, test_db_connection):
        """Test that is_setup_complete returns False before setup."""
        create_schema()
        initialize_metadata()

        assert is_setup_complete() is False

    def test_is_setup_complete_returns_true_after_marking(self, test_db_connection):
        """Test that is_setup_complete returns True after marking complete."""
        create_schema()
        initialize_metadata()
        mark_setup_complete()

        assert is_setup_complete() is True

    def test_is_setup_complete_handles_missing_metadata(self, test_db_connection):
        """Test that is_setup_complete handles missing metadata gracefully."""
        create_schema()
        # Don't initialize metadata

        assert is_setup_complete() is False


class TestUtilityFunctions:
    """Test utility functions for database management."""

    def test_get_case_count_returns_zero_for_empty_database(self, test_db_connection):
        """Test that get_case_count returns 0 for empty database."""
        create_schema()

        count = get_case_count()

        assert count == 0

    def test_get_case_count_returns_correct_count(self, populated_test_db):
        """Test that get_case_count returns correct number of cases."""
        count = get_case_count()

        # Sample data has 6 cases (from conftest.py)
        assert count == 6

    def test_get_case_count_handles_missing_table_gracefully(self, test_db_connection):
        """Test that get_case_count handles missing table gracefully."""
        # Don't create schema

        count = get_case_count()

        assert count == 0  # Should return 0, not raise an error
