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
import java.time.LocalDate;

@Entity
@Table(name = "itinerary_items")
public class ItineraryItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private LocalDate scheduledDate;

	@Column(length = 500)
	private String notes;

	@Column(nullable = false)
	private Integer sortOrder = 0;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "itinerary_id", nullable = false)
	private Itinerary itinerary;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "service_id", nullable = false)
	private TourService service;

	@PrePersist
	void prePersist() {
		if (sortOrder == null) {
			sortOrder = 0;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public LocalDate getScheduledDate() {
		return scheduledDate;
	}

	public void setScheduledDate(LocalDate scheduledDate) {
		this.scheduledDate = scheduledDate;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Integer getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(Integer sortOrder) {
		this.sortOrder = sortOrder;
	}

	public Itinerary getItinerary() {
		return itinerary;
	}

	public void setItinerary(Itinerary itinerary) {
		this.itinerary = itinerary;
	}

	public TourService getService() {
		return service;
	}

	public void setService(TourService service) {
		this.service = service;
	}
}
