"""Tests for statistics API endpoints.

Tests all 8 statistics endpoints: summary, demographics, weapons,
circumstances, relationships, geographic, trends, and seasonal.
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestSummaryStatistics:
    """Test GET /api/statistics/summary endpoint."""

    def test_summary_returns_all_metrics(self, client):
        """Test that summary includes all expected metrics."""
        response = client.get("/api/statistics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_cases" in data
        assert "solved_cases" in data
        assert "unsolved_cases" in data
        assert "overall_solve_rate" in data
        assert "date_range" in data
        assert "states_covered" in data
        assert "counties_covered" in data

    def test_summary_filters_by_state(self, client):
        """Test summary with state filter."""
        response = client.get("/api/statistics/summary?state=California")
        assert response.status_code == 200

    def test_summary_filters_by_year_range(self, client):
        """Test summary with year range filter."""
        response = client.get(
            "/api/statistics/summary?year_start=2000&year_end=2020"
        )
        assert response.status_code == 200

    def test_summary_solve_rate_calculation(self, client):
        """Test that solve rate is calculated correctly."""
        response = client.get("/api/statistics/summary")
        assert response.status_code == 200
        data = response.json()
        if data["total_cases"] > 0:
            expected_rate = (data["solved_cases"] / data["total_cases"]) * 100
            assert abs(data["overall_solve_rate"] - expected_rate) < 0.1

    def test_summary_filters_by_victim_sex(self, client):
        """Test summary with victim sex filter."""
        response = client.get("/api/statistics/summary?victim_sex=Female")
        assert response.status_code == 200

    def test_summary_filters_by_weapon(self, client):
        """Test summary with weapon filter."""
        response = client.get("/api/statistics/summary?weapon=Handgun")
        assert response.status_code == 200

    def test_summary_date_range_structure(self, client):
        """Test that date_range has correct structure."""
        response = client.get("/api/statistics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "start_year" in data["date_range"]
        assert "end_year" in data["date_range"]


class TestDemographicsStatistics:
    """Test GET /api/statistics/demographics endpoint."""

    def test_demographics_returns_breakdowns(self, client):
        """Test that demographics includes all breakdowns."""
        response = client.get("/api/statistics/demographics")
        assert response.status_code == 200
        data = response.json()
        assert "by_sex" in data
        assert "by_race" in data
        assert "by_age_group" in data

    def test_demographics_with_filters(self, client):
        """Test demographics with filters."""
        response = client.get("/api/statistics/demographics?state=California")
        assert response.status_code == 200

    def test_demographics_sex_breakdown_structure(self, client):
        """Test sex breakdown has correct structure."""
        response = client.get("/api/statistics/demographics")
        assert response.status_code == 200
        data = response.json()
        for item in data["by_sex"]:
            assert "category" in item
            assert "total_cases" in item
            assert "solved_cases" in item
            assert "unsolved_cases" in item
            assert "solve_rate" in item
            assert "percentage_of_total" in item

    def test_demographics_race_breakdown_structure(self, client):
        """Test race breakdown has correct structure."""
        response = client.get("/api/statistics/demographics")
        assert response.status_code == 200
        data = response.json()
        for item in data["by_race"]:
            assert "category" in item
            assert "total_cases" in item
            assert "solve_rate" in item
            assert "percentage_of_total" in item

    def test_demographics_age_groups_structure(self, client):
        """Test age groups has correct structure."""
        response = client.get("/api/statistics/demographics")
        assert response.status_code == 200
        data = response.json()
        for item in data["by_age_group"]:
            assert "category" in item
            assert "total_cases" in item
            assert "solve_rate" in item
            assert "percentage_of_total" in item


class TestWeaponStatistics:
    """Test GET /api/statistics/weapons endpoint."""

    def test_weapons_returns_distribution(self, client):
        """Test that weapons endpoint returns distribution."""
        response = client.get("/api/statistics/weapons")
        assert response.status_code == 200
        data = response.json()
        assert "weapons" in data
        assert "total_cases" in data
        for weapon in data["weapons"]:
            assert "category" in weapon
            assert "count" in weapon
            assert "percentage" in weapon
            assert "solve_rate" in weapon

    def test_weapons_with_filters(self, client):
        """Test weapons with filters."""
        response = client.get("/api/statistics/weapons?state=California")
        assert response.status_code == 200

    def test_weapons_filters_by_year_range(self, client):
        """Test weapons with year range filter."""
        response = client.get("/api/statistics/weapons?year_start=2000&year_end=2020")
        assert response.status_code == 200

    def test_weapons_filters_by_solved_status(self, client):
        """Test weapons with solved status filter."""
        response = client.get("/api/statistics/weapons?solved=false")
        assert response.status_code == 200


class TestCircumstanceStatistics:
    """Test GET /api/statistics/circumstances endpoint."""

    def test_circumstances_returns_distribution(self, client):
        """Test that circumstances endpoint returns distribution."""
        response = client.get("/api/statistics/circumstances")
        assert response.status_code == 200
        data = response.json()
        assert "circumstances" in data
        assert "total_cases" in data

    def test_circumstances_with_filters(self, client):
        """Test circumstances with filters."""
        response = client.get("/api/statistics/circumstances?state=California")
        assert response.status_code == 200

    def test_circumstances_structure(self, client):
        """Test circumstances has correct structure."""
        response = client.get("/api/statistics/circumstances")
        assert response.status_code == 200
        data = response.json()
        for item in data["circumstances"]:
            assert "category" in item
            assert "count" in item
            assert "percentage" in item
            assert "solve_rate" in item


class TestRelationshipStatistics:
    """Test GET /api/statistics/relationships endpoint."""

    def test_relationships_returns_distribution(self, client):
        """Test that relationships endpoint returns distribution."""
        response = client.get("/api/statistics/relationships")
        assert response.status_code == 200
        data = response.json()
        assert "relationships" in data
        assert "total_cases" in data

    def test_relationships_with_filters(self, client):
        """Test relationships with filters."""
        response = client.get("/api/statistics/relationships?state=California")
        assert response.status_code == 200

    def test_relationships_structure(self, client):
        """Test relationships has correct structure."""
        response = client.get("/api/statistics/relationships")
        assert response.status_code == 200
        data = response.json()
        for item in data["relationships"]:
            assert "category" in item
            assert "count" in item
            assert "percentage" in item
            assert "solve_rate" in item


class TestGeographicStatistics:
    """Test GET /api/statistics/geographic endpoint."""

    def test_geographic_returns_state_data(self, client):
        """Test that geographic endpoint returns state-level data."""
        response = client.get("/api/statistics/geographic")
        assert response.status_code == 200
        data = response.json()
        assert "top_states" in data
        assert "top_counties" in data
        for state in data["top_states"]:
            assert "state" in state
            assert "total_cases" in state
            assert "solve_rate" in state
            assert "solved_cases" in state
            assert "unsolved_cases" in state

    def test_geographic_with_filters(self, client):
        """Test geographic with filters."""
        response = client.get("/api/statistics/geographic?year_start=2000&year_end=2020")
        assert response.status_code == 200

    def test_geographic_top_n_parameter(self, client):
        """Test geographic with top_n parameter."""
        response = client.get("/api/statistics/geographic?top_n=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["top_states"]) <= 5
        assert len(data["top_counties"]) <= 5

    def test_geographic_county_structure(self, client):
        """Test county data has correct structure."""
        response = client.get("/api/statistics/geographic")
        assert response.status_code == 200
        data = response.json()
        for county in data["top_counties"]:
            assert "county" in county
            assert "state" in county
            assert "county_fips" in county
            assert "total_cases" in county
            assert "solve_rate" in county


class TestTrendStatistics:
    """Test GET /api/statistics/trends endpoint."""

    def test_trends_returns_yearly_data(self, client):
        """Test that trends endpoint returns yearly data."""
        response = client.get("/api/statistics/trends")
        assert response.status_code == 200
        data = response.json()
        assert "yearly_data" in data
        assert "overall_trend" in data
        assert "average_annual_cases" in data

    def test_trends_with_filters(self, client):
        """Test trends with filters."""
        response = client.get("/api/statistics/trends?state=California")
        assert response.status_code == 200

    def test_trends_structure(self, client):
        """Test trends has correct structure."""
        response = client.get("/api/statistics/trends")
        assert response.status_code == 200
        data = response.json()
        for item in data["yearly_data"]:
            assert "year" in item
            assert "total_cases" in item
            assert "solve_rate" in item
            assert "solved_cases" in item
            assert "unsolved_cases" in item

    def test_trends_overall_trend_values(self, client):
        """Test that overall_trend has valid value."""
        response = client.get("/api/statistics/trends")
        assert response.status_code == 200
        data = response.json()
        assert data["overall_trend"] in ["increasing", "decreasing", "stable"]


class TestSeasonalStatistics:
    """Test GET /api/statistics/seasonal endpoint."""

    def test_seasonal_returns_monthly_patterns(self, client):
        """Test that seasonal endpoint returns monthly patterns."""
        response = client.get("/api/statistics/seasonal")
        assert response.status_code == 200
        data = response.json()
        assert "patterns" in data
        assert "peak_month" in data
        assert "lowest_month" in data
        assert len(data["patterns"]) == 12  # 12 months

    def test_seasonal_with_filters(self, client):
        """Test seasonal with filters."""
        response = client.get("/api/statistics/seasonal?state=California")
        assert response.status_code == 200

    def test_seasonal_structure(self, client):
        """Test seasonal has correct structure."""
        response = client.get("/api/statistics/seasonal")
        assert response.status_code == 200
        data = response.json()
        for item in data["patterns"]:
            assert "month" in item
            assert "month_name" in item
            assert "average_cases" in item
            assert "percentage_of_annual" in item

    def test_seasonal_months_ordered(self, client):
        """Test that months are in order 1-12."""
        response = client.get("/api/statistics/seasonal")
        assert response.status_code == 200
        data = response.json()
        months = [item["month"] for item in data["patterns"]]
        assert months == list(range(1, 13))


class TestStatisticsEdgeCases:
    """Test edge cases for statistics endpoints."""

    def test_summary_empty_result(self, client):
        """Test summary with filters that return no results."""
        response = client.get("/api/statistics/summary?state=NonexistentState")
        assert response.status_code == 200
        data = response.json()
        assert data["total_cases"] == 0

    def test_demographics_empty_result(self, client):
        """Test demographics with filters that return no results."""
        response = client.get("/api/statistics/demographics?state=NonexistentState")
        assert response.status_code == 200

    def test_weapons_empty_result(self, client):
        """Test weapons with filters that return no results."""
        response = client.get("/api/statistics/weapons?state=NonexistentState")
        assert response.status_code == 200
        data = response.json()
        assert data["weapons"] == []
        assert data["total_cases"] == 0

    def test_multiple_filters_combined(self, client):
        """Test with multiple filters combined."""
        response = client.get(
            "/api/statistics/summary?state=California&victim_sex=Female&weapon=Handgun"
        )
        assert response.status_code == 200

    def test_invalid_year_range(self, client):
        """Test with invalid year range (validation should reject)."""
        response = client.get("/api/statistics/summary?year_start=1900")
        assert response.status_code == 422  # Validation error

    def test_geographic_invalid_top_n(self, client):
        """Test geographic with invalid top_n parameter."""
        response = client.get("/api/statistics/geographic?top_n=100")
        assert response.status_code == 422  # Validation error (max is 50)

    def test_circumstances_empty_result(self, client):
        """Test circumstances with filters that return no results."""
        response = client.get("/api/statistics/circumstances?state=NonexistentState")
        assert response.status_code == 200
        data = response.json()
        assert data["circumstances"] == []
        assert data["total_cases"] == 0

    def test_relationships_empty_result(self, client):
        """Test relationships with filters that return no results."""
        response = client.get("/api/statistics/relationships?state=NonexistentState")
        assert response.status_code == 200
        data = response.json()
        assert data["relationships"] == []
        assert data["total_cases"] == 0

    def test_trends_empty_result(self, client):
        """Test trends with filters that return no results."""
        response = client.get("/api/statistics/trends?state=NonexistentState")
        assert response.status_code == 200
        data = response.json()
        assert data["yearly_data"] == []

    def test_seasonal_empty_result(self, client):
        """Test seasonal with filters that return no results."""
        response = client.get("/api/statistics/seasonal?state=NonexistentState")
        assert response.status_code == 200