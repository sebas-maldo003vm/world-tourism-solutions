package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.ProviderDailyAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProviderDailyAnalyticsRepository extends JpaRepository<ProviderDailyAnalytics, Long> {

	/**
	 * Upsert atómico del día actual (zona de la BD / CURRENT_DATE).
	 * Incrementa solo los contadores &gt; 0 enviados en el payload.
	 */
	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query(value = """
			INSERT INTO provider_daily_analytics (
				provider_profile_id, metric_date, views_count, clicks_count, searches_count, updated_at
			) VALUES (
				:providerProfileId, CURRENT_DATE, :views, :clicks, :searches, NOW()
			)
			ON CONFLICT (provider_profile_id, metric_date)
			DO UPDATE SET
				views_count = provider_daily_analytics.views_count + EXCLUDED.views_count,
				clicks_count = provider_daily_analytics.clicks_count + EXCLUDED.clicks_count,
				searches_count = provider_daily_analytics.searches_count + EXCLUDED.searches_count,
				updated_at = NOW()
			""", nativeQuery = true)
	int upsertIncrement(
			@Param("providerProfileId") Long providerProfileId,
			@Param("views") long views,
			@Param("clicks") long clicks,
			@Param("searches") long searches);
}
