"""Tests for cluster API endpoints.

Tests POST /api/clusters/analyze, GET /api/clusters/:id,
GET /api/clusters/:id/cases, and GET /api/clusters/:id/export.
"""

import csv
import io
import json
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture
def client(populated_test_db):
    """Create test client with mocked database."""
    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = populated_test_db
        yield TestClient(app)


class TestAnalyzeClusters:
    """Test POST /api/clusters/analyze endpoint."""

    def test_analyze_clusters_with_minimal_config(self, client):
        """Test cluster analysis with minimal configuration."""
        payload = {
            "min_cluster_size": 5,
            "max_solve_rate": 33.0,
            "similarity_threshold": 70.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        assert "clusters" in data
        assert "total_clusters" in data
        assert "total_cases_analyzed" in data
        assert "analysis_time_seconds" in data
        assert "config" in data

        assert isinstance(data["clusters"], list)
        assert isinstance(data["total_clusters"], int)
        assert isinstance(data["analysis_time_seconds"], (int, float))

    def test_analyze_clusters_with_custom_weights(self, client):
        """Test cluster analysis with custom similarity weights."""
        payload = {
            "min_cluster_size": 5,
            "max_solve_rate": 33.0,
            "similarity_threshold": 70.0,
            "weights": {
                "geographic": 40.0,
                "weapon": 30.0,
                "victim_sex": 15.0,
                "victim_age": 10.0,
                "temporal": 3.0,
                "victim_race": 2.0,
            },
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        # Verify config was stored
        assert data["config"]["weights"]["geographic"] == 40.0
        assert data["config"]["weights"]["weapon"] == 30.0

    def test_analyze_clusters_with_filters(self, client):
        """Test cluster analysis with case filters."""
        payload = {
            "min_cluster_size": 3,
            "max_solve_rate": 50.0,
            "similarity_threshold": 60.0,
            "filter": {
                "states": ["ILLINOIS"],
                "year_min": 1990,
                "year_max": 2000,
                "solved": 0,
            },
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        # Should analyze only cases matching filters
        assert data["total_cases_analyzed"] >= 0

    def test_analyze_clusters_returns_sorted_by_unsolved_count(self, client):
        """Test that clusters are sorted by unsolved count descending."""
        payload = {
            "min_cluster_size": 3,
            "max_solve_rate": 50.0,
            "similarity_threshold": 60.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        if len(data["clusters"]) > 1:
            unsolved_counts = [cluster["unsolved_cases"] for cluster in data["clusters"]]
            # Check that unsolved counts are in descending order
            for i in range(len(unsolved_counts) - 1):
                assert unsolved_counts[i] >= unsolved_counts[i + 1]

    def test_analyze_clusters_respects_min_cluster_size(self, client):
        """Test that clusters smaller than min_cluster_size are filtered."""
        payload = {
            "min_cluster_size": 10,  # High threshold
            "max_solve_rate": 100.0,
            "similarity_threshold": 50.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        # All returned clusters should have >= min_cluster_size cases
        for cluster in data["clusters"]:
            assert cluster["total_cases"] >= 10

    def test_analyze_clusters_respects_max_solve_rate(self, client):
        """Test that clusters with high solve rates are filtered."""
        payload = {
            "min_cluster_size": 3,
            "max_solve_rate": 20.0,  # Low threshold
            "similarity_threshold": 50.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        # All returned clusters should have solve_rate <= max_solve_rate
        for cluster in data["clusters"]:
            assert cluster["solve_rate"] <= 20.0

    def test_analyze_clusters_returns_empty_list_when_no_clusters_found(self, client):
        """Test that empty list is returned when no clusters meet criteria."""
        payload = {
            "min_cluster_size": 100,  # Impossibly high
            "max_solve_rate": 0.0,  # Impossibly low
            "similarity_threshold": 99.0,  # Impossibly high
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        assert data["total_clusters"] == 0
        assert data["clusters"] == []

    def test_analyze_clusters_includes_all_cluster_fields(self, client):
        """Test that cluster summaries include all required fields."""
        payload = {
            "min_cluster_size": 3,
            "max_solve_rate": 50.0,
            "similarity_threshold": 60.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        if len(data["clusters"]) > 0:
            cluster = data["clusters"][0]

            required_fields = [
                "cluster_id",
                "location_description",
                "total_cases",
                "solved_cases",
                "unsolved_cases",
                "solve_rate",
                "avg_similarity_score",
                "first_year",
                "last_year",
                "primary_weapon",
                "primary_victim_sex",
                "avg_victim_age",
            ]

            for field in required_fields:
                assert field in cluster

    def test_analyze_clusters_handles_empty_dataset(self, client):
        """Test cluster analysis with filters that match no cases."""
        payload = {
            "min_cluster_size": 5,
            "max_solve_rate": 33.0,
            "similarity_threshold": 70.0,
            "filter": {
                "states": ["NONEXISTENT_STATE"],
            },
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        assert data["total_clusters"] == 0
        assert data["total_cases_analyzed"] == 0
        assert data["clusters"] == []

    def test_analyze_clusters_handles_errors_gracefully(self, client):
        """Test that analyze_clusters handles errors gracefully."""
        with patch("backend.services.cluster_service.run_cluster_analysis") as mock_analyze:
            mock_analyze.side_effect = Exception("Analysis failed")

            payload = {
                "min_cluster_size": 5,
                "max_solve_rate": 33.0,
                "similarity_threshold": 70.0,
            }

            response = client.post("/api/clusters/analyze", json=payload)

            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()


class TestGetCluster:
    """Test GET /api/clusters/:id endpoint."""

    def create_test_cluster(self, client):
        """Helper to create a test cluster."""
        payload = {
            "min_cluster_size": 3,
            "max_solve_rate": 50.0,
            "similarity_threshold": 60.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)
        data = response.json()

        if len(data["clusters"]) > 0:
            return data["clusters"][0]["cluster_id"]
        return None

    def test_get_cluster_returns_cluster_details(self, client):
        """Test that get_cluster returns full cluster details."""
        cluster_id = self.create_test_cluster(client)

        if cluster_id:
            response = client.get(f"/api/clusters/{cluster_id}")

            assert response.status_code == 200
            data = response.json()

            assert data["cluster_id"] == cluster_id
            assert "location_description" in data
            assert "total_cases" in data
            assert "case_ids" in data
            assert isinstance(data["case_ids"], list)

    def test_get_cluster_includes_case_ids(self, client):
        """Test that get_cluster includes list of case IDs."""
        cluster_id = self.create_test_cluster(client)

        if cluster_id:
            response = client.get(f"/api/clusters/{cluster_id}")

            assert response.status_code == 200
            data = response.json()

            assert "case_ids" in data
            assert len(data["case_ids"]) == data["total_cases"]

    def test_get_cluster_returns_404_for_nonexistent_cluster(self, client):
        """Test that get_cluster returns 404 for nonexistent cluster ID."""
        response = client.get("/api/clusters/NONEXISTENT_CLUSTER_ID")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_cluster_returns_all_required_fields(self, client):
        """Test that get_cluster returns all required fields."""
        cluster_id = self.create_test_cluster(client)

        if cluster_id:
            response = client.get(f"/api/clusters/{cluster_id}")

            assert response.status_code == 200
            data = response.json()

            required_fields = [
                "cluster_id",
                "location_description",
                "total_cases",
                "solved_cases",
                "unsolved_cases",
                "solve_rate",
                "avg_similarity_score",
                "first_year",
                "last_year",
                "primary_weapon",
                "primary_victim_sex",
                "avg_victim_age",
                "case_ids",
            ]

            for field in required_fields:
                assert field in data

    def test_get_cluster_handles_errors_gracefully(self, client):
        """Test that get_cluster handles errors gracefully."""
        with patch("backend.services.cluster_service.get_cluster_detail") as mock_get:
            mock_get.side_effect = Exception("Database error")

            response = client.get("/api/clusters/TEST_CLUSTER")

            assert response.status_code == 500


class TestGetClusterCases:
    """Test GET /api/clusters/:id/cases endpoint."""

    def create_test_cluster(self, client):
        """Helper to create a test cluster."""
        payload = {
            "min_cluster_size": 3,
            "max_solve_rate": 50.0,
            "similarity_threshold": 60.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)
        data = response.json()

        if len(data["clusters"]) > 0:
            return data["clusters"][0]["cluster_id"]
        return None

    def test_get_cluster_cases_returns_case_list(self, client):
        """Test that get_cluster_cases returns list of cases."""
        cluster_id = self.create_test_cluster(client)

        if cluster_id:
            response = client.get(f"/api/clusters/{cluster_id}/cases")

            assert response.status_code == 200
            data = response.json()

            assert isinstance(data, list)
            assert len(data) > 0

    def test_get_cluster_cases_returns_full_case_details(self, client):
        """Test that get_cluster_cases returns full case details."""
        cluster_id = self.create_test_cluster(client)

        if cluster_id:
            response = client.get(f"/api/clusters/{cluster_id}/cases")

            assert response.status_code == 200
            data = response.json()

            if len(data) > 0:
                case = data[0]

                # Check for key case fields
                assert "id" in case
                assert "state" in case
                assert "year" in case
                assert "solved" in case
                assert "weapon" in case

    def test_get_cluster_cases_returns_404_for_nonexistent_cluster(self, client):
        """Test that get_cluster_cases returns 404 for nonexistent cluster."""
        response = client.get("/api/clusters/NONEXISTENT_CLUSTER_ID/cases")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_cluster_cases_handles_errors_gracefully(self, client):
        """Test that get_cluster_cases handles errors gracefully."""
        with patch("backend.services.cluster_service.get_cluster_cases") as mock_get:
            mock_get.side_effect = Exception("Database error")

            response = client.get("/api/clusters/TEST_CLUSTER/cases")

            assert response.status_code == 500


class TestExportClusterCases:
    """Test GET /api/clusters/:id/export endpoint."""

    def create_test_cluster(self, client):
        """Helper to create a test cluster."""
        payload = {
            "min_cluster_size": 3,
            "max_solve_rate": 50.0,
            "similarity_threshold": 60.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)
        data = response.json()

        if len(data["clusters"]) > 0:
            return data["clusters"][0]["cluster_id"]
        return None

    def test_export_cluster_cases_returns_csv(self, client):
        """Test that export_cluster_cases returns CSV data."""
        cluster_id = self.create_test_cluster(client)

        if cluster_id:
            response = client.get(f"/api/clusters/{cluster_id}/export")

            assert response.status_code == 200
            assert response.headers["content-type"] == "text/csv; charset=utf-8"
            assert "attachment" in response.headers["content-disposition"]

    def test_export_cluster_cases_csv_has_correct_format(self, client):
        """Test that exported CSV has correct format."""
        cluster_id = self.create_test_cluster(client)

        if cluster_id:
            response = client.get(f"/api/clusters/{cluster_id}/export")

            assert response.status_code == 200

            # Parse CSV content
            csv_content = response.text
            csv_reader = csv.DictReader(io.StringIO(csv_content))

            # Should have header row with all case fields
            rows = list(csv_reader)
            assert len(rows) > 0

            # Check for key fields in header
            first_row = rows[0]
            assert "id" in first_row
            assert "state" in first_row
            assert "year" in first_row

    def test_export_cluster_cases_includes_all_cases(self, client):
        """Test that export includes all cases in the cluster."""
        cluster_id = self.create_test_cluster(client)

        if cluster_id:
            # Get cluster details to know how many cases to expect
            cluster_response = client.get(f"/api/clusters/{cluster_id}")
            cluster_data = cluster_response.json()
            expected_case_count = cluster_data["total_cases"]

            # Get export
            export_response = client.get(f"/api/clusters/{cluster_id}/export")

            assert export_response.status_code == 200

            # Count rows in CSV
            csv_content = export_response.text
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            rows = list(csv_reader)

            assert len(rows) == expected_case_count

    def test_export_cluster_cases_returns_404_for_nonexistent_cluster(self, client):
        """Test that export returns 404 for nonexistent cluster."""
        response = client.get("/api/clusters/NONEXISTENT_CLUSTER_ID/export")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_export_cluster_cases_has_correct_filename(self, client):
        """Test that export has correct filename in headers."""
        cluster_id = self.create_test_cluster(client)

        if cluster_id:
            response = client.get(f"/api/clusters/{cluster_id}/export")

            assert response.status_code == 200

            content_disposition = response.headers["content-disposition"]
            assert f"cluster_{cluster_id}_cases.csv" in content_disposition

    def test_export_cluster_cases_handles_errors_gracefully(self, client):
        """Test that export handles errors gracefully."""
        with patch("backend.services.cluster_service.get_cluster_cases") as mock_get:
            mock_get.side_effect = Exception("Database error")

            response = client.get("/api/clusters/TEST_CLUSTER/export")

            assert response.status_code == 500


class TestClusterPersistence:
    """Test that cluster results are persisted correctly."""

    def test_clusters_are_stored_in_database(self, client, populated_test_db):
        """Test that cluster results are stored in the database."""
        payload = {
            "min_cluster_size": 3,
            "max_solve_rate": 50.0,
            "similarity_threshold": 60.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        if len(data["clusters"]) > 0:
            cluster_id = data["clusters"][0]["cluster_id"]

            # Verify cluster is in database
            cursor = populated_test_db.execute(
                "SELECT * FROM cluster_results WHERE cluster_id = ?", (cluster_id,)
            )
            result = cursor.fetchone()

            assert result is not None
            assert result["cluster_id"] == cluster_id

    def test_cluster_memberships_are_stored(self, client, populated_test_db):
        """Test that cluster case memberships are stored."""
        payload = {
            "min_cluster_size": 3,
            "max_solve_rate": 50.0,
            "similarity_threshold": 60.0,
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        if len(data["clusters"]) > 0:
            cluster_id = data["clusters"][0]["cluster_id"]
            expected_case_count = data["clusters"][0]["total_cases"]

            # Verify memberships in database
            cursor = populated_test_db.execute(
                "SELECT COUNT(*) as count FROM cluster_membership WHERE cluster_id = ?",
                (cluster_id,),
            )
            result = cursor.fetchone()

            assert result["count"] == expected_case_count

    def test_cluster_config_is_stored_as_json(self, client, populated_test_db):
        """Test that cluster configuration is stored as JSON."""
        payload = {
            "min_cluster_size": 5,
            "max_solve_rate": 33.0,
            "similarity_threshold": 70.0,
            "weights": {
                "geographic": 40.0,
                "weapon": 30.0,
                "victim_sex": 15.0,
                "victim_age": 10.0,
                "temporal": 3.0,
                "victim_race": 2.0,
            },
        }

        response = client.post("/api/clusters/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        if len(data["clusters"]) > 0:
            cluster_id = data["clusters"][0]["cluster_id"]

            # Verify config in database
            cursor = populated_test_db.execute(
                "SELECT config_json FROM cluster_results WHERE cluster_id = ?", (cluster_id,)
            )
            result = cursor.fetchone()

            config = json.loads(result["config_json"])
            assert config["min_cluster_size"] == 5
            assert config["weights"]["geographic"] == 40.0
