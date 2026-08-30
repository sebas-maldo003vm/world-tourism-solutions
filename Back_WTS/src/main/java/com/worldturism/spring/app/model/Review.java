package com.worldturism.spring.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(
		name = "reviews",
		uniqueConstraints = {
				@UniqueConstraint(name = "uq_review_booking", columnNames = "booking_id"),
				@UniqueConstraint(name = "uq_review_user_business", columnNames = {"user_id", "provider_profile_id"})
		})
public class Review {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Integer rating;

	@Column(length = 1000)
	private String comment;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "service_id")
	private TourService service;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "provider_profile_id")
	private ProviderProfile providerBusiness;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "booking_id", unique = true)
	private Booking booking;

	@PrePersist
	void prePersist() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Integer getRating() {
		return rating;
	}

	public void setRating(Integer rating) {
		this.rating = rating;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
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

	public ProviderProfile getProviderBusiness() {
		return providerBusiness;
	}

	public void setProviderBusiness(ProviderProfile providerBusiness) {
		this.providerBusiness = providerBusiness;
	}

	public Booking getBooking() {
		return booking;
	}

	public void setBooking(Booking booking) {
		this.booking = booking;
	}
}
