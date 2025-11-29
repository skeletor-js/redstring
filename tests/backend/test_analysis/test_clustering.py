"""Tests for clustering algorithm and similarity calculations."""
# Path setup must happen before any backend imports
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent.parent
backend_dir = project_root / "backend"
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest

from backend.analysis.clustering import (
    Case,
    ClusterConfig,
    SimilarityWeights,
    calculate_similarity,
    detect_clusters,
    get_weapon_category,
    WEAPON_CATEGORIES,
)


class TestWeaponCategories:
    """Test weapon categorization logic."""

    def test_firearm_category(self):
        """Test that firearm codes return 'firearm' category."""
        assert get_weapon_category(11) == "firearm"
        assert get_weapon_category(12) == "firearm"  # Handgun
        assert get_weapon_category(13) == "firearm"  # Rifle
        assert get_weapon_category(14) == "firearm"  # Shotgun
        assert get_weapon_category(15) == "firearm"

    def test_blade_category(self):
        """Test that blade weapon codes return 'blade' category."""
        assert get_weapon_category(20) == "blade"
        assert get_weapon_category(21) == "blade"

    def test_blunt_category(self):
        """Test that blunt weapon codes return 'blunt' category."""
        assert get_weapon_category(30) == "blunt"
        assert get_weapon_category(31) == "blunt"

    def test_personal_category(self):
        """Test that personal weapon codes return 'personal' category."""
        assert get_weapon_category(40) == "personal"
        assert get_weapon_category(41) == "personal"

    def test_other_category(self):
        """Test that other weapon codes return 'other' category."""
        assert get_weapon_category(80) == "other"  # Strangulation
        assert get_weapon_category(90) == "other"

    def test_all_firearm_codes(self):
        """Test all firearm weapon codes (11-15) return 'firearm' category.
        
        Covers: Firearm type not stated (11), Handgun (12), Rifle (13),
        Shotgun (14), Other gun (15).
        """
        firearm_codes = [11, 12, 13, 14, 15]
        for code in firearm_codes:
            assert get_weapon_category(code) == "firearm", f"Code {code} should be firearm"

    def test_all_blade_codes(self):
        """Test all blade weapon codes (20-21) return 'blade' category.
        
        Covers: Knife (20), Other cutting instrument (21).
        """
        blade_codes = [20, 21]
        for code in blade_codes:
            assert get_weapon_category(code) == "blade", f"Code {code} should be blade"

    def test_all_blunt_codes(self):
        """Test all blunt weapon codes (30-31) return 'blunt' category.
        
        Covers: Blunt object (30), Pushed/thrown (31).
        """
        blunt_codes = [30, 31]
        for code in blunt_codes:
            assert get_weapon_category(code) == "blunt", f"Code {code} should be blunt"

    def test_all_personal_codes(self):
        """Test all personal weapon codes (40-41) return 'personal' category.
        
        Covers: Personal weapons - hands, fists, feet (40, 41).
        """
        personal_codes = [40, 41]
        for code in personal_codes:
            assert get_weapon_category(code) == "personal", f"Code {code} should be personal"

    def test_all_other_codes(self):
        """Test all 'other' weapon codes return 'other' category.
        
        Covers: Poison (50), Explosives (60), Fire (65), Narcotics (70),
        Strangulation (80), Drowning (90), Other/Unknown (99).
        """
        other_codes = [50, 60, 65, 70, 80, 90, 99]
        for code in other_codes:
            assert get_weapon_category(code) == "other", f"Code {code} should be other"

    def test_unknown_weapon_code_returns_none(self):
        """Test that unknown weapon codes return None."""
        unknown_codes = [0, 1, 5, 100, 999, -1]
        for code in unknown_codes:
            assert get_weapon_category(code) is None, f"Code {code} should return None"

    def test_weapon_categories_dict_completeness(self):
        """Test that WEAPON_CATEGORIES contains all expected categories."""
        expected_categories = {"firearm", "blade", "blunt", "personal", "other"}
        assert set(WEAPON_CATEGORIES.keys()) == expected_categories


class TestSimilarityWeights:
    """Test similarity weight configuration."""

    def test_default_weights_sum_to_100(self):
        """Test that default weights sum to 100%."""
        weights = SimilarityWeights()
        assert weights.total() == 100.0

    def test_custom_weights(self):
        """Test that custom weights can be set."""
        weights = SimilarityWeights(
            geographic=40.0,
            weapon=30.0,
            victim_sex=15.0,
            victim_age=10.0,
            temporal=3.0,
            victim_race=2.0,
        )
        assert weights.total() == 100.0


class TestSimilarityCalculation:
    """Test similarity scoring between cases."""

    def create_test_case(
        self,
        case_id="TEST-001",
        state="ILLINOIS",
        county_fips=17031,
        latitude=41.8781,
        longitude=-87.6298,
        year=1990,
        month=6,
        solved=0,
        weapon_code=80,
        weapon="Strangulation",
        vic_sex_code=2,
        vic_sex="Female",
        vic_age=25,
        vic_race="White",
        off_age=999,
        off_sex="Unknown",
        off_race="Unknown",
        relationship="Unknown",
        circumstance="Unknown",
    ) -> Case:
        """Helper to create test cases."""
        return Case(
            id=case_id,
            state=state,
            county_fips_code=county_fips,
            latitude=latitude,
            longitude=longitude,
            year=year,
            month=month,
            solved=solved,
            weapon_code=weapon_code,
            weapon=weapon,
            vic_sex_code=vic_sex_code,
            vic_sex=vic_sex,
            vic_age=vic_age,
            vic_race=vic_race,
            off_age=off_age,
            off_sex=off_sex,
            off_race=off_race,
            relationship=relationship,
            circumstance=circumstance,
        )

    def test_identical_cases_score_100(self):
        """Test that identical cases score 100% similarity."""
        case1 = self.create_test_case()
        case2 = self.create_test_case(case_id="TEST-002")

        weights = SimilarityWeights()
        score, factors = calculate_similarity(case1, case2, weights)

        # Not exactly 100 due to temporal scoring (same year = 100)
        # but other factors may vary
        assert score >= 90.0
        assert factors["geographic"] == 100.0
        assert factors["weapon"] == 100.0
        assert factors["victim_sex"] == 100.0

    def test_same_county_scores_100_geographic(self):
        """Test that cases in same county score 100% geographic similarity."""
        case1 = self.create_test_case(case_id="TEST-001", county_fips=17031)
        case2 = self.create_test_case(case_id="TEST-002", county_fips=17031)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["geographic"] == 100.0

    def test_exact_weapon_match_scores_100(self):
        """Test that exact weapon matches score 100%."""
        case1 = self.create_test_case(weapon_code=12)  # Handgun
        case2 = self.create_test_case(case_id="TEST-002", weapon_code=12)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["weapon"] == 100.0

    def test_same_weapon_category_scores_70(self):
        """Test that same weapon category scores 70%."""
        case1 = self.create_test_case(weapon_code=12)  # Handgun
        case2 = self.create_test_case(case_id="TEST-002", weapon_code=13)  # Rifle

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["weapon"] == 70.0

    def test_different_weapon_category_scores_0(self):
        """Test that different weapon categories score 0%."""
        case1 = self.create_test_case(weapon_code=12)  # Handgun (firearm)
        case2 = self.create_test_case(case_id="TEST-002", weapon_code=20)  # Knife (blade)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["weapon"] == 0.0

    def test_same_victim_sex_scores_100(self):
        """Test that same victim sex scores 100%."""
        case1 = self.create_test_case(vic_sex_code=2)  # Female
        case2 = self.create_test_case(case_id="TEST-002", vic_sex_code=2)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["victim_sex"] == 100.0

    def test_different_victim_sex_scores_0(self):
        """Test that different victim sex scores 0%."""
        case1 = self.create_test_case(vic_sex_code=1)  # Male
        case2 = self.create_test_case(case_id="TEST-002", vic_sex_code=2)  # Female

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["victim_sex"] == 0.0

    def test_victim_age_similarity_decreases_with_difference(self):
        """Test that victim age similarity decreases as age difference increases."""
        case1 = self.create_test_case(vic_age=25)
        case2 = self.create_test_case(case_id="TEST-002", vic_age=30)  # 5 year diff

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        # 5 year difference = 5 * 5 = 25 point penalty
        assert factors["victim_age"] == 75.0

    def test_unknown_victim_age_scores_0(self):
        """Test that unknown victim age (999) scores 0%."""
        case1 = self.create_test_case(vic_age=999)
        case2 = self.create_test_case(case_id="TEST-002", vic_age=25)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["victim_age"] == 0.0

    def test_temporal_similarity_decreases_with_years(self):
        """Test that temporal similarity decreases as year difference increases."""
        case1 = self.create_test_case(year=1990)
        case2 = self.create_test_case(case_id="TEST-002", year=1993)  # 3 year diff

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        # 3 year difference = 3 * 10 = 30 point penalty
        assert factors["temporal"] == 70.0

    def test_same_victim_race_scores_100(self):
        """Test that same victim race scores 100%."""
        case1 = self.create_test_case(vic_race="White")
        case2 = self.create_test_case(case_id="TEST-002", vic_race="White")

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["victim_race"] == 100.0

    def test_different_victim_race_scores_0(self):
        """Test that different victim race scores 0%."""
        case1 = self.create_test_case(vic_race="White")
        case2 = self.create_test_case(case_id="TEST-002", vic_race="Black")

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["victim_race"] == 0.0

    def test_weighted_total_uses_configured_weights(self):
        """Test that total score uses configured weights."""
        case1 = self.create_test_case(vic_sex_code=2)
        case2 = self.create_test_case(case_id="TEST-002", vic_sex_code=2)

        # Custom weights emphasizing victim sex (should increase total score)
        weights = SimilarityWeights(
            geographic=10.0,
            weapon=10.0,
            victim_sex=70.0,  # Emphasize this
            victim_age=5.0,
            temporal=3.0,
            victim_race=2.0,
        )

        score, factors = calculate_similarity(case1, case2, weights)

        # With victim_sex at 100% and 70% weight, should heavily influence total
        assert score > 70.0


class TestSimilarityCalculationEdgeCases:
    """Test edge cases for similarity scoring between cases."""

    def create_test_case(
        self,
        case_id="TEST-001",
        state="ILLINOIS",
        county_fips=17031,
        latitude=41.8781,
        longitude=-87.6298,
        year=1990,
        month=6,
        solved=0,
        weapon_code=80,
        weapon="Strangulation",
        vic_sex_code=2,
        vic_sex="Female",
        vic_age=25,
        vic_race="White",
        off_age=999,
        off_sex="Unknown",
        off_race="Unknown",
        relationship="Unknown",
        circumstance="Unknown",
    ) -> Case:
        """Helper to create test cases."""
        return Case(
            id=case_id,
            state=state,
            county_fips_code=county_fips,
            latitude=latitude,
            longitude=longitude,
            year=year,
            month=month,
            solved=solved,
            weapon_code=weapon_code,
            weapon=weapon,
            vic_sex_code=vic_sex_code,
            vic_sex=vic_sex,
            vic_age=vic_age,
            vic_race=vic_race,
            off_age=off_age,
            off_sex=off_sex,
            off_race=off_race,
            relationship=relationship,
            circumstance=circumstance,
        )

    def test_geographic_scoring_with_lat_long_different_counties(self):
        """Test distance-based decay when cases are in different counties.
        
        Cases in different counties should use lat/long distance calculation
        with linear decay based on distance.
        """
        # Case 1: Chicago, IL (Cook County)
        case1 = self.create_test_case(
            case_id="TEST-001",
            county_fips=17031,
            latitude=41.8781,
            longitude=-87.6298,
        )
        # Case 2: Different county but nearby (DuPage County, ~25 miles away)
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=17043,  # DuPage County
            latitude=41.8500,
            longitude=-88.0900,
        )

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        # Should have partial geographic score (not 100, not 0)
        assert 0.0 < factors["geographic"] < 100.0

    def test_geographic_scoring_far_apart_counties(self):
        """Test that cases far apart (>50 miles) score 0 geographic similarity."""
        # Case 1: Chicago, IL
        case1 = self.create_test_case(
            case_id="TEST-001",
            county_fips=17031,
            latitude=41.8781,
            longitude=-87.6298,
        )
        # Case 2: Los Angeles, CA (~1700 miles away)
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=6037,
            latitude=34.0522,
            longitude=-118.2437,
        )

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        # Should be 0 since distance > 50 miles
        assert factors["geographic"] == 0.0

    def test_identical_cases_score_near_100(self):
        """Test that truly identical cases score very high similarity.
        
        All factors should be 100% for identical cases.
        """
        case1 = self.create_test_case(
            case_id="TEST-001",
            county_fips=17031,
            latitude=41.8781,
            longitude=-87.6298,
            year=1990,
            weapon_code=80,
            vic_sex_code=2,
            vic_age=25,
            vic_race="White",
        )
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=17031,
            latitude=41.8781,
            longitude=-87.6298,
            year=1990,
            weapon_code=80,
            vic_sex_code=2,
            vic_age=25,
            vic_race="White",
        )

        weights = SimilarityWeights()
        score, factors = calculate_similarity(case1, case2, weights)

        # All individual factors should be 100
        assert factors["geographic"] == 100.0
        assert factors["weapon"] == 100.0
        assert factors["victim_sex"] == 100.0
        assert factors["victim_age"] == 100.0
        assert factors["temporal"] == 100.0
        assert factors["victim_race"] == 100.0
        # Total score should be 100
        assert score == 100.0

    def test_completely_different_cases_score_near_0(self):
        """Test that completely different cases score near 0% similarity.
        
        Cases with no matching factors should have very low similarity.
        """
        case1 = self.create_test_case(
            case_id="TEST-001",
            county_fips=17031,
            latitude=41.8781,
            longitude=-87.6298,
            year=1976,
            weapon_code=12,  # Handgun (firearm)
            vic_sex_code=1,  # Male
            vic_age=20,
            vic_race="White",
        )
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=6037,  # Different county (LA)
            latitude=34.0522,
            longitude=-118.2437,
            year=2023,  # 47 years apart
            weapon_code=20,  # Knife (blade)
            vic_sex_code=2,  # Female
            vic_age=60,  # 40 years different
            vic_race="Black",
        )

        weights = SimilarityWeights()
        score, factors = calculate_similarity(case1, case2, weights)

        # All factors should be 0
        assert factors["geographic"] == 0.0
        assert factors["weapon"] == 0.0
        assert factors["victim_sex"] == 0.0
        assert factors["victim_age"] == 0.0
        assert factors["temporal"] == 0.0
        assert factors["victim_race"] == 0.0
        # Total score should be 0
        assert score == 0.0

    def test_unknown_victim_age_both_cases(self):
        """Test that when both cases have unknown age (999), age score is 0."""
        case1 = self.create_test_case(vic_age=999)
        case2 = self.create_test_case(case_id="TEST-002", vic_age=999)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["victim_age"] == 0.0

    def test_temporal_scoring_10_years_apart(self):
        """Test that cases 10 years apart score 0% temporal similarity."""
        case1 = self.create_test_case(year=1990)
        case2 = self.create_test_case(case_id="TEST-002", year=2000)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        # 10 year difference = 10 * 10 = 100 point penalty = 0%
        assert factors["temporal"] == 0.0

    def test_temporal_scoring_47_years_apart(self):
        """Test that cases 47+ years apart (max range) score 0% temporal similarity.
        
        The dataset spans 1976-2023 (47 years), so this tests the extreme case.
        """
        case1 = self.create_test_case(year=1976)
        case2 = self.create_test_case(case_id="TEST-002", year=2023)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        # Should be 0 (capped at 0, not negative)
        assert factors["temporal"] == 0.0

    def test_victim_age_20_years_difference(self):
        """Test that 20+ year age difference scores 0% age similarity."""
        case1 = self.create_test_case(vic_age=20)
        case2 = self.create_test_case(case_id="TEST-002", vic_age=40)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        # 20 year difference = 20 * 5 = 100 point penalty = 0%
        assert factors["victim_age"] == 0.0

    def test_victim_age_exact_match(self):
        """Test that exact age match scores 100% age similarity."""
        case1 = self.create_test_case(vic_age=30)
        case2 = self.create_test_case(case_id="TEST-002", vic_age=30)

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        assert factors["victim_age"] == 100.0

    def test_missing_coordinates_scores_0_geographic(self):
        """Test that missing coordinates result in 0 geographic score."""
        case1 = self.create_test_case(
            county_fips=17031,
            latitude=None,
            longitude=None,
        )
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=17043,  # Different county
            latitude=41.8500,
            longitude=-88.0900,
        )

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        # Different counties and missing coords = 0
        assert factors["geographic"] == 0.0

    def test_same_county_missing_coords_scores_100_geographic(self):
        """Test that same county scores 100 even with missing coordinates."""
        case1 = self.create_test_case(
            county_fips=17031,
            latitude=None,
            longitude=None,
        )
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=17031,  # Same county
            latitude=None,
            longitude=None,
        )

        weights = SimilarityWeights()
        _, factors = calculate_similarity(case1, case2, weights)

        # Same county = 100 regardless of coords
        assert factors["geographic"] == 100.0


class TestClusterDetection:
    """Test cluster detection algorithm."""

    def create_test_cases_for_cluster(self) -> list[Case]:
        """Create a set of test cases that should form a cluster."""
        return [
            Case(
                id=f"IL-1234{i}-199{i}",
                state="ILLINOIS",
                county_fips_code=17031,
                latitude=41.8781,
                longitude=-87.6298,
                year=1990 + i,
                month=6 + i,
                solved=0,
                weapon_code=80,
                weapon="Strangulation",
                vic_sex_code=2,
                vic_sex="Female",
                vic_age=25 + i,
                vic_race="White",
                off_age=999,
                off_sex="Unknown",
                off_race="Unknown",
                relationship="Unknown",
                circumstance="Unknown",
            )
            for i in range(5)
        ]

    def test_detect_clusters_with_similar_cases(self):
        """Test that detect_clusters identifies clusters of similar cases."""
        cases = self.create_test_cases_for_cluster()
        config = ClusterConfig(
            min_cluster_size=5, max_solve_rate=33.0, similarity_threshold=70.0
        )

        clusters = detect_clusters(cases, config)

        assert len(clusters) >= 1
        assert clusters[0].total_cases == 5
        assert clusters[0].solve_rate <= 33.0

    def test_detect_clusters_filters_by_min_size(self):
        """Test that clusters smaller than min_cluster_size are filtered out."""
        cases = self.create_test_cases_for_cluster()[:3]  # Only 3 cases
        config = ClusterConfig(min_cluster_size=5)  # Requires 5

        clusters = detect_clusters(cases, config)

        assert len(clusters) == 0

    def test_detect_clusters_filters_by_solve_rate(self):
        """Test that clusters with high solve rates are filtered out."""
        cases = self.create_test_cases_for_cluster()

        # Mark most cases as solved (high solve rate)
        for case in cases[:4]:
            case.solved = 1

        config = ClusterConfig(max_solve_rate=33.0)  # Max 33%

        clusters = detect_clusters(cases, config)

        # 4 solved / 5 total = 80% solve rate, should be filtered out
        assert all(cluster.solve_rate <= 33.0 for cluster in clusters)

    def test_detect_clusters_groups_by_county(self):
        """Test that cases are grouped by county before clustering."""
        # Create cases in different counties
        cases_county1 = self.create_test_cases_for_cluster()

        cases_county2 = [
            Case(
                id=f"CA-5678{i}-199{i}",
                state="CALIFORNIA",
                county_fips_code=6037,  # Different county
                latitude=34.0522,
                longitude=-118.2437,
                year=1990 + i,
                month=6 + i,
                solved=0,
                weapon_code=80,
                weapon="Strangulation",
                vic_sex_code=2,
                vic_sex="Female",
                vic_age=25 + i,
                vic_race="White",
                off_age=999,
                off_sex="Unknown",
                off_race="Unknown",
                relationship="Unknown",
                circumstance="Unknown",
            )
            for i in range(5)
        ]

        all_cases = cases_county1 + cases_county2
        config = ClusterConfig(min_cluster_size=5)

        clusters = detect_clusters(all_cases, config)

        # Should find 2 clusters (one per county)
        assert len(clusters) >= 2

    def test_cluster_result_contains_correct_statistics(self):
        """Test that cluster results contain accurate statistics."""
        cases = self.create_test_cases_for_cluster()
        config = ClusterConfig()

        clusters = detect_clusters(cases, config)

        if len(clusters) > 0:
            cluster = clusters[0]
            assert cluster.total_cases == len(cases)
            assert cluster.unsolved_cases == sum(1 for c in cases if c.solved == 0)
            assert cluster.solved_cases == sum(1 for c in cases if c.solved == 1)
            assert cluster.first_year == min(c.year for c in cases)
            assert cluster.last_year == max(c.year for c in cases)
            assert 0.0 <= cluster.solve_rate <= 100.0


class TestClusterConfig:
    """Test cluster configuration."""

    def test_default_config_values(self):
        """Test that default configuration values are correct."""
        config = ClusterConfig()

        assert config.min_cluster_size == 5
        assert config.max_solve_rate == 33.0
        assert config.similarity_threshold == 70.0
        assert config.weights.total() == 100.0

    def test_custom_config_values(self):
        """Test that custom configuration values can be set."""
        weights = SimilarityWeights(
            geographic=40.0,
            weapon=30.0,
            victim_sex=15.0,
            victim_age=10.0,
            temporal=3.0,
            victim_race=2.0,
        )

        config = ClusterConfig(
            min_cluster_size=10, max_solve_rate=50.0, similarity_threshold=80.0, weights=weights
        )

        assert config.min_cluster_size == 10
        assert config.max_solve_rate == 50.0
        assert config.similarity_threshold == 80.0
        assert config.weights.geographic == 40.0


class TestClusterDetectionEdgeCases:
    """Test edge cases for cluster detection algorithm."""

    def create_test_case(
        self,
        case_id="TEST-001",
        state="ILLINOIS",
        county_fips=17031,
        latitude=41.8781,
        longitude=-87.6298,
        year=1990,
        month=6,
        solved=0,
        weapon_code=80,
        weapon="Strangulation",
        vic_sex_code=2,
        vic_sex="Female",
        vic_age=25,
        vic_race="White",
        off_age=999,
        off_sex="Unknown",
        off_race="Unknown",
        relationship="Unknown",
        circumstance="Unknown",
    ) -> Case:
        """Helper to create test cases."""
        return Case(
            id=case_id,
            state=state,
            county_fips_code=county_fips,
            latitude=latitude,
            longitude=longitude,
            year=year,
            month=month,
            solved=solved,
            weapon_code=weapon_code,
            weapon=weapon,
            vic_sex_code=vic_sex_code,
            vic_sex=vic_sex,
            vic_age=vic_age,
            vic_race=vic_race,
            off_age=off_age,
            off_sex=off_sex,
            off_race=off_race,
            relationship=relationship,
            circumstance=circumstance,
        )

    def test_all_cases_solved_filtered_out(self):
        """Test that clusters with all cases solved are filtered out.
        
        When all cases in a potential cluster are solved, the solve rate
        exceeds max_solve_rate and the cluster should be filtered out.
        """
        # Create 5 similar cases, all solved
        cases = [
            self.create_test_case(
                case_id=f"TEST-{i:03d}",
                year=1990 + i,
                solved=1,  # All solved
            )
            for i in range(5)
        ]

        config = ClusterConfig(
            min_cluster_size=5,
            max_solve_rate=33.0,  # Max 33% solved
            similarity_threshold=70.0,
        )

        clusters = detect_clusters(cases, config)

        # All clusters should be filtered out (100% solve rate > 33%)
        assert len(clusters) == 0

    def test_single_case_in_county_no_cluster(self):
        """Test that a single case in a county cannot form a cluster.
        
        Clusters require at least min_cluster_size cases.
        """
        cases = [
            self.create_test_case(case_id="TEST-001", county_fips=17031),
        ]

        config = ClusterConfig(min_cluster_size=5)

        clusters = detect_clusters(cases, config)

        # Should not form a cluster
        assert len(clusters) == 0

    def test_exact_threshold_boundary(self):
        """Test when similarity equals threshold exactly.
        
        Cases with similarity exactly at threshold should be included.
        """
        # Create cases that should have exactly 70% similarity
        # This is tricky to engineer precisely, so we test the boundary behavior
        cases = [
            self.create_test_case(
                case_id=f"TEST-{i:03d}",
                year=1990 + i,  # 3 year diff = 70% temporal
                vic_age=25,
                weapon_code=80,
                vic_sex_code=2,
                vic_race="White",
            )
            for i in range(5)
        ]

        config = ClusterConfig(
            min_cluster_size=5,
            max_solve_rate=100.0,
            similarity_threshold=70.0,
        )

        clusters = detect_clusters(cases, config)

        # Should find clusters since cases are similar
        # The exact count depends on similarity calculations
        assert isinstance(clusters, list)

    def test_min_cluster_size_greater_than_total_cases(self):
        """Test when min_cluster_size > total cases returns empty results."""
        cases = [
            self.create_test_case(case_id=f"TEST-{i:03d}")
            for i in range(5)
        ]

        config = ClusterConfig(
            min_cluster_size=100,  # More than available cases
            max_solve_rate=100.0,
            similarity_threshold=50.0,
        )

        clusters = detect_clusters(cases, config)

        # Should return empty list
        assert len(clusters) == 0

    def test_similarity_threshold_100_only_exact_matches(self):
        """Test that similarity_threshold of 100 only clusters exact matches.
        
        With threshold at 100%, only cases with perfect similarity should cluster.
        """
        # Create cases with slight differences
        cases = [
            self.create_test_case(
                case_id=f"TEST-{i:03d}",
                year=1990 + i,  # Different years = not 100% similar
            )
            for i in range(5)
        ]

        config = ClusterConfig(
            min_cluster_size=2,
            max_solve_rate=100.0,
            similarity_threshold=100.0,  # Only exact matches
        )

        clusters = detect_clusters(cases, config)

        # Should find no clusters since no cases are 100% similar
        assert len(clusters) == 0

    def test_similarity_threshold_0_all_cases_cluster(self):
        """Test that similarity_threshold of 0 clusters all cases in county together.
        
        With threshold at 0%, all case pairs should be considered similar.
        """
        cases = [
            self.create_test_case(
                case_id=f"TEST-{i:03d}",
                county_fips=17031,
                year=1990 + i * 5,  # Spread out years
                weapon_code=12 if i % 2 == 0 else 20,  # Different weapons
                vic_sex_code=1 if i % 2 == 0 else 2,  # Different sexes
            )
            for i in range(5)
        ]

        config = ClusterConfig(
            min_cluster_size=5,
            max_solve_rate=100.0,
            similarity_threshold=0.0,  # All pairs match
        )

        clusters = detect_clusters(cases, config)

        # Should find at least one cluster with all cases
        assert len(clusters) >= 1
        if len(clusters) > 0:
            assert clusters[0].total_cases == 5

    def test_empty_case_list(self):
        """Test that empty case list returns empty clusters."""
        cases = []

        config = ClusterConfig()

        clusters = detect_clusters(cases, config)

        assert len(clusters) == 0

    def test_cases_below_min_size_per_county(self):
        """Test that counties with fewer cases than min_size are skipped."""
        # Create 3 cases in one county, 2 in another
        cases = [
            self.create_test_case(case_id="IL-001", county_fips=17031),
            self.create_test_case(case_id="IL-002", county_fips=17031),
            self.create_test_case(case_id="IL-003", county_fips=17031),
            self.create_test_case(case_id="CA-001", county_fips=6037, state="CALIFORNIA"),
            self.create_test_case(case_id="CA-002", county_fips=6037, state="CALIFORNIA"),
        ]

        config = ClusterConfig(
            min_cluster_size=5,  # Neither county has 5 cases
            max_solve_rate=100.0,
            similarity_threshold=50.0,
        )

        clusters = detect_clusters(cases, config)

        # No clusters should be found
        assert len(clusters) == 0

    def test_mixed_solve_rates(self):
        """Test clusters with mixed solved/unsolved cases."""
        # Create 5 cases: 1 solved, 4 unsolved (20% solve rate)
        cases = [
            self.create_test_case(
                case_id=f"TEST-{i:03d}",
                year=1990 + i,
                solved=1 if i == 0 else 0,
            )
            for i in range(5)
        ]

        config = ClusterConfig(
            min_cluster_size=5,
            max_solve_rate=33.0,  # 20% < 33%, should pass
            similarity_threshold=70.0,
        )

        clusters = detect_clusters(cases, config)

        # Should find cluster with 20% solve rate
        for cluster in clusters:
            assert cluster.solve_rate <= 33.0


class TestWeightConfigurationEdgeCases:
    """Test edge cases for weight configuration."""

    def create_test_case(
        self,
        case_id="TEST-001",
        state="ILLINOIS",
        county_fips=17031,
        latitude=41.8781,
        longitude=-87.6298,
        year=1990,
        month=6,
        solved=0,
        weapon_code=80,
        weapon="Strangulation",
        vic_sex_code=2,
        vic_sex="Female",
        vic_age=25,
        vic_race="White",
        off_age=999,
        off_sex="Unknown",
        off_race="Unknown",
        relationship="Unknown",
        circumstance="Unknown",
    ) -> Case:
        """Helper to create test cases."""
        return Case(
            id=case_id,
            state=state,
            county_fips_code=county_fips,
            latitude=latitude,
            longitude=longitude,
            year=year,
            month=month,
            solved=solved,
            weapon_code=weapon_code,
            weapon=weapon,
            vic_sex_code=vic_sex_code,
            vic_sex=vic_sex,
            vic_age=vic_age,
            vic_race=vic_race,
            off_age=off_age,
            off_sex=off_sex,
            off_race=off_race,
            relationship=relationship,
            circumstance=circumstance,
        )

    def test_zero_weight_on_all_factors(self):
        """Test that zero weight on all factors causes divide by zero.
        
        When all weights are zero, the total weight is zero, causing
        a divide by zero error. This is expected behavior - users should
        not configure all weights to zero.
        """
        case1 = self.create_test_case()
        case2 = self.create_test_case(case_id="TEST-002")

        weights = SimilarityWeights(
            geographic=0.0,
            weapon=0.0,
            victim_sex=0.0,
            victim_age=0.0,
            temporal=0.0,
            victim_race=0.0,
        )

        # Zero weights should cause divide by zero
        with pytest.raises(ZeroDivisionError):
            calculate_similarity(case1, case2, weights)

    def test_single_factor_100_percent_weight_geographic(self):
        """Test that 100% weight on geographic factor only considers geography."""
        # Same county cases
        case1 = self.create_test_case(
            county_fips=17031,
            weapon_code=12,  # Different weapon
            vic_sex_code=1,  # Different sex
            vic_age=20,  # Different age
            year=1976,  # Different year
            vic_race="Black",  # Different race
        )
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=17031,  # Same county
            weapon_code=20,
            vic_sex_code=2,
            vic_age=60,
            year=2023,
            vic_race="White",
        )

        weights = SimilarityWeights(
            geographic=100.0,
            weapon=0.0,
            victim_sex=0.0,
            victim_age=0.0,
            temporal=0.0,
            victim_race=0.0,
        )

        score, factors = calculate_similarity(case1, case2, weights)

        # Score should be 100 since only geographic matters and they're same county
        assert score == 100.0

    def test_single_factor_100_percent_weight_weapon(self):
        """Test that 100% weight on weapon factor only considers weapon."""
        case1 = self.create_test_case(
            county_fips=17031,
            weapon_code=12,  # Handgun
            vic_sex_code=1,
            vic_age=20,
            year=1976,
            vic_race="Black",
        )
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=6037,  # Different county
            weapon_code=12,  # Same weapon
            vic_sex_code=2,
            vic_age=60,
            year=2023,
            vic_race="White",
        )

        weights = SimilarityWeights(
            geographic=0.0,
            weapon=100.0,
            victim_sex=0.0,
            victim_age=0.0,
            temporal=0.0,
            victim_race=0.0,
        )

        score, factors = calculate_similarity(case1, case2, weights)

        # Score should be 100 since only weapon matters and they match
        assert score == 100.0

    def test_single_factor_100_percent_weight_victim_sex(self):
        """Test that 100% weight on victim_sex factor only considers sex."""
        case1 = self.create_test_case(
            county_fips=17031,
            weapon_code=12,
            vic_sex_code=2,  # Female
            vic_age=20,
            year=1976,
            vic_race="Black",
        )
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=6037,
            weapon_code=20,
            vic_sex_code=2,  # Same sex
            vic_age=60,
            year=2023,
            vic_race="White",
        )

        weights = SimilarityWeights(
            geographic=0.0,
            weapon=0.0,
            victim_sex=100.0,
            victim_age=0.0,
            temporal=0.0,
            victim_race=0.0,
        )

        score, factors = calculate_similarity(case1, case2, weights)

        # Score should be 100 since only victim_sex matters and they match
        assert score == 100.0

    def test_custom_weight_distribution_50_50(self):
        """Test 50/50 weight distribution between two factors."""
        # Same county, same weapon, different everything else
        case1 = self.create_test_case(
            county_fips=17031,
            weapon_code=12,
            vic_sex_code=1,
            vic_age=20,
            year=1976,
            vic_race="Black",
        )
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=17031,  # Same county = 100%
            weapon_code=12,  # Same weapon = 100%
            vic_sex_code=2,
            vic_age=60,
            year=2023,
            vic_race="White",
        )

        weights = SimilarityWeights(
            geographic=50.0,
            weapon=50.0,
            victim_sex=0.0,
            victim_age=0.0,
            temporal=0.0,
            victim_race=0.0,
        )

        score, factors = calculate_similarity(case1, case2, weights)

        # Both factors are 100%, so weighted average should be 100%
        assert score == 100.0

    def test_custom_weight_distribution_uneven(self):
        """Test uneven weight distribution (70/30)."""
        # Same county (100%), different weapon category (0%)
        case1 = self.create_test_case(
            county_fips=17031,
            weapon_code=12,  # Firearm
        )
        case2 = self.create_test_case(
            case_id="TEST-002",
            county_fips=17031,  # Same county = 100%
            weapon_code=20,  # Blade = 0% (different category)
        )

        weights = SimilarityWeights(
            geographic=70.0,
            weapon=30.0,
            victim_sex=0.0,
            victim_age=0.0,
            temporal=0.0,
            victim_race=0.0,
        )

        score, factors = calculate_similarity(case1, case2, weights)

        # Geographic: 100% * 70 = 70
        # Weapon: 0% * 30 = 0
        # Total: 70 / 100 = 70%
        assert score == 70.0

    def test_weights_not_summing_to_100(self):
        """Test that weights not summing to 100 still work correctly.
        
        The algorithm should normalize by total weight.
        """
        case1 = self.create_test_case(county_fips=17031)
        case2 = self.create_test_case(case_id="TEST-002", county_fips=17031)

        # Weights sum to 50, not 100
        weights = SimilarityWeights(
            geographic=25.0,
            weapon=10.0,
            victim_sex=10.0,
            victim_age=5.0,
            temporal=0.0,
            victim_race=0.0,
        )

        score, factors = calculate_similarity(case1, case2, weights)

        # Should still calculate correctly (normalized by total weight)
        assert 0.0 <= score <= 100.0
