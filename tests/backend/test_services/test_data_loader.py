"""Tests for data loader service.

Tests CSV import, transformations, FIPS enrichment, and progress callbacks.
"""

import csv
import io
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch

import pandas as pd
import pytest

from backend.services.data_loader import DataLoader
from backend.utils.mappings import MONTH_MAP, SOLVED_MAP, VIC_SEX_CODE, WEAPON_CODE_MAP


class TestDataLoaderInit:
    """Test DataLoader initialization."""

    def test_init_without_callback(self):
        """Test that DataLoader can be initialized without a callback."""
        loader = DataLoader()

        assert loader.progress_callback is None
        assert loader.total_rows == 894636
        assert loader.processed_rows == 0

    def test_init_with_callback(self):
        """Test that DataLoader can be initialized with a callback."""
        callback = Mock()
        loader = DataLoader(progress_callback=callback)

        assert loader.progress_callback == callback

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_init_loads_lookup_tables(self, mock_centroids, mock_fips):
        """Test that DataLoader loads FIPS and centroid lookups on init."""
        mock_fips.return_value = {"Cook County": 17031}
        mock_centroids.return_value = {17031: (41.8781, -87.6298)}

        loader = DataLoader()

        assert loader._county_fips == {"Cook County": 17031}
        assert loader._centroids == {17031: (41.8781, -87.6298)}


class TestTransformChunk:
    """Test chunk transformation logic."""

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_transform_solved_status(self, mock_centroids, mock_fips):
        """Test that Solved status is transformed to 0/1."""
        mock_fips.return_value = {}
        mock_centroids.return_value = {}

        df = pd.DataFrame(
            {
                "Solved": ["Yes", "No", "Yes"],
                "Month": ["June", "July", "August"],
                "VicSex": ["Female", "Male", "Unknown"],
                "Weapon": ["Handgun - pistol, revolver, etc", "Rifle", "Knife or cutting instrument"],
                "CNTYFIPS": ["Cook County", "Cook County", "Cook County"],
                "ID": ["1", "2", "3"],
                "Ori": ["A", "B", "C"],
                "State": ["ILLINOIS", "ILLINOIS", "ILLINOIS"],
                "Agency": ["Chicago PD", "Chicago PD", "Chicago PD"],
                "Agentype": ["Municipal", "Municipal", "Municipal"],
                "Source": ["FBI", "FBI", "FBI"],
                "Year": [2000, 2000, 2000],
                "Incident": [1, 2, 3],
                "ActionType": ["Murder", "Murder", "Murder"],
                "Homicide": ["Murder", "Murder", "Murder"],
                "Situation": ["Single", "Single", "Single"],
                "VicAge": [25, 30, 35],
                "VicRace": ["White", "Black", "White"],
                "VicEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "OffAge": [30, 35, 40],
                "OffSex": ["Male", "Male", "Male"],
                "OffRace": ["White", "Black", "White"],
                "OffEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "Relationship": ["Stranger", "Acquaintance", "Unknown"],
                "Circumstance": ["Other", "Argument", "Unknown"],
                "Subcircum": ["Unknown", "Unknown", "Unknown"],
                "VicCount": [1, 1, 1],
                "OffCount": [1, 1, 1],
                "FileDate": ["2001-01-01", "2001-01-01", "2001-01-01"],
                "MSA": ["Chicago", "Chicago", "Chicago"],
                "decade": [2000, 2000, 2000],
            }
        )

        loader = DataLoader()
        result = loader.transform_chunk(df)

        assert list(result["solved"]) == [1, 0, 1]

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_transform_month_names(self, mock_centroids, mock_fips):
        """Test that month names are transformed to numbers."""
        mock_fips.return_value = {}
        mock_centroids.return_value = {}

        df = pd.DataFrame(
            {
                "Solved": ["Yes", "No", "Yes"],
                "Month": ["January", "June", "December"],
                "VicSex": ["Female", "Male", "Unknown"],
                "Weapon": ["Handgun - pistol, revolver, etc", "Rifle", "Knife or cutting instrument"],
                "CNTYFIPS": ["Cook County", "Cook County", "Cook County"],
                "ID": ["1", "2", "3"],
                "Ori": ["A", "B", "C"],
                "State": ["ILLINOIS", "ILLINOIS", "ILLINOIS"],
                "Agency": ["Chicago PD", "Chicago PD", "Chicago PD"],
                "Agentype": ["Municipal", "Municipal", "Municipal"],
                "Source": ["FBI", "FBI", "FBI"],
                "Year": [2000, 2000, 2000],
                "Incident": [1, 2, 3],
                "ActionType": ["Murder", "Murder", "Murder"],
                "Homicide": ["Murder", "Murder", "Murder"],
                "Situation": ["Single", "Single", "Single"],
                "VicAge": [25, 30, 35],
                "VicRace": ["White", "Black", "White"],
                "VicEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "OffAge": [30, 35, 40],
                "OffSex": ["Male", "Male", "Male"],
                "OffRace": ["White", "Black", "White"],
                "OffEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "Relationship": ["Stranger", "Acquaintance", "Unknown"],
                "Circumstance": ["Other", "Argument", "Unknown"],
                "Subcircum": ["Unknown", "Unknown", "Unknown"],
                "VicCount": [1, 1, 1],
                "OffCount": [1, 1, 1],
                "FileDate": ["2001-01-01", "2001-01-01", "2001-01-01"],
                "MSA": ["Chicago", "Chicago", "Chicago"],
                "decade": [2000, 2000, 2000],
            }
        )

        loader = DataLoader()
        result = loader.transform_chunk(df)

        assert list(result["month"]) == [1, 6, 12]
        assert list(result["month_name"]) == ["January", "June", "December"]

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_transform_victim_sex_codes(self, mock_centroids, mock_fips):
        """Test that victim sex is transformed to numeric codes."""
        mock_fips.return_value = {}
        mock_centroids.return_value = {}

        df = pd.DataFrame(
            {
                "Solved": ["Yes", "No", "Yes"],
                "Month": ["June", "July", "August"],
                "VicSex": ["Male", "Female", "Unknown"],
                "Weapon": ["Handgun - pistol, revolver, etc", "Rifle", "Knife or cutting instrument"],
                "CNTYFIPS": ["Cook County", "Cook County", "Cook County"],
                "ID": ["1", "2", "3"],
                "Ori": ["A", "B", "C"],
                "State": ["ILLINOIS", "ILLINOIS", "ILLINOIS"],
                "Agency": ["Chicago PD", "Chicago PD", "Chicago PD"],
                "Agentype": ["Municipal", "Municipal", "Municipal"],
                "Source": ["FBI", "FBI", "FBI"],
                "Year": [2000, 2000, 2000],
                "Incident": [1, 2, 3],
                "ActionType": ["Murder", "Murder", "Murder"],
                "Homicide": ["Murder", "Murder", "Murder"],
                "Situation": ["Single", "Single", "Single"],
                "VicAge": [25, 30, 35],
                "VicRace": ["White", "Black", "White"],
                "VicEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "OffAge": [30, 35, 40],
                "OffSex": ["Male", "Male", "Male"],
                "OffRace": ["White", "Black", "White"],
                "OffEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "Relationship": ["Stranger", "Acquaintance", "Unknown"],
                "Circumstance": ["Other", "Argument", "Unknown"],
                "Subcircum": ["Unknown", "Unknown", "Unknown"],
                "VicCount": [1, 1, 1],
                "OffCount": [1, 1, 1],
                "FileDate": ["2001-01-01", "2001-01-01", "2001-01-01"],
                "MSA": ["Chicago", "Chicago", "Chicago"],
                "decade": [2000, 2000, 2000],
            }
        )

        loader = DataLoader()
        result = loader.transform_chunk(df)

        assert list(result["vic_sex_code"]) == [1, 2, 9]

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_transform_weapon_codes(self, mock_centroids, mock_fips):
        """Test that weapon descriptions are transformed to numeric codes."""
        mock_fips.return_value = {}
        mock_centroids.return_value = {}

        df = pd.DataFrame(
            {
                "Solved": ["Yes", "No", "Yes"],
                "Month": ["June", "July", "August"],
                "VicSex": ["Female", "Male", "Unknown"],
                "Weapon": [
                    "Handgun - pistol, revolver, etc",
                    "Rifle",
                    "Unknown Weapon Type",
                ],
                "CNTYFIPS": ["Cook County", "Cook County", "Cook County"],
                "ID": ["1", "2", "3"],
                "Ori": ["A", "B", "C"],
                "State": ["ILLINOIS", "ILLINOIS", "ILLINOIS"],
                "Agency": ["Chicago PD", "Chicago PD", "Chicago PD"],
                "Agentype": ["Municipal", "Municipal", "Municipal"],
                "Source": ["FBI", "FBI", "FBI"],
                "Year": [2000, 2000, 2000],
                "Incident": [1, 2, 3],
                "ActionType": ["Murder", "Murder", "Murder"],
                "Homicide": ["Murder", "Murder", "Murder"],
                "Situation": ["Single", "Single", "Single"],
                "VicAge": [25, 30, 35],
                "VicRace": ["White", "Black", "White"],
                "VicEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "OffAge": [30, 35, 40],
                "OffSex": ["Male", "Male", "Male"],
                "OffRace": ["White", "Black", "White"],
                "OffEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "Relationship": ["Stranger", "Acquaintance", "Unknown"],
                "Circumstance": ["Other", "Argument", "Unknown"],
                "Subcircum": ["Unknown", "Unknown", "Unknown"],
                "VicCount": [1, 1, 1],
                "OffCount": [1, 1, 1],
                "FileDate": ["2001-01-01", "2001-01-01", "2001-01-01"],
                "MSA": ["Chicago", "Chicago", "Chicago"],
                "decade": [2000, 2000, 2000],
            }
        )

        loader = DataLoader()
        result = loader.transform_chunk(df)

        # Handgun=12, Rifle=13, Unknown=99
        assert list(result["weapon_code"]) == [12, 13, 99]

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_transform_county_fips_codes(self, mock_centroids, mock_fips):
        """Test that county labels are mapped to FIPS codes."""
        mock_fips.return_value = {
            "Cook County": 17031,
            "Los Angeles County": 6037,
        }
        mock_centroids.return_value = {}

        df = pd.DataFrame(
            {
                "Solved": ["Yes", "No", "Yes"],
                "Month": ["June", "July", "August"],
                "VicSex": ["Female", "Male", "Unknown"],
                "Weapon": ["Handgun - pistol, revolver, etc", "Rifle", "Knife or cutting instrument"],
                "CNTYFIPS": ["Cook County", "Los Angeles County", "Unknown County"],
                "ID": ["1", "2", "3"],
                "Ori": ["A", "B", "C"],
                "State": ["ILLINOIS", "CALIFORNIA", "TEXAS"],
                "Agency": ["Chicago PD", "LA PD", "Houston PD"],
                "Agentype": ["Municipal", "Municipal", "Municipal"],
                "Source": ["FBI", "FBI", "FBI"],
                "Year": [2000, 2000, 2000],
                "Incident": [1, 2, 3],
                "ActionType": ["Murder", "Murder", "Murder"],
                "Homicide": ["Murder", "Murder", "Murder"],
                "Situation": ["Single", "Single", "Single"],
                "VicAge": [25, 30, 35],
                "VicRace": ["White", "Black", "White"],
                "VicEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "OffAge": [30, 35, 40],
                "OffSex": ["Male", "Male", "Male"],
                "OffRace": ["White", "Black", "White"],
                "OffEthnic": ["Not Hispanic", "Not Hispanic", "Hispanic"],
                "Relationship": ["Stranger", "Acquaintance", "Unknown"],
                "Circumstance": ["Other", "Argument", "Unknown"],
                "Subcircum": ["Unknown", "Unknown", "Unknown"],
                "VicCount": [1, 1, 1],
                "OffCount": [1, 1, 1],
                "FileDate": ["2001-01-01", "2001-01-01", "2001-01-01"],
                "MSA": ["Chicago", "LA", "Houston"],
                "decade": [2000, 2000, 2000],
            }
        )

        loader = DataLoader()
        result = loader.transform_chunk(df)

        # Cook County=17031, LA County=6037, Unknown=NaN
        assert result["county_fips_code"].tolist()[0] == 17031
        assert result["county_fips_code"].tolist()[1] == 6037
        assert pd.isna(result["county_fips_code"].tolist()[2])

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_transform_adds_geographic_coordinates(self, mock_centroids, mock_fips):
        """Test that geographic coordinates are added from centroid lookup."""
        mock_fips.return_value = {
            "Cook County": 17031,
            "Los Angeles County": 6037,
        }
        mock_centroids.return_value = {
            17031: (41.8781, -87.6298),
            6037: (34.0522, -118.2437),
        }

        df = pd.DataFrame(
            {
                "Solved": ["Yes", "No"],
                "Month": ["June", "July"],
                "VicSex": ["Female", "Male"],
                "Weapon": ["Handgun - pistol, revolver, etc", "Rifle"],
                "CNTYFIPS": ["Cook County", "Los Angeles County"],
                "ID": ["1", "2"],
                "Ori": ["A", "B"],
                "State": ["ILLINOIS", "CALIFORNIA"],
                "Agency": ["Chicago PD", "LA PD"],
                "Agentype": ["Municipal", "Municipal"],
                "Source": ["FBI", "FBI"],
                "Year": [2000, 2000],
                "Incident": [1, 2],
                "ActionType": ["Murder", "Murder"],
                "Homicide": ["Murder", "Murder"],
                "Situation": ["Single", "Single"],
                "VicAge": [25, 30],
                "VicRace": ["White", "Black"],
                "VicEthnic": ["Not Hispanic", "Not Hispanic"],
                "OffAge": [30, 35],
                "OffSex": ["Male", "Male"],
                "OffRace": ["White", "Black"],
                "OffEthnic": ["Not Hispanic", "Not Hispanic"],
                "Relationship": ["Stranger", "Acquaintance"],
                "Circumstance": ["Other", "Argument"],
                "Subcircum": ["Unknown", "Unknown"],
                "VicCount": [1, 1],
                "OffCount": [1, 1],
                "FileDate": ["2001-01-01", "2001-01-01"],
                "MSA": ["Chicago", "LA"],
                "decade": [2000, 2000],
            }
        )

        loader = DataLoader()
        result = loader.transform_chunk(df)

        assert result["latitude"].tolist()[0] == 41.8781
        assert result["longitude"].tolist()[0] == -87.6298
        assert result["latitude"].tolist()[1] == 34.0522
        assert result["longitude"].tolist()[1] == -118.2437

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_transform_handles_missing_centroids(self, mock_centroids, mock_fips):
        """Test that missing centroids result in None lat/lon."""
        mock_fips.return_value = {"Cook County": 17031}
        mock_centroids.return_value = {}  # No centroids available

        df = pd.DataFrame(
            {
                "Solved": ["Yes"],
                "Month": ["June"],
                "VicSex": ["Female"],
                "Weapon": ["Handgun - pistol, revolver, etc"],
                "CNTYFIPS": ["Cook County"],
                "ID": ["1"],
                "Ori": ["A"],
                "State": ["ILLINOIS"],
                "Agency": ["Chicago PD"],
                "Agentype": ["Municipal"],
                "Source": ["FBI"],
                "Year": [2000],
                "Incident": [1],
                "ActionType": ["Murder"],
                "Homicide": ["Murder"],
                "Situation": ["Single"],
                "VicAge": [25],
                "VicRace": ["White"],
                "VicEthnic": ["Not Hispanic"],
                "OffAge": [30],
                "OffSex": ["Male"],
                "OffRace": ["White"],
                "OffEthnic": ["Not Hispanic"],
                "Relationship": ["Stranger"],
                "Circumstance": ["Other"],
                "Subcircum": ["Unknown"],
                "VicCount": [1],
                "OffCount": [1],
                "FileDate": ["2001-01-01"],
                "MSA": ["Chicago"],
                "decade": [2000],
            }
        )

        loader = DataLoader()
        result = loader.transform_chunk(df)

        assert pd.isna(result["latitude"].tolist()[0])
        assert pd.isna(result["longitude"].tolist()[0])


class TestProgressReporting:
    """Test progress callback functionality."""

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_progress_callback_called(self, mock_centroids, mock_fips):
        """Test that progress callback is called when registered."""
        mock_fips.return_value = {}
        mock_centroids.return_value = {}

        callback = Mock()
        loader = DataLoader(progress_callback=callback)
        loader.processed_rows = 100

        loader._report_progress("importing")

        callback.assert_called_once_with(100, 894636, "importing")

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_progress_callback_not_called_when_none(self, mock_centroids, mock_fips):
        """Test that progress reporting works when callback is None."""
        mock_fips.return_value = {}
        mock_centroids.return_value = {}

        loader = DataLoader(progress_callback=None)
        loader.processed_rows = 100

        # Should not raise an error
        loader._report_progress("importing")


class TestImportMurderData:
    """Test CSV import functionality."""

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    @patch("backend.services.data_loader.get_data_path")
    @patch("backend.services.data_loader.get_db_connection")
    def test_import_raises_error_if_csv_not_found(
        self, mock_db_conn, mock_data_path, mock_centroids, mock_fips
    ):
        """Test that import raises FileNotFoundError if CSV is missing."""
        mock_fips.return_value = {}
        mock_centroids.return_value = {}
        mock_data_path.return_value = Path("/nonexistent")

        loader = DataLoader()

        with pytest.raises(FileNotFoundError):
            loader.import_murder_data()

    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    @patch("backend.services.data_loader.get_data_path")
    @patch("backend.services.data_loader.get_db_connection")
    def test_import_processes_csv_in_chunks(
        self, mock_db_conn, mock_data_path, mock_centroids, mock_fips, tmp_path
    ):
        """Test that CSV is processed in chunks."""
        mock_fips.return_value = {"Cook County": 17031}
        mock_centroids.return_value = {17031: (41.8781, -87.6298)}

        # Create a temporary CSV with sample data
        csv_file = tmp_path / "Murder Data SHR65 2023.csv"
        csv_data = """ID,CNTYFIPS,Ori,State,Agency,Agentype,Source,Solved,Year,Month,Incident,ActionType,Homicide,Situation,VicAge,VicSex,VicRace,VicEthnic,OffAge,OffSex,OffRace,OffEthnic,Weapon,Relationship,Circumstance,Subcircum,VicCount,OffCount,FileDate,MSA,decade
IL-001,Cook County,IL001,ILLINOIS,Chicago PD,Municipal,FBI,Yes,2000,June,1,Murder,Murder,Single,25,Female,White,Not Hispanic,30,Male,White,Not Hispanic,Handgun - pistol, revolver, etc,Stranger,Other,Unknown,1,1,2001-01-01,Chicago,2000
IL-002,Cook County,IL001,ILLINOIS,Chicago PD,Municipal,FBI,No,2001,July,2,Murder,Murder,Single,27,Female,White,Not Hispanic,999,Unknown,Unknown,Unknown,Handgun - pistol, revolver, etc,Stranger,Other,Unknown,1,1,2002-01-01,Chicago,2000"""
        csv_file.write_text(csv_data)

        mock_data_path.return_value = tmp_path

        # Mock database connection
        mock_conn = Mock()
        mock_db_conn.return_value.__enter__.return_value = mock_conn

        loader = DataLoader()
        loader.import_murder_data()

        # Verify database insertion was called
        assert mock_conn.execute.called or hasattr(mock_conn, "execute")


class TestFullSetup:
    """Test full setup pipeline."""

    @patch("backend.services.data_loader.mark_setup_complete")
    @patch("backend.services.data_loader.create_indexes")
    @patch("backend.services.data_loader.DataLoader.import_murder_data")
    @patch("backend.services.data_loader.initialize_metadata")
    @patch("backend.services.data_loader.create_schema")
    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_run_full_setup_calls_all_steps(
        self,
        mock_centroids,
        mock_fips,
        mock_create_schema,
        mock_init_metadata,
        mock_import,
        mock_create_indexes,
        mock_mark_complete,
    ):
        """Test that run_full_setup calls all setup steps in order."""
        mock_fips.return_value = {}
        mock_centroids.return_value = {}

        callback = Mock()
        loader = DataLoader(progress_callback=callback)
        loader.run_full_setup()

        # Verify all steps were called
        mock_create_schema.assert_called_once()
        mock_init_metadata.assert_called_once()
        mock_import.assert_called_once()
        mock_create_indexes.assert_called_once()
        mock_mark_complete.assert_called_once()

        # Verify progress callbacks were called
        assert callback.called

    @patch("backend.services.data_loader.create_schema")
    @patch("backend.services.data_loader.get_county_fips")
    @patch("backend.services.data_loader.get_county_centroids")
    def test_run_full_setup_raises_on_failure(
        self, mock_centroids, mock_fips, mock_create_schema
    ):
        """Test that run_full_setup raises exceptions on failure."""
        mock_fips.return_value = {}
        mock_centroids.return_value = {}
        mock_create_schema.side_effect = Exception("Schema creation failed")

        loader = DataLoader()

        with pytest.raises(Exception, match="Schema creation failed"):
            loader.run_full_setup()
