"""Tests for case API endpoints.

Tests GET /api/cases, GET /api/cases/:id, and GET /api/stats/summary.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

from backend.main import app


@pytest.fixture
def client(populated_test_db):
    """Create test client with mocked database."""
    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = populated_test_db
        yield TestClient(app)


class TestListCases:
    """Test GET /api/cases endpoint."""

    def test_list_cases_returns_all_cases_without_filters(self, client):
        """Test that list_cases returns all cases when no filters are applied."""
        response = client.get("/api/cases")

        assert response.status_code == 200
        data = response.json()

        assert "cases" in data
        assert "pagination" in data
        assert len(data["cases"]) > 0
        assert data["pagination"]["current_page_size"] > 0

    def test_list_cases_filters_by_state(self, client):
        """Test that list_cases filters cases by state."""
        response = client.get("/api/cases?states=ILLINOIS")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should be from Illinois
        for case in data["cases"]:
            assert case["state"] == "ILLINOIS"

    def test_list_cases_filters_by_multiple_states(self, client):
        """Test that list_cases filters by multiple states."""
        response = client.get("/api/cases?states=ILLINOIS,CALIFORNIA")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should be from Illinois or California
        for case in data["cases"]:
            assert case["state"] in ["ILLINOIS", "CALIFORNIA"]

    def test_list_cases_filters_by_year_range(self, client):
        """Test that list_cases filters cases by year range."""
        response = client.get("/api/cases?year_min=1990&year_max=1992")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should be within year range
        for case in data["cases"]:
            assert 1990 <= case["year"] <= 1992

    def test_list_cases_filters_by_solved_status(self, client):
        """Test that list_cases filters cases by solved status."""
        response = client.get("/api/cases?solved=0")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should be unsolved
        for case in data["cases"]:
            assert case["solved"] == 0

    def test_list_cases_filters_by_victim_sex(self, client):
        """Test that list_cases filters cases by victim sex."""
        response = client.get("/api/cases?vic_sex=Female")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should have female victims
        for case in data["cases"]:
            assert case["vic_sex"] == "Female"

    def test_list_cases_filters_by_victim_age_range(self, client):
        """Test that list_cases filters cases by victim age range."""
        response = client.get("/api/cases?vic_age_min=25&vic_age_max=30")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should have victims in age range (excluding unknown)
        for case in data["cases"]:
            if case["vic_age"] != 999:
                assert 25 <= case["vic_age"] <= 30

    def test_list_cases_includes_unknown_age_when_requested(self, client):
        """Test that list_cases includes unknown ages when requested."""
        response = client.get("/api/cases?vic_age_min=25&vic_age_max=30&include_unknown_age=true")

        assert response.status_code == 200
        data = response.json()

        # Should include cases with age 999 or in range
        has_unknown = any(case["vic_age"] == 999 for case in data["cases"])
        has_in_range = any(25 <= case["vic_age"] <= 30 for case in data["cases"] if case["vic_age"] != 999)

        # At least one of these should be true (depending on sample data)
        assert has_unknown or has_in_range

    def test_list_cases_filters_by_weapon(self, client):
        """Test that list_cases filters cases by weapon type."""
        response = client.get("/api/cases?weapon=Strangulation - hanging")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should use specified weapon
        for case in data["cases"]:
            assert case["weapon"] == "Strangulation - hanging"

    def test_list_cases_filters_by_county(self, client):
        """Test that list_cases filters cases by county."""
        response = client.get("/api/cases?county=Cook County")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should be from Cook County
        for case in data["cases"]:
            assert case["cntyfips"] == "Cook County"

    def test_list_cases_filters_by_agency_search(self, client):
        """Test that list_cases filters cases by agency name substring."""
        response = client.get("/api/cases?agency_search=Chicago")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should have agency containing "Chicago"
        for case in data["cases"]:
            assert "Chicago" in case["agency"]

    def test_list_cases_filters_by_case_id(self, client):
        """Test that list_cases filters by exact case ID."""
        # First, get a case ID from the sample data
        all_cases = client.get("/api/cases").json()
        if len(all_cases["cases"]) > 0:
            target_id = all_cases["cases"][0]["id"]

            response = client.get(f"/api/cases?case_id={target_id}")

            assert response.status_code == 200
            data = response.json()

            assert len(data["cases"]) == 1
            assert data["cases"][0]["id"] == target_id

    def test_list_cases_combines_multiple_filters(self, client):
        """Test that list_cases correctly combines multiple filters."""
        response = client.get("/api/cases?states=ILLINOIS&year_min=1990&solved=0&vic_sex=Female")

        assert response.status_code == 200
        data = response.json()

        # All returned cases should match ALL filters
        for case in data["cases"]:
            assert case["state"] == "ILLINOIS"
            assert case["year"] >= 1990
            assert case["solved"] == 0
            assert case["vic_sex"] == "Female"

    def test_list_cases_respects_limit_parameter(self, client):
        """Test that list_cases respects the limit parameter."""
        response = client.get("/api/cases?limit=2")

        assert response.status_code == 200
        data = response.json()

        assert len(data["cases"]) <= 2
        assert data["pagination"]["current_page_size"] <= 2

    def test_list_cases_pagination_cursor_works(self, client):
        """Test that pagination cursor works correctly."""
        # Get first page
        response1 = client.get("/api/cases?limit=2")
        data1 = response1.json()

        if data1["pagination"]["has_more"]:
            cursor = data1["pagination"]["next_cursor"]

            # Get second page
            response2 = client.get(f"/api/cases?limit=2&cursor={cursor}")
            data2 = response2.json()

            assert response2.status_code == 200
            # Cases on second page should be different from first page
            first_page_ids = {case["id"] for case in data1["cases"]}
            second_page_ids = {case["id"] for case in data2["cases"]}
            assert first_page_ids.isdisjoint(second_page_ids)

    def test_list_cases_pagination_has_more_flag(self, client):
        """Test that has_more flag is set correctly."""
        response = client.get("/api/cases?limit=2")

        assert response.status_code == 200
        data = response.json()

        # If we have more than 2 cases, has_more should be True
        if data["pagination"]["total_count"] > 2:
            assert data["pagination"]["has_more"] is True
            assert data["pagination"]["next_cursor"] is not None
        else:
            assert data["pagination"]["has_more"] is False
            assert data["pagination"]["next_cursor"] is None

    def test_list_cases_large_result_warning(self, client):
        """Test that large_result_warning flag is set for large result sets."""
        # This test depends on having > 50k cases, which won't be in test data
        response = client.get("/api/cases")

        assert response.status_code == 200
        data = response.json()

        # With test data, this should be False
        assert data["pagination"]["large_result_warning"] is False

    def test_list_cases_returns_400_for_invalid_parameters(self, client):
        """Test that list_cases returns 400 for invalid parameters."""
        response = client.get("/api/cases?year_min=invalid")

        assert response.status_code == 422  # FastAPI validation error

    def test_list_cases_orders_by_year_descending(self, client):
        """Test that cases are ordered by year descending."""
        response = client.get("/api/cases")

        assert response.status_code == 200
        data = response.json()

        if len(data["cases"]) > 1:
            years = [case["year"] for case in data["cases"]]
            # Check that years are in descending order (or same)
            for i in range(len(years) - 1):
                assert years[i] >= years[i + 1]


class TestGetCase:
    """Test GET /api/cases/:id endpoint."""

    def test_get_case_returns_case_details(self, client):
        """Test that get_case returns full case details."""
        # First, get a case ID
        all_cases = client.get("/api/cases").json()
        if len(all_cases["cases"]) > 0:
            target_id = all_cases["cases"][0]["id"]

            response = client.get(f"/api/cases/{target_id}")

            assert response.status_code == 200
            data = response.json()

            assert data["id"] == target_id
            assert "state" in data
            assert "year" in data
            assert "solved" in data

    def test_get_case_returns_404_for_nonexistent_case(self, client):
        """Test that get_case returns 404 for nonexistent case ID."""
        response = client.get("/api/cases/NONEXISTENT-ID-9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_case_returns_all_required_fields(self, client):
        """Test that get_case returns all required case fields."""
        # First, get a case ID
        all_cases = client.get("/api/cases").json()
        if len(all_cases["cases"]) > 0:
            target_id = all_cases["cases"][0]["id"]

            response = client.get(f"/api/cases/{target_id}")

            assert response.status_code == 200
            data = response.json()

            required_fields = [
                "id",
                "state",
                "year",
                "solved",
                "vic_sex",
                "vic_age",
                "weapon",
                "latitude",
                "longitude",
            ]
            for field in required_fields:
                assert field in data


class TestGetStatistics:
    """Test GET /api/stats/summary endpoint."""

    def test_get_statistics_returns_summary_without_filters(self, client):
        """Test that get_statistics returns summary for all cases."""
        response = client.get("/api/stats/summary")

        assert response.status_code == 200
        data = response.json()

        assert "total_cases" in data
        assert "solved_cases" in data
        assert "unsolved_cases" in data
        assert "solve_rate" in data

        # Sanity checks
        assert data["total_cases"] == data["solved_cases"] + data["unsolved_cases"]
        assert 0.0 <= data["solve_rate"] <= 100.0

    def test_get_statistics_filters_by_state(self, client):
        """Test that get_statistics respects state filter."""
        response = client.get("/api/stats/summary?states=ILLINOIS")

        assert response.status_code == 200
        data = response.json()

        # Should return valid statistics
        assert data["total_cases"] >= 0
        assert isinstance(data["solve_rate"], (int, float))

    def test_get_statistics_filters_by_solved_status(self, client):
        """Test that get_statistics respects solved filter."""
        response = client.get("/api/stats/summary?solved=0")

        assert response.status_code == 200
        data = response.json()

        # When filtering for unsolved only, solved_cases should be 0
        assert data["solved_cases"] == 0
        assert data["unsolved_cases"] == data["total_cases"]
        assert data["solve_rate"] == 0.0

    def test_get_statistics_filters_by_year_range(self, client):
        """Test that get_statistics respects year range filter."""
        response = client.get("/api/stats/summary?year_min=1990&year_max=1992")

        assert response.status_code == 200
        data = response.json()

        # Should return valid statistics for year range
        assert data["total_cases"] >= 0

    def test_get_statistics_combines_multiple_filters(self, client):
        """Test that get_statistics combines multiple filters correctly."""
        response = client.get(
            "/api/stats/summary?states=ILLINOIS&year_min=1990&solved=0&vic_sex=Female"
        )

        assert response.status_code == 200
        data = response.json()

        # Should return valid statistics
        assert data["total_cases"] >= 0
        assert data["solved_cases"] == 0  # Since we filtered for solved=0

    def test_get_statistics_calculates_solve_rate_correctly(self, client):
        """Test that solve rate is calculated correctly."""
        response = client.get("/api/stats/summary")

        assert response.status_code == 200
        data = response.json()

        if data["total_cases"] > 0:
            expected_solve_rate = (data["solved_cases"] / data["total_cases"]) * 100
            # Allow small rounding differences
            assert abs(data["solve_rate"] - expected_solve_rate) < 0.1

    def test_get_statistics_returns_zeros_for_no_matches(self, client):
        """Test that get_statistics returns zeros when no cases match filters."""
        # Use a filter that won't match anything
        response = client.get("/api/stats/summary?states=NONEXISTENT_STATE")

        assert response.status_code == 200
        data = response.json()

        assert data["total_cases"] == 0
        assert data["solved_cases"] == 0
        assert data["unsolved_cases"] == 0
        assert data["solve_rate"] == 0.0

    def test_get_statistics_returns_400_for_invalid_parameters(self, client):
        """Test that get_statistics returns 400 for invalid parameters."""
        response = client.get("/api/stats/summary?year_min=invalid")

        assert response.status_code == 422  # FastAPI validation error


class TestErrorHandling:
    """Test error handling across all case endpoints."""

    def test_list_cases_handles_database_errors_gracefully(self, client):
        """Test that list_cases handles database errors gracefully."""
        with patch("backend.database.queries.cases.get_cases_paginated") as mock_query:
            mock_query.side_effect = Exception("Database error")

            response = client.get("/api/cases")

            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()

    def test_get_case_handles_database_errors_gracefully(self, client):
        """Test that get_case handles database errors gracefully."""
        with patch("backend.database.queries.cases.get_case_by_id") as mock_query:
            mock_query.side_effect = Exception("Database error")

            response = client.get("/api/cases/TEST-ID")

            assert response.status_code == 500

    def test_get_statistics_handles_database_errors_gracefully(self, client):
        """Test that get_statistics handles database errors gracefully."""
        with patch("backend.database.queries.cases.get_filter_stats") as mock_query:
            mock_query.side_effect = Exception("Database error")

            response = client.get("/api/stats/summary")

            assert response.status_code == 500
