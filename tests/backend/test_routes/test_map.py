"""Tests for map API endpoints.

Tests GET /api/map/counties, GET /api/map/cases with various
filter combinations and edge cases.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from backend.main import app


@pytest.fixture
def client(populated_test_db):
    """Create test client with mocked database."""
    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = populated_test_db
        yield TestClient(app)


@pytest.fixture
def mock_db_connection():
    """Mock database connection for testing."""
    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_cursor = MagicMock()
        mock_conn.return_value.__enter__.return_value.cursor.return_value = mock_cursor
        yield mock_cursor


class TestGetCountyData:
    """Test GET /api/map/counties endpoint."""

    def test_get_county_data_returns_counties(self, client):
        """Test that endpoint returns county aggregations."""
        response = client.get("/api/map/counties")
        assert response.status_code == 200
        data = response.json()
        assert "counties" in data
        assert "bounds" in data
        assert "total_cases" in data
        assert "total_counties" in data

    def test_get_county_data_filters_by_state(self, client):
        """Test filtering by state."""
        response = client.get("/api/map/counties?state=California")
        assert response.status_code == 200
        data = response.json()
        # Verify response structure
        assert "counties" in data
        assert "total_cases" in data

    def test_get_county_data_filters_by_year_range(self, client):
        """Test filtering by year range."""
        response = client.get("/api/map/counties?year_start=2000&year_end=2010")
        assert response.status_code == 200
        data = response.json()
        assert data["total_cases"] >= 0

    def test_get_county_data_filters_by_solved_status(self, client):
        """Test filtering by solved status."""
        response = client.get("/api/map/counties?solved=false")
        assert response.status_code == 200

    def test_get_county_data_filters_by_victim_demographics(self, client):
        """Test filtering by victim sex and race."""
        response = client.get("/api/map/counties?vic_sex=Female&vic_race=White")
        assert response.status_code == 200

    def test_get_county_data_filters_by_weapon(self, client):
        """Test filtering by weapon type."""
        response = client.get("/api/map/counties?weapon=Strangulation%20-%20hanging")
        assert response.status_code == 200

    def test_get_county_data_returns_valid_bounds(self, client):
        """Test that bounds are valid coordinates."""
        response = client.get("/api/map/counties?state=California")
        assert response.status_code == 200
        data = response.json()
        if data["bounds"]:
            bounds = data["bounds"]
            assert -90 <= bounds["south"] <= 90
            assert -90 <= bounds["north"] <= 90
            assert -180 <= bounds["west"] <= 180
            assert -180 <= bounds["east"] <= 180
            assert bounds["south"] <= bounds["north"]

    def test_get_county_data_empty_result(self, client):
        """Test with filters that return no results."""
        response = client.get("/api/map/counties?state=NonexistentState")
        assert response.status_code == 200
        data = response.json()
        assert data["total_counties"] == 0

    def test_get_county_data_filters_by_relationship(self, client):
        """Test filtering by victim-offender relationship."""
        response = client.get("/api/map/counties?relationship=Stranger")
        assert response.status_code == 200
        data = response.json()
        assert "counties" in data

    def test_get_county_data_filters_by_circumstance(self, client):
        """Test filtering by circumstance."""
        response = client.get("/api/map/counties?circumstance=Argument")
        assert response.status_code == 200
        data = response.json()
        assert "counties" in data

    def test_get_county_data_filters_by_victim_age_range(self, client):
        """Test filtering by victim age range."""
        response = client.get("/api/map/counties?vic_age_min=20&vic_age_max=40")
        assert response.status_code == 200
        data = response.json()
        assert "counties" in data

    def test_get_county_data_combines_multiple_filters(self, client):
        """Test combining multiple filters."""
        response = client.get(
            "/api/map/counties?state=ILLINOIS&year_start=1990&year_end=2000&solved=false"
        )
        assert response.status_code == 200
        data = response.json()
        assert "counties" in data
        assert "total_cases" in data

    def test_get_county_data_county_structure(self, client):
        """Test that county data has correct structure."""
        response = client.get("/api/map/counties")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["counties"]) > 0:
            county = data["counties"][0]
            assert "fips" in county
            assert "state_name" in county
            assert "county_name" in county
            assert "latitude" in county
            assert "longitude" in county
            assert "total_cases" in county
            assert "solved_cases" in county
            assert "unsolved_cases" in county
            assert "solve_rate" in county

    def test_get_county_data_solve_rate_calculation(self, client):
        """Test that solve rate is calculated correctly."""
        response = client.get("/api/map/counties")
        assert response.status_code == 200
        data = response.json()
        
        for county in data["counties"]:
            if county["total_cases"] > 0:
                expected_rate = (county["solved_cases"] / county["total_cases"]) * 100
                # Allow small rounding differences
                assert abs(county["solve_rate"] - expected_rate) < 0.1


class TestGetCasePoints:
    """Test GET /api/map/cases endpoint."""

    def test_get_case_points_returns_cases(self, client):
        """Test that endpoint returns case points."""
        response = client.get("/api/map/cases?limit=100")
        assert response.status_code == 200
        data = response.json()
        assert "cases" in data
        assert "total" in data
        assert "limited" in data

    def test_get_case_points_respects_limit(self, client):
        """Test that limit parameter is respected."""
        response = client.get("/api/map/cases?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["cases"]) <= 10

    def test_get_case_points_filters_by_county(self, client):
        """Test filtering by county FIPS."""
        response = client.get("/api/map/cases?county=06037&limit=100")
        assert response.status_code == 200

    def test_get_case_points_has_coordinates(self, client):
        """Test that returned cases have coordinates."""
        response = client.get("/api/map/cases?limit=10")
        assert response.status_code == 200
        data = response.json()
        for case in data["cases"]:
            assert "latitude" in case
            assert "longitude" in case

    def test_get_case_points_limit_validation_too_high(self, client):
        """Test limit parameter validation - too high."""
        response = client.get("/api/map/cases?limit=10000")
        assert response.status_code == 422  # Validation error

    def test_get_case_points_limit_validation_too_low(self, client):
        """Test limit parameter validation - too low."""
        response = client.get("/api/map/cases?limit=0")
        assert response.status_code == 422

    def test_get_case_points_filters_by_state(self, client):
        """Test filtering by state."""
        response = client.get("/api/map/cases?state=ILLINOIS&limit=100")
        assert response.status_code == 200
        data = response.json()
        assert "cases" in data

    def test_get_case_points_filters_by_year_range(self, client):
        """Test filtering by year range."""
        response = client.get("/api/map/cases?year_start=1990&year_end=2000&limit=100")
        assert response.status_code == 200
        data = response.json()
        for case in data["cases"]:
            assert 1990 <= case["year"] <= 2000

    def test_get_case_points_filters_by_solved_status(self, client):
        """Test filtering by solved status."""
        response = client.get("/api/map/cases?solved=false&limit=100")
        assert response.status_code == 200
        data = response.json()
        for case in data["cases"]:
            assert case["solved"] is False

    def test_get_case_points_filters_by_victim_sex(self, client):
        """Test filtering by victim sex."""
        response = client.get("/api/map/cases?vic_sex=Female&limit=100")
        assert response.status_code == 200
        data = response.json()
        for case in data["cases"]:
            assert case["victim_sex"] == "Female"

    def test_get_case_points_filters_by_weapon(self, client):
        """Test filtering by weapon type."""
        response = client.get("/api/map/cases?weapon=Strangulation%20-%20hanging&limit=100")
        assert response.status_code == 200

    def test_get_case_points_case_structure(self, client):
        """Test that case points have correct structure."""
        response = client.get("/api/map/cases?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["cases"]) > 0:
            case = data["cases"][0]
            assert "case_id" in case
            assert "latitude" in case
            assert "longitude" in case
            assert "year" in case
            assert "solved" in case

    def test_get_case_points_limited_flag(self, client):
        """Test that limited flag is set correctly."""
        response = client.get("/api/map/cases?limit=1")
        assert response.status_code == 200
        data = response.json()
        
        # If total > limit, limited should be True
        if data["total"] > 1:
            assert data["limited"] is True
        else:
            assert data["limited"] is False

    def test_get_case_points_combines_multiple_filters(self, client):
        """Test combining multiple filters."""
        response = client.get(
            "/api/map/cases?state=ILLINOIS&year_start=1990&year_end=1995&solved=false&limit=100"
        )
        assert response.status_code == 200
        data = response.json()
        
        for case in data["cases"]:
            assert 1990 <= case["year"] <= 1995
            assert case["solved"] is False

    def test_get_case_points_default_limit(self, client):
        """Test that default limit is applied."""
        response = client.get("/api/map/cases")
        assert response.status_code == 200
        data = response.json()
        # Default limit is 1000
        assert len(data["cases"]) <= 1000

    def test_get_case_points_filters_by_relationship(self, client):
        """Test filtering by relationship."""
        response = client.get("/api/map/cases?relationship=Stranger&limit=100")
        assert response.status_code == 200

    def test_get_case_points_filters_by_circumstance(self, client):
        """Test filtering by circumstance."""
        response = client.get("/api/map/cases?circumstance=Argument&limit=100")
        assert response.status_code == 200

    def test_get_case_points_filters_by_victim_age_range(self, client):
        """Test filtering by victim age range."""
        response = client.get("/api/map/cases?vic_age_min=20&vic_age_max=40&limit=100")
        assert response.status_code == 200

    def test_get_case_points_filters_by_victim_race(self, client):
        """Test filtering by victim race."""
        response = client.get("/api/map/cases?vic_race=White&limit=100")
        assert response.status_code == 200


class TestMapEndpointEdgeCases:
    """Test edge cases for map endpoints."""

    def test_county_data_year_validation_min(self, client):
        """Test year_start minimum validation."""
        response = client.get("/api/map/counties?year_start=1900")
        assert response.status_code == 422

    def test_county_data_year_validation_max(self, client):
        """Test year_end maximum validation."""
        response = client.get("/api/map/counties?year_end=2050")
        assert response.status_code == 422

    def test_case_points_year_validation_min(self, client):
        """Test year_start minimum validation for cases."""
        response = client.get("/api/map/cases?year_start=1900&limit=100")
        assert response.status_code == 422

    def test_case_points_year_validation_max(self, client):
        """Test year_end maximum validation for cases."""
        response = client.get("/api/map/cases?year_end=2050&limit=100")
        assert response.status_code == 422

    def test_county_data_age_validation_min(self, client):
        """Test vic_age_min validation."""
        response = client.get("/api/map/counties?vic_age_min=-1")
        assert response.status_code == 422

    def test_county_data_age_validation_max(self, client):
        """Test vic_age_max validation."""
        response = client.get("/api/map/counties?vic_age_max=1000")
        assert response.status_code == 422

    def test_case_points_limit_at_boundary(self, client):
        """Test limit at maximum boundary (5000)."""
        response = client.get("/api/map/cases?limit=5000")
        assert response.status_code == 200

    def test_case_points_limit_above_boundary(self, client):
        """Test limit above maximum boundary."""
        response = client.get("/api/map/cases?limit=5001")
        assert response.status_code == 422

    def test_county_data_multiple_vic_sex_values(self, client):
        """Test filtering by multiple victim sex values."""
        response = client.get("/api/map/counties?vic_sex=Male&vic_sex=Female")
        assert response.status_code == 200

    def test_county_data_multiple_weapon_values(self, client):
        """Test filtering by multiple weapon values."""
        response = client.get(
            "/api/map/counties?weapon=Handgun%20-%20pistol,%20revolver,%20etc&weapon=Knife%20or%20cutting%20instrument"
        )
        assert response.status_code == 200

    def test_case_points_empty_result(self, client):
        """Test with filters that return no results."""
        response = client.get("/api/map/cases?state=NonexistentState&limit=100")
        assert response.status_code == 200
        data = response.json()
        assert len(data["cases"]) == 0
        assert data["total"] == 0

    def test_county_data_single_year(self, client):
        """Test filtering with single year (start=end)."""
        response = client.get("/api/map/counties?year_start=1990&year_end=1990")
        assert response.status_code == 200

    def test_case_points_single_year(self, client):
        """Test filtering with single year (start=end)."""
        response = client.get("/api/map/cases?year_start=1990&year_end=1990&limit=100")
        assert response.status_code == 200


class TestMapEndpointErrorHandling:
    """Test error handling for map endpoints."""

    def test_county_data_handles_database_errors(self, client):
        """Test that county endpoint handles database errors gracefully."""
        with patch("routes.map.get_county_aggregations") as mock_service:
            mock_service.side_effect = Exception("Database error")
            
            response = client.get("/api/map/counties")
            
            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()

    def test_case_points_handles_database_errors(self, client):
        """Test that cases endpoint handles database errors gracefully."""
        with patch("routes.map.get_case_points") as mock_service:
            mock_service.side_effect = Exception("Database error")
            
            response = client.get("/api/map/cases?limit=100")
            
            assert response.status_code == 500
            assert "failed" in response.json()["detail"].lower()


class TestMapFilterCombinations:
    """Test various filter combinations for map endpoints."""

    def test_county_all_primary_filters(self, client):
        """Test combining all primary filters for counties."""
        response = client.get(
            "/api/map/counties?state=ILLINOIS&year_start=1990&year_end=2000&solved=false"
        )
        assert response.status_code == 200
        data = response.json()
        assert "counties" in data

    def test_county_demographics_and_crime_filters(self, client):
        """Test combining demographic and crime filters for counties."""
        response = client.get(
            "/api/map/counties?vic_sex=Female&vic_race=White&weapon=Strangulation%20-%20hanging"
        )
        assert response.status_code == 200

    def test_case_points_all_primary_filters(self, client):
        """Test combining all primary filters for case points."""
        response = client.get(
            "/api/map/cases?state=ILLINOIS&year_start=1990&year_end=2000&solved=false&limit=100"
        )
        assert response.status_code == 200

    def test_case_points_demographics_and_crime_filters(self, client):
        """Test combining demographic and crime filters for case points."""
        response = client.get(
            "/api/map/cases?vic_sex=Female&vic_race=White&weapon=Strangulation%20-%20hanging&limit=100"
        )
        assert response.status_code == 200

    def test_county_full_filter_combination(self, client):
        """Test applying many filters simultaneously for counties."""
        response = client.get(
            "/api/map/counties?"
            "state=ILLINOIS&"
            "year_start=1990&year_end=1995&"
            "solved=false&"
            "vic_sex=Female&"
            "vic_race=White&"
            "weapon=Strangulation%20-%20hanging&"
            "relationship=Unknown&"
            "circumstance=Unknown"
        )
        assert response.status_code == 200

    def test_case_points_full_filter_combination(self, client):
        """Test applying many filters simultaneously for case points."""
        response = client.get(
            "/api/map/cases?"
            "state=ILLINOIS&"
            "year_start=1990&year_end=1995&"
            "solved=false&"
            "vic_sex=Female&"
            "vic_race=White&"
            "weapon=Strangulation%20-%20hanging&"
            "relationship=Unknown&"
            "circumstance=Unknown&"
            "limit=100"
        )
        assert response.status_code == 200