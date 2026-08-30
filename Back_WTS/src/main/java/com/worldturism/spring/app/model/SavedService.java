package com.worldturism.spring.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(
		name = "saved_services",
		uniqueConstraints = @UniqueConstraint(name = "uq_saved_service", columnNames = {"user_id", "service_id"}))
public class SavedService {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, updatable = false)
	private Instant savedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "service_id", nullable = false)
	private TourService service;

	@PrePersist
	void prePersist() {
		if (savedAt == null) {
			savedAt = Instant.now();
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Instant getSavedAt() {
		return savedAt;
	}

	public void setSavedAt(Instant savedAt) {
		this.savedAt = savedAt;
	}

	public AppUser getUser() {
		return user;
	}

	public void setUser(AppUser user) {
		this.user = user;
	}

	public TourService getService() {
		return service;
	}

	public void setService(TourService service) {
		this.service = service;
	}
}
