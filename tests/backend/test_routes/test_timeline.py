"""Tests for timeline API endpoints.

Tests GET /api/timeline/data, GET /api/timeline/trends with various
granularities, filters, and edge cases.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.main import app


@pytest.fixture
def client(populated_test_db):
    """Create test client with mocked database."""
    with patch("backend.database.connection.get_db_connection") as mock_conn:
        mock_conn.return_value.__enter__.return_value = populated_test_db
        yield TestClient(app)


class TestTimelineData:
    """Test GET /api/timeline/data endpoint."""

    def test_timeline_data_year_granularity(self, client):
        """Test timeline data with year granularity."""
        response = client.get("/api/timeline/data?granularity=year")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "granularity" in data
        assert data["granularity"] == "year"

    def test_timeline_data_month_granularity(self, client):
        """Test timeline data with month granularity."""
        response = client.get("/api/timeline/data?granularity=month")
        assert response.status_code == 200
        data = response.json()
        assert data["granularity"] == "month"

    def test_timeline_data_decade_granularity(self, client):
        """Test timeline data with decade granularity."""
        response = client.get("/api/timeline/data?granularity=decade")
        assert response.status_code == 200
        data = response.json()
        assert data["granularity"] == "decade"

    def test_timeline_data_filters_by_state(self, client):
        """Test filtering by state."""
        response = client.get("/api/timeline/data?granularity=year&state=California")
        assert response.status_code == 200

    def test_timeline_data_filters_by_year_range(self, client):
        """Test filtering by year range."""
        response = client.get(
            "/api/timeline/data?granularity=year&year_start=2000&year_end=2010"
        )
        assert response.status_code == 200
        data = response.json()
        for point in data["data"]:
            # Period is a string like "2000", "2001", etc.
            period_year = int(point["period"])
            assert 2000 <= period_year <= 2010

    def test_timeline_data_includes_solve_rates(self, client):
        """Test that data points include solve rate."""
        response = client.get("/api/timeline/data?granularity=year")
        assert response.status_code == 200
        data = response.json()
        for point in data["data"]:
            assert "total_cases" in point
            assert "solved_cases" in point
            assert "unsolved_cases" in point
            assert "solve_rate" in point

    def test_timeline_data_invalid_granularity(self, client):
        """Test invalid granularity returns error."""
        response = client.get("/api/timeline/data?granularity=invalid")
        assert response.status_code == 422

    def test_timeline_data_filters_by_victim_sex(self, client):
        """Test filtering by victim sex."""
        response = client.get("/api/timeline/data?granularity=year&victim_sex=Female")
        assert response.status_code == 200

    def test_timeline_data_filters_by_victim_race(self, client):
        """Test filtering by victim race."""
        response = client.get("/api/timeline/data?granularity=year&victim_race=White")
        assert response.status_code == 200

    def test_timeline_data_filters_by_weapon(self, client):
        """Test filtering by weapon."""
        response = client.get("/api/timeline/data?granularity=year&weapon=Handgun%20-%20pistol,%20revolver,%20etc")
        assert response.status_code == 200

    def test_timeline_data_filters_by_solved_status(self, client):
        """Test filtering by solved status."""
        response = client.get("/api/timeline/data?granularity=year&solved=false")
        assert response.status_code == 200

    def test_timeline_data_default_granularity(self, client):
        """Test that default granularity is year."""
        response = client.get("/api/timeline/data")
        assert response.status_code == 200
        data = response.json()
        assert data["granularity"] == "year"

    def test_timeline_data_has_date_range(self, client):
        """Test that response includes date range."""
        response = client.get("/api/timeline/data?granularity=year")
        assert response.status_code == 200
        data = response.json()
        assert "date_range" in data
        assert "start" in data["date_range"]
        assert "end" in data["date_range"]

    def test_timeline_data_has_total_cases(self, client):
        """Test that response includes total cases."""
        response = client.get("/api/timeline/data?granularity=year")
        assert response.status_code == 200
        data = response.json()
        assert "total_cases" in data
        assert data["total_cases"] >= 0

    def test_timeline_data_filters_by_county(self, client):
        """Test filtering by county FIPS code."""
        response = client.get("/api/timeline/data?granularity=year&county=06037")
        assert response.status_code == 200

    def test_timeline_data_filters_by_relationship(self, client):
        """Test filtering by relationship."""
        response = client.get("/api/timeline/data?granularity=year&relationship=Stranger")
        assert response.status_code == 200

    def test_timeline_data_filters_by_circumstance(self, client):
        """Test filtering by circumstance."""
        response = client.get("/api/timeline/data?granularity=year&circumstance=Argument")
        assert response.status_code == 200

    def test_timeline_data_filters_by_victim_age_range(self, client):
        """Test filtering by victim age range."""
        response = client.get("/api/timeline/data?granularity=year&victim_age_min=20&victim_age_max=40")
        assert response.status_code == 200


class TestTimelineTrends:
    """Test GET /api/timeline/trends endpoint."""

    def test_timeline_trends_solve_rate(self, client):
        """Test trends for solve rate metric."""
        response = client.get("/api/timeline/trends?metric=solve_rate")
        assert response.status_code == 200
        data = response.json()
        assert "trends" in data
        assert "metric" in data
        assert data["metric"] == "solve_rate"

    def test_timeline_trends_total_cases(self, client):
        """Test trends for total cases metric."""
        response = client.get("/api/timeline/trends?metric=total_cases")
        assert response.status_code == 200
        data = response.json()
        assert data["metric"] == "total_cases"

    def test_timeline_trends_unsolved_cases(self, client):
        """Test trends for unsolved cases metric."""
        response = client.get("/api/timeline/trends?metric=unsolved_cases")
        assert response.status_code == 200
        data = response.json()
        assert data["metric"] == "unsolved_cases"

    def test_timeline_trends_solved_cases(self, client):
        """Test trends for solved cases metric."""
        response = client.get("/api/timeline/trends?metric=solved_cases")
        assert response.status_code == 200
        data = response.json()
        assert data["metric"] == "solved_cases"

    def test_timeline_trends_moving_average(self, client):
        """Test moving average calculation."""
        response = client.get(
            "/api/timeline/trends?metric=solve_rate&moving_average_window=5"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["moving_average_window"] == 5
        for point in data["trends"]:
            assert "moving_average" in point

    def test_timeline_trends_window_validation_too_small(self, client):
        """Test moving average window validation - too small."""
        response = client.get("/api/timeline/trends?moving_average_window=1")
        assert response.status_code == 422

    def test_timeline_trends_window_validation_too_large(self, client):
        """Test moving average window validation - too large."""
        response = client.get("/api/timeline/trends?moving_average_window=20")
        assert response.status_code == 422

    def test_timeline_trends_window_at_min_boundary(self, client):
        """Test moving average window at minimum boundary (2)."""
        response = client.get("/api/timeline/trends?moving_average_window=2")
        assert response.status_code == 200
        data = response.json()
        assert data["moving_average_window"] == 2

    def test_timeline_trends_window_at_max_boundary(self, client):
        """Test moving average window at maximum boundary (10)."""
        response = client.get("/api/timeline/trends?moving_average_window=10")
        assert response.status_code == 200
        data = response.json()
        assert data["moving_average_window"] == 10

    def test_timeline_trends_with_filters(self, client):
        """Test trends with various filters."""
        response = client.get(
            "/api/timeline/trends?metric=solve_rate&state=California&victim_sex=Female"
        )
        assert response.status_code == 200

    def test_timeline_trends_filters_by_year_range(self, client):
        """Test trends filtering by year range."""
        response = client.get(
            "/api/timeline/trends?metric=solve_rate&year_start=2000&year_end=2020"
        )
        assert response.status_code == 200

    def test_timeline_trends_filters_by_weapon(self, client):
        """Test trends filtering by weapon."""
        response = client.get("/api/timeline/trends?metric=total_cases&weapon=Handgun%20-%20pistol,%20revolver,%20etc")
        assert response.status_code == 200

    def test_timeline_trends_default_metric(self, client):
        """Test that default metric is solve_rate."""
        response = client.get("/api/timeline/trends")
        assert response.status_code == 200
        data = response.json()
        assert data["metric"] == "solve_rate"

    def test_timeline_trends_default_window(self, client):
        """Test that default moving average window is 3."""
        response = client.get("/api/timeline/trends")
        assert response.status_code == 200
        data = response.json()
        assert data["moving_average_window"] == 3

    def test_timeline_trends_has_granularity(self, client):
        """Test that response includes granularity."""
        response = client.get("/api/timeline/trends?granularity=month")
        assert response.status_code == 200
        data = response.json()
        assert "granularity" in data
        assert data["granularity"] == "month"

    def test_timeline_trends_invalid_metric(self, client):
        """Test invalid metric returns error."""
        response = client.get("/api/timeline/trends?metric=invalid")
        assert response.status_code == 422

    def test_timeline_trends_filters_by_county(self, client):
        """Test trends filtering by county."""
        response = client.get("/api/timeline/trends?metric=solve_rate&county=06037")
        assert response.status_code == 200

    def test_timeline_trends_filters_by_relationship(self, client):
        """Test trends filtering by relationship."""
        response = client.get("/api/timeline/trends?metric=solve_rate&relationship=Stranger")
        assert response.status_code == 200

    def test_timeline_trends_filters_by_circumstance(self, client):
        """Test trends filtering by circumstance."""
        response = client.get("/api/timeline/trends?metric=solve_rate&circumstance=Argument")
        assert response.status_code == 200


class TestTimelineEdgeCases:
    """Test edge cases for timeline endpoints."""

    def test_timeline_data_empty_result(self, client):
        """Test with filters that return no results."""
        response = client.get("/api/timeline/data?granularity=year&state=NonexistentState")
        assert response.status_code == 200
        data = response.json()
        assert data["data"] == []

    def test_timeline_data_single_year(self, client):
        """Test with single year filter."""
        response = client.get("/api/timeline/data?granularity=year&year_start=2020&year_end=2020")
        assert response.status_code == 200

    def test_timeline_trends_empty_result(self, client):
        """Test trends with filters that return no results."""
        response = client.get("/api/timeline/trends?metric=solve_rate&state=NonexistentState")
        assert response.status_code == 200
        data = response.json()
        assert data["trends"] == []

    def test_timeline_data_multiple_filters(self, client):
        """Test with multiple filters combined."""
        response = client.get(
            "/api/timeline/data?granularity=year&state=California&victim_sex=Female&weapon=Handgun%20-%20pistol,%20revolver,%20etc"
        )
        assert response.status_code == 200

    def test_timeline_data_year_validation_min(self, client):
        """Test year_start minimum validation."""
        response = client.get("/api/timeline/data?year_start=1900")
        assert response.status_code == 422

    def test_timeline_data_year_validation_max(self, client):
        """Test year_end maximum validation."""
        response = client.get("/api/timeline/data?year_end=2050")
        assert response.status_code == 422

    def test_timeline_trends_year_validation_min(self, client):
        """Test year_start minimum validation for trends."""
        response = client.get("/api/timeline/trends?year_start=1900")
        assert response.status_code == 422

    def test_timeline_trends_year_validation_max(self, client):
        """Test year_end maximum validation for trends."""
        response = client.get("/api/timeline/trends?year_end=2050")
        assert response.status_code == 422

    def test_timeline_data_age_validation_min(self, client):
        """Test victim_age_min validation."""
        response = client.get("/api/timeline/data?victim_age_min=-1")
        assert response.status_code == 422

    def test_timeline_data_age_validation_max(self, client):
        """Test victim_age_max validation."""
        response = client.get("/api/timeline/data?victim_age_max=1000")
        assert response.status_code == 422

    def test_timeline_trends_multiple_filters(self, client):
        """Test trends with multiple filters combined."""
        response = client.get(
            "/api/timeline/trends?metric=solve_rate&state=California&victim_sex=Female&year_start=2000&year_end=2010"
        )
        assert response.status_code == 200


class TestTimelineErrorHandling:
    """Test error handling for timeline endpoints."""

    def test_timeline_data_handles_database_errors(self, client):
        """Test that data endpoint handles database errors gracefully."""
        with patch("routes.timeline.get_timeline_data") as mock_service:
            mock_service.side_effect = Exception("Database error")
            
            response = client.get("/api/timeline/data")
            
            assert response.status_code == 500

    def test_timeline_trends_handles_database_errors(self, client):
        """Test that trends endpoint handles database errors gracefully."""
        with patch("routes.timeline.get_timeline_trends") as mock_service:
            mock_service.side_effect = Exception("Database error")
            
            response = client.get("/api/timeline/trends")
            
            assert response.status_code == 500


class TestTimelineFilterCombinations:
    """Test various filter combinations for timeline endpoints."""

    def test_timeline_data_all_primary_filters(self, client):
        """Test combining all primary filters for timeline data."""
        response = client.get(
            "/api/timeline/data?granularity=year&state=ILLINOIS&year_start=1990&year_end=2000&solved=false"
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data

    def test_timeline_data_demographics_and_crime_filters(self, client):
        """Test combining demographic and crime filters for timeline data."""
        response = client.get(
            "/api/timeline/data?granularity=year&victim_sex=Female&victim_race=White&weapon=Strangulation%20-%20hanging"
        )
        assert response.status_code == 200

    def test_timeline_trends_all_primary_filters(self, client):
        """Test combining all primary filters for trends."""
        response = client.get(
            "/api/timeline/trends?metric=solve_rate&state=ILLINOIS&year_start=1990&year_end=2000&solved=false"
        )
        assert response.status_code == 200

    def test_timeline_trends_demographics_and_crime_filters(self, client):
        """Test combining demographic and crime filters for trends."""
        response = client.get(
            "/api/timeline/trends?metric=total_cases&victim_sex=Female&victim_race=White&weapon=Strangulation%20-%20hanging"
        )
        assert response.status_code == 200

    def test_timeline_data_full_filter_combination(self, client):
        """Test applying many filters simultaneously for timeline data."""
        response = client.get(
            "/api/timeline/data?"
            "granularity=year&"
            "state=ILLINOIS&"
            "year_start=1990&year_end=1995&"
            "solved=false&"
            "victim_sex=Female&"
            "victim_race=White&"
            "weapon=Strangulation%20-%20hanging&"
            "relationship=Unknown&"
            "circumstance=Unknown"
        )
        assert response.status_code == 200

    def test_timeline_trends_full_filter_combination(self, client):
        """Test applying many filters simultaneously for trends."""
        response = client.get(
            "/api/timeline/trends?"
            "metric=solve_rate&"
            "granularity=year&"
            "moving_average_window=5&"
            "state=ILLINOIS&"
            "year_start=1990&year_end=1995&"
            "solved=false&"
            "victim_sex=Female&"
            "victim_race=White&"
            "weapon=Strangulation%20-%20hanging&"
            "relationship=Unknown&"
            "circumstance=Unknown"
        )
        assert response.status_code == 200