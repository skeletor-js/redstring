"""Tests for case API endpoints.

Tests GET /api/cases, GET /api/cases/:id, GET /api/stats/summary,
POST /api/cases/query, and POST /api/cases/stats.

Includes comprehensive filter tests for:
- Primary filters (states, year range, solved status)
- Victim demographics (sex, age, race, ethnicity)
- Crime details (weapon, relationship, circumstance, situation)
- Geography (county, MSA)
- Search (agency, case ID)
- Edge cases and filter combinations
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

        # With test data (13 cases), this should be False
        # large_result_warning is True when total_count > 50000
        if data["pagination"]["total_count"] <= 50000:
            assert data["pagination"]["large_result_warning"] is False
        else:
            assert data["pagination"]["large_result_warning"] is True

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


class TestSituationFilter:
    """Test filtering by victim/offender count combinations (situation)."""

    def test_list_cases_filters_by_single_victim_single_offender(self, client):
        """Test filtering for single victim/single offender cases."""
        response = client.get("/api/cases?situation=Single victim/single offender")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["situation"] == "Single victim/single offender"

    def test_list_cases_filters_by_multiple_victims(self, client):
        """Test filtering for multiple victim cases."""
        response = client.get(
            "/api/cases?situation=Multiple victims/single offender,Multiple victims/multiple offenders"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["situation"] in [
                "Multiple victims/single offender",
                "Multiple victims/multiple offenders",
            ]

    def test_list_cases_filters_by_unknown_offenders(self, client):
        """Test filtering for cases with unknown offenders."""
        response = client.get(
            "/api/cases?situation=Single victim/unknown offenders,Multiple victims/unknown offenders"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["situation"] in [
                "Single victim/unknown offenders",
                "Multiple victims/unknown offenders",
            ]

    def test_list_cases_filters_by_single_situation(self, client):
        """Test filtering by a single situation value."""
        response = client.get("/api/cases?situation=Single victim/multiple offenders")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["situation"] == "Single victim/multiple offenders"


class TestMSAFilter:
    """Test filtering by Metropolitan Statistical Area."""

    def test_list_cases_filters_by_single_msa(self, client):
        """Test filtering by a single MSA."""
        response = client.get("/api/cases?msa=Chicago-Naperville-Elgin, IL-IN-WI")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["msa"] == "Chicago-Naperville-Elgin, IL-IN-WI"

    def test_list_cases_filters_by_multiple_msas(self, client):
        """Test filtering by multiple MSAs."""
        response = client.get(
            "/api/cases?msa=Chicago-Naperville-Elgin, IL-IN-WI,Los Angeles-Long Beach-Anaheim, CA"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["msa"] in [
                "Chicago-Naperville-Elgin, IL-IN-WI",
                "Los Angeles-Long Beach-Anaheim, CA",
            ]

    def test_list_cases_returns_empty_for_nonexistent_msa(self, client):
        """Test that filtering by nonexistent MSA returns empty results."""
        response = client.get("/api/cases?msa=Nonexistent-MSA-12345")

        assert response.status_code == 200
        data = response.json()

        assert len(data["cases"]) == 0

    def test_statistics_filters_by_msa(self, client):
        """Test that statistics endpoint respects MSA filter."""
        response = client.get("/api/stats/summary?msa=Chicago-Naperville-Elgin, IL-IN-WI")

        assert response.status_code == 200
        data = response.json()

        assert data["total_cases"] >= 0
        assert isinstance(data["solve_rate"], (int, float))


class TestRelationshipFilter:
    """Test filtering by victim-offender relationship."""

    def test_list_cases_filters_by_stranger(self, client):
        """Test filtering for stranger relationship cases."""
        response = client.get("/api/cases?relationship=Stranger")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["relationship"] == "Stranger"

    def test_list_cases_filters_by_acquaintance(self, client):
        """Test filtering for acquaintance relationship cases."""
        response = client.get("/api/cases?relationship=Acquaintance")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["relationship"] == "Acquaintance"

    def test_list_cases_filters_by_family_relationships(self, client):
        """Test filtering for family relationship cases."""
        response = client.get("/api/cases?relationship=Husband,Wife,Son,Daughter")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["relationship"] in ["Husband", "Wife", "Son", "Daughter"]

    def test_list_cases_filters_by_unknown_relationship(self, client):
        """Test filtering for unknown relationship cases."""
        response = client.get("/api/cases?relationship=Unknown")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["relationship"] == "Unknown"

    def test_list_cases_filters_by_multiple_relationships(self, client):
        """Test filtering by multiple relationship values."""
        response = client.get("/api/cases?relationship=Stranger,Acquaintance,Neighbor")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["relationship"] in ["Stranger", "Acquaintance", "Neighbor"]


class TestCircumstanceFilter:
    """Test filtering by crime circumstance."""

    def test_list_cases_filters_by_argument(self, client):
        """Test filtering for argument circumstance cases."""
        response = client.get("/api/cases?circumstance=Argument")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["circumstance"] == "Argument"

    def test_list_cases_filters_by_felony_type(self, client):
        """Test filtering for felony type circumstance cases."""
        response = client.get("/api/cases?circumstance=Felony type")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["circumstance"] == "Felony type"

    def test_list_cases_filters_by_gang_related(self, client):
        """Test filtering for gang-related circumstance cases."""
        response = client.get("/api/cases?circumstance=Gangland,Juvenile gang")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["circumstance"] in ["Gangland", "Juvenile gang"]

    def test_list_cases_filters_by_unknown_circumstance(self, client):
        """Test filtering for unknown circumstance cases."""
        response = client.get("/api/cases?circumstance=Unknown")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["circumstance"] == "Unknown"

    def test_list_cases_filters_by_other_circumstance(self, client):
        """Test filtering for 'Other' circumstance cases."""
        response = client.get("/api/cases?circumstance=Other")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["circumstance"] == "Other"


class TestPostCasesQuery:
    """Test POST /api/cases/query endpoint."""

    def test_post_query_basic_state_filter(self, client):
        """Test POST query with basic state filter."""
        response = client.post(
            "/api/cases/query",
            json={"states": ["ILLINOIS"]}
        )

        assert response.status_code == 200
        data = response.json()

        assert "cases" in data
        assert "pagination" in data
        for case in data["cases"]:
            assert case["state"] == "ILLINOIS"

    def test_post_query_year_range_filter(self, client):
        """Test POST query with year range filter."""
        response = client.post(
            "/api/cases/query",
            json={"year_range": [1990, 2000]}
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert 1990 <= case["year"] <= 2000

    def test_post_query_solved_filter_unsolved(self, client):
        """Test POST query filtering for unsolved cases."""
        response = client.post(
            "/api/cases/query",
            json={"solved": "unsolved"}
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["solved"] == 0

    def test_post_query_solved_filter_solved(self, client):
        """Test POST query filtering for solved cases."""
        response = client.post(
            "/api/cases/query",
            json={"solved": "solved"}
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["solved"] == 1

    def test_post_query_solved_filter_all(self, client):
        """Test POST query with 'all' solved filter returns all cases."""
        response = client.post(
            "/api/cases/query",
            json={"solved": "all"}
        )

        assert response.status_code == 200
        data = response.json()

        # Should return both solved and unsolved
        assert len(data["cases"]) > 0

    def test_post_query_victim_demographics(self, client):
        """Test POST query with victim demographic filters."""
        response = client.post(
            "/api/cases/query",
            json={
                "vic_sex": ["Female"],
                "vic_age_range": [20, 35],
                "vic_race": ["White"]
            }
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["vic_sex"] == "Female"
            if case["vic_age"] != 999:
                assert 20 <= case["vic_age"] <= 35
            assert case["vic_race"] == "White"

    def test_post_query_with_pagination(self, client):
        """Test POST query with pagination parameters."""
        response = client.post(
            "/api/cases/query",
            json={"limit": 2}
        )

        assert response.status_code == 200
        data = response.json()

        assert len(data["cases"]) <= 2
        assert data["pagination"]["current_page_size"] <= 2

    def test_post_query_with_cursor(self, client):
        """Test POST query with cursor pagination."""
        # Get first page
        response1 = client.post(
            "/api/cases/query",
            json={"limit": 2}
        )
        data1 = response1.json()

        if data1["pagination"]["has_more"]:
            cursor = data1["pagination"]["next_cursor"]

            # Get second page
            response2 = client.post(
                "/api/cases/query",
                json={"limit": 2, "cursor": cursor}
            )
            data2 = response2.json()

            assert response2.status_code == 200
            # Cases should be different
            first_ids = {case["id"] for case in data1["cases"]}
            second_ids = {case["id"] for case in data2["cases"]}
            assert first_ids.isdisjoint(second_ids)

    def test_post_query_complex_filters(self, client):
        """Test POST query with multiple complex filters."""
        response = client.post(
            "/api/cases/query",
            json={
                "states": ["ILLINOIS"],
                "year_range": [1990, 2000],
                "solved": "unsolved",
                "vic_sex": ["Female"],
                "weapon": ["Strangulation - hanging"]
            }
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["state"] == "ILLINOIS"
            assert 1990 <= case["year"] <= 2000
            assert case["solved"] == 0
            assert case["vic_sex"] == "Female"
            assert case["weapon"] == "Strangulation - hanging"

    def test_post_query_empty_filters_returns_all(self, client):
        """Test POST query with empty body returns all cases."""
        response = client.post(
            "/api/cases/query",
            json={}
        )

        assert response.status_code == 200
        data = response.json()

        assert len(data["cases"]) > 0

    def test_post_query_include_unknown_age(self, client):
        """Test POST query with include_unknown_age flag."""
        response = client.post(
            "/api/cases/query",
            json={
                "vic_age_range": [20, 30],
                "include_unknown_age": True
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Should include cases with age in range OR age 999
        for case in data["cases"]:
            assert (20 <= case["vic_age"] <= 30) or case["vic_age"] == 999


class TestPostCasesStats:
    """Test POST /api/cases/stats endpoint."""

    def test_post_stats_no_filters(self, client):
        """Test POST stats with no filters returns total dataset stats."""
        response = client.post(
            "/api/cases/stats",
            json={}
        )

        assert response.status_code == 200
        data = response.json()

        assert "total_cases" in data
        assert "solved_cases" in data
        assert "unsolved_cases" in data
        assert "solve_rate" in data
        assert data["total_cases"] == data["solved_cases"] + data["unsolved_cases"]

    def test_post_stats_state_filter(self, client):
        """Test POST stats with state filter."""
        response = client.post(
            "/api/cases/stats",
            json={"states": ["ILLINOIS"]}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["total_cases"] >= 0

    def test_post_stats_solved_filter_unsolved(self, client):
        """Test POST stats filtering for unsolved cases."""
        response = client.post(
            "/api/cases/stats",
            json={"solved": "unsolved"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["solved_cases"] == 0
        assert data["unsolved_cases"] == data["total_cases"]
        assert data["solve_rate"] == 0.0

    def test_post_stats_solved_filter_solved(self, client):
        """Test POST stats filtering for solved cases."""
        response = client.post(
            "/api/cases/stats",
            json={"solved": "solved"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["unsolved_cases"] == 0
        assert data["solved_cases"] == data["total_cases"]
        if data["total_cases"] > 0:
            assert data["solve_rate"] == 100.0

    def test_post_stats_year_range(self, client):
        """Test POST stats with year range filter."""
        response = client.post(
            "/api/cases/stats",
            json={"year_range": [1990, 1995]}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["total_cases"] >= 0

    def test_post_stats_complex_filters(self, client):
        """Test POST stats with multiple filters."""
        response = client.post(
            "/api/cases/stats",
            json={
                "states": ["ILLINOIS"],
                "year_range": [1990, 2000],
                "solved": "unsolved",
                "vic_sex": ["Female"]
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["total_cases"] >= 0
        assert data["solved_cases"] == 0  # Since we filtered for unsolved

    def test_post_stats_empty_result(self, client):
        """Test POST stats returns zeros for impossible filters."""
        response = client.post(
            "/api/cases/stats",
            json={"states": ["NONEXISTENT_STATE"]}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["total_cases"] == 0
        assert data["solved_cases"] == 0
        assert data["unsolved_cases"] == 0
        assert data["solve_rate"] == 0.0


class TestEdgeCases:
    """Test edge cases for filter handling."""

    def test_empty_filter_arrays_return_all_cases(self, client):
        """Test that empty filter arrays return all cases."""
        response = client.get("/api/cases?states=")

        assert response.status_code == 200
        data = response.json()

        # Empty string should be treated as no filter
        assert len(data["cases"]) > 0

    def test_year_range_single_year(self, client):
        """Test filtering with single year (min=max)."""
        response = client.get("/api/cases?year_min=1990&year_max=1990")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["year"] == 1990

    def test_year_range_at_boundaries(self, client):
        """Test filtering at year boundaries (1976)."""
        response = client.get("/api/cases?year_min=1976&year_max=1976")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["year"] == 1976

    def test_age_range_with_unknown_toggle(self, client):
        """Test age range filter with unknown age toggle."""
        # Without unknown age
        response1 = client.get("/api/cases?vic_age_min=20&vic_age_max=30&include_unknown_age=false")
        data1 = response1.json()

        for case in data1["cases"]:
            assert 20 <= case["vic_age"] <= 30

        # With unknown age
        response2 = client.get("/api/cases?vic_age_min=20&vic_age_max=30&include_unknown_age=true")
        data2 = response2.json()

        for case in data2["cases"]:
            assert (20 <= case["vic_age"] <= 30) or case["vic_age"] == 999

    def test_overlapping_filters_state_and_county(self, client):
        """Test overlapping filters (state + county within that state)."""
        response = client.get("/api/cases?states=ILLINOIS&county=Cook County")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["state"] == "ILLINOIS"
            assert case["cntyfips"] == "Cook County"

    def test_maximum_pagination_limit(self, client):
        """Test maximum pagination limit (10000)."""
        response = client.get("/api/cases?limit=10000")

        assert response.status_code == 200
        data = response.json()

        assert data["pagination"]["current_page_size"] <= 10000

    def test_pagination_limit_exceeds_maximum(self, client):
        """Test that limit exceeding maximum is rejected."""
        response = client.get("/api/cases?limit=50000")

        # FastAPI should reject this with validation error
        assert response.status_code == 422

    def test_invalid_cursor_format_ignored(self, client):
        """Test that invalid cursor format is handled gracefully."""
        response = client.get("/api/cases?cursor=invalid-cursor-format")

        assert response.status_code == 200
        data = response.json()

        # Should return results (cursor ignored)
        assert "cases" in data

    def test_special_characters_in_agency_search(self, client):
        """Test agency search with special characters."""
        response = client.get("/api/cases?agency_search=Police")

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert "Police" in case["agency"]

    def test_case_insensitive_agency_search(self, client):
        """Test that agency search is case-insensitive."""
        response_lower = client.get("/api/cases?agency_search=chicago")
        response_upper = client.get("/api/cases?agency_search=CHICAGO")

        assert response_lower.status_code == 200
        assert response_upper.status_code == 200

        # Both should return results containing Chicago
        data_lower = response_lower.json()
        data_upper = response_upper.json()

        # Results should be similar (case-insensitive matching)
        for case in data_lower["cases"]:
            assert "chicago" in case["agency"].lower()
        for case in data_upper["cases"]:
            assert "chicago" in case["agency"].lower()

    def test_nonexistent_state_returns_empty(self, client):
        """Test that nonexistent state returns empty results."""
        response = client.get("/api/cases?states=NONEXISTENT_STATE")

        assert response.status_code == 200
        data = response.json()

        assert len(data["cases"]) == 0
        assert data["pagination"]["total_count"] == 0

    def test_invalid_year_min_rejected(self, client):
        """Test that year_min below 1976 is rejected."""
        response = client.get("/api/cases?year_min=1900")

        assert response.status_code == 422

    def test_invalid_year_max_rejected(self, client):
        """Test that year_max above 2023 is rejected."""
        response = client.get("/api/cases?year_max=2050")

        assert response.status_code == 422


class TestFilterCombinations:
    """Test multiple filters applied simultaneously."""

    def test_all_primary_filters_combined(self, client):
        """Test combining all primary filters."""
        response = client.get(
            "/api/cases?states=ILLINOIS&year_min=1990&year_max=2000&solved=0"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["state"] == "ILLINOIS"
            assert 1990 <= case["year"] <= 2000
            assert case["solved"] == 0

    def test_demographics_and_crime_filters(self, client):
        """Test combining demographic and crime filters."""
        response = client.get(
            "/api/cases?vic_sex=Female&weapon=Strangulation - hanging"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["vic_sex"] == "Female"
            assert case["weapon"] == "Strangulation - hanging"

    def test_geography_and_time_filters(self, client):
        """Test combining geography and time filters."""
        response = client.get(
            "/api/cases?states=CALIFORNIA&msa=Los Angeles-Long Beach-Anaheim, CA&year_min=1995"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["state"] == "CALIFORNIA"
            assert case["msa"] == "Los Angeles-Long Beach-Anaheim, CA"
            assert case["year"] >= 1995

    def test_all_crime_detail_filters(self, client):
        """Test combining all crime detail filters."""
        response = client.get(
            "/api/cases?weapon=Handgun - pistol, revolver, etc&relationship=Acquaintance&circumstance=Argument"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["weapon"] == "Handgun - pistol, revolver, etc"
            assert case["relationship"] == "Acquaintance"
            assert case["circumstance"] == "Argument"

    def test_contradictory_filters_return_empty(self, client):
        """Test that contradictory filters return empty results."""
        # Filter for solved cases but also filter for 0% solve rate expectation
        # This tests filtering for a state that doesn't exist in our test data
        response = client.get(
            "/api/cases?states=ILLINOIS&states=CALIFORNIA&county=Nonexistent County"
        )

        assert response.status_code == 200
        data = response.json()

        # Should return empty since county doesn't exist
        assert len(data["cases"]) == 0

    def test_all_filters_at_default_values(self, client):
        """Test that default filter values return all cases."""
        response = client.get("/api/cases")

        assert response.status_code == 200
        data = response.json()

        assert len(data["cases"]) > 0
        assert data["pagination"]["total_count"] > 0

    def test_situation_with_relationship_filter(self, client):
        """Test combining situation and relationship filters."""
        response = client.get(
            "/api/cases?situation=Single victim/single offender&relationship=Unknown"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["situation"] == "Single victim/single offender"
            assert case["relationship"] == "Unknown"

    def test_msa_with_circumstance_filter(self, client):
        """Test combining MSA and circumstance filters."""
        response = client.get(
            "/api/cases?msa=Los Angeles-Long Beach-Anaheim, CA&circumstance=Juvenile gang"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["msa"] == "Los Angeles-Long Beach-Anaheim, CA"
            assert case["circumstance"] == "Juvenile gang"

    def test_full_filter_combination(self, client):
        """Test applying many filters simultaneously."""
        response = client.get(
            "/api/cases?"
            "states=ILLINOIS&"
            "year_min=1990&year_max=1995&"
            "solved=0&"
            "vic_sex=Female&"
            "weapon=Strangulation - hanging&"
            "situation=Single victim/single offender&"
            "relationship=Unknown&"
            "circumstance=Unknown&"
            "county=Cook County&"
            "msa=Chicago-Naperville-Elgin, IL-IN-WI"
        )

        assert response.status_code == 200
        data = response.json()

        for case in data["cases"]:
            assert case["state"] == "ILLINOIS"
            assert 1990 <= case["year"] <= 1995
            assert case["solved"] == 0
            assert case["vic_sex"] == "Female"
            assert case["weapon"] == "Strangulation - hanging"
            assert case["situation"] == "Single victim/single offender"
            assert case["relationship"] == "Unknown"
            assert case["circumstance"] == "Unknown"
            assert case["cntyfips"] == "Cook County"
            assert case["msa"] == "Chicago-Naperville-Elgin, IL-IN-WI"


class TestErrorHandling:
    """Test error handling across all case endpoints."""

    def test_list_cases_handles_database_errors_gracefully(self, client):
        """Test that list_cases handles database errors gracefully."""
        with patch("routes.cases.get_cases_paginated") as mock_query:
            mock_query.side_effect = Exception("Database error")

            response = client.get("/api/cases")

            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()

    def test_get_case_handles_database_errors_gracefully(self, client):
        """Test that get_case handles database errors gracefully."""
        with patch("routes.cases.get_case_by_id") as mock_query:
            mock_query.side_effect = Exception("Database error")

            response = client.get("/api/cases/TEST-ID")

            assert response.status_code == 500

    def test_get_statistics_handles_database_errors_gracefully(self, client):
        """Test that get_statistics handles database errors gracefully."""
        with patch("routes.cases.get_filter_stats") as mock_query:
            mock_query.side_effect = Exception("Database error")

            response = client.get("/api/stats/summary")

            assert response.status_code == 500

    def test_post_query_handles_database_errors_gracefully(self, client):
        """Test that POST /cases/query handles database errors gracefully."""
        with patch("routes.cases.get_cases_paginated") as mock_query:
            mock_query.side_effect = Exception("Database error")

            response = client.post("/api/cases/query", json={})

            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()

    def test_post_stats_handles_database_errors_gracefully(self, client):
        """Test that POST /cases/stats handles database errors gracefully."""
        with patch("routes.cases.get_filter_stats") as mock_query:
            mock_query.side_effect = Exception("Database error")

            response = client.post("/api/cases/stats", json={})

            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()

    def test_post_query_invalid_json_body(self, client):
        """Test that POST /cases/query handles invalid JSON gracefully."""
        response = client.post(
            "/api/cases/query",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422

    def test_post_stats_invalid_json_body(self, client):
        """Test that POST /cases/stats handles invalid JSON gracefully."""
        response = client.post(
            "/api/cases/stats",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422
