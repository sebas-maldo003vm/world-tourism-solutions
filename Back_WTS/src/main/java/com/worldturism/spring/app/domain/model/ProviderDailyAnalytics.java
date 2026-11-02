package com.worldturism.spring.app.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Contadores diarios por proveedor. Evita saturar Postgres/Looker con un INSERT
 * por cada impresión de listado: se hace UPSERT e incrementa columnas.
 */
@Entity
@Table(
		name = "provider_daily_analytics",
		uniqueConstraints = @UniqueConstraint(
				name = "uq_provider_daily_analytics_provider_date",
				columnNames = { "provider_profile_id", "metric_date" }))
public class ProviderDailyAnalytics {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "provider_profile_id", nullable = false)
	private ProviderProfile providerProfile;

	@Column(name = "metric_date", nullable = false)
	private LocalDate metricDate;

	@Column(name = "views_count", nullable = false)
	private long viewsCount;

	@Column(name = "clicks_count", nullable = false)
	private long clicksCount;

	@Column(name = "searches_count", nullable = false)
	private long searchesCount;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public ProviderProfile getProviderProfile() {
		return providerProfile;
	}

	public void setProviderProfile(ProviderProfile providerProfile) {
		this.providerProfile = providerProfile;
	}

	public LocalDate getMetricDate() {
		return metricDate;
	}

	public void setMetricDate(LocalDate metricDate) {
		this.metricDate = metricDate;
	}

	public long getViewsCount() {
		return viewsCount;
	}

	public void setViewsCount(long viewsCount) {
		this.viewsCount = viewsCount;
	}

	public long getClicksCount() {
		return clicksCount;
	}

	public void setClicksCount(long clicksCount) {
		this.clicksCount = clicksCount;
	}

	public long getSearchesCount() {
		return searchesCount;
	}

	public void setSearchesCount(long searchesCount) {
		this.searchesCount = searchesCount;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}
