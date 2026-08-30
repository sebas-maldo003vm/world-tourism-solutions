package com.worldturism.spring.app.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "services")
public class TourService {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 150)
	private String title;

	@Column(nullable = false, length = 2000)
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private ServiceCategory category;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal price;

	@Column(length = 200)
	private String location;

	@Column(length = 20)
	private String latitude;

	@Column(length = 20)
	private String longitude;

	@Column(length = 300)
	private String imageUrl;

	@Column(nullable = false)
	private Float avgRating = 0.0f;

	@Column(nullable = false)
	private Integer totalReviews = 0;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ServiceStatus status = ServiceStatus.PENDING;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "provider_id", nullable = false)
	private ProviderProfile provider;

	@OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Booking> bookings = new ArrayList<>();

	@OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Review> reviews = new ArrayList<>();

	@OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<SavedService> savedBy = new ArrayList<>();

	@OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ItineraryItem> itineraryItems = new ArrayList<>();

	@OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Conversation> conversations = new ArrayList<>();

	@PrePersist
	void prePersist() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (avgRating == null) {
			avgRating = 0.0f;
		}
		if (totalReviews == null) {
			totalReviews = 0;
		}
		if (status == null) {
			status = ServiceStatus.PENDING;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public ServiceCategory getCategory() {
		return category;
	}

	public void setCategory(ServiceCategory category) {
		this.category = category;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public void setPrice(BigDecimal price) {
		this.price = price;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public String getLatitude() {
		return latitude;
	}

	public void setLatitude(String latitude) {
		this.latitude = latitude;
	}

	public String getLongitude() {
		return longitude;
	}

	public void setLongitude(String longitude) {
		this.longitude = longitude;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	public Float getAvgRating() {
		return avgRating;
	}

	public void setAvgRating(Float avgRating) {
		this.avgRating = avgRating;
	}

	public Integer getTotalReviews() {
		return totalReviews;
	}

	public void setTotalReviews(Integer totalReviews) {
		this.totalReviews = totalReviews;
	}

	public ServiceStatus getStatus() {
		return status;
	}

	public void setStatus(ServiceStatus status) {
		this.status = status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public ProviderProfile getProvider() {
		return provider;
	}

	public void setProvider(ProviderProfile provider) {
		this.provider = provider;
	}

	public List<Booking> getBookings() {
		return bookings;
	}

	public void setBookings(List<Booking> bookings) {
		this.bookings = bookings;
	}

	public List<Review> getReviews() {
		return reviews;
	}

	public void setReviews(List<Review> reviews) {
		this.reviews = reviews;
	}

	public List<SavedService> getSavedBy() {
		return savedBy;
	}

	public void setSavedBy(List<SavedService> savedBy) {
		this.savedBy = savedBy;
	}

	public List<ItineraryItem> getItineraryItems() {
		return itineraryItems;
	}

	public void setItineraryItems(List<ItineraryItem> itineraryItems) {
		this.itineraryItems = itineraryItems;
	}

	public List<Conversation> getConversations() {
		return conversations;
	}

	public void setConversations(List<Conversation> conversations) {
		this.conversations = conversations;
	}
}
