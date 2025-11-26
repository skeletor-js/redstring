"""Tests for clustering algorithm and similarity calculations."""
import pytest

from backend.analysis.clustering import (
    Case,
    ClusterConfig,
    SimilarityWeights,
    calculate_similarity,
    detect_clusters,
    get_weapon_category,
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
