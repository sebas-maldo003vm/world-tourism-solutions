package com.worldturism.spring.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "provider_profiles")
public class ProviderProfile {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 150)
	private String businessName;

	@Column(length = 60)
	private String taxId;

	@Column(length = 1000)
	private String description;

	@Column(length = 200)
	private String address;

	@Column(length = 100)
	private String city;

	@Column(length = 80)
	private String category;

	@Column(length = 30)
	private String price;

	private Float avgRating = 0.0f;

	private Integer totalReviews = 0;

	@Column(length = 200)
	private String website;

	@Column(length = 300)
	private String logoUrl;

	@ElementCollection
	@CollectionTable(name = "provider_profile_images", joinColumns = @JoinColumn(name = "provider_profile_id"))
	@OrderColumn(name = "image_order")
	@Column(name = "image_url", length = 300, nullable = false)
	private List<String> imageUrls = new ArrayList<>();

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@OneToMany(mappedBy = "provider", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
	private List<TourService> services = new ArrayList<>();

	@OneToMany(mappedBy = "providerBusiness", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
	private List<Booking> bookings = new ArrayList<>();

	@OneToMany(mappedBy = "providerBusiness", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
	private List<Review> reviews = new ArrayList<>();

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getBusinessName() {
		return businessName;
	}

	public void setBusinessName(String businessName) {
		this.businessName = businessName;
	}

	public String getTaxId() {
		return taxId;
	}

	public void setTaxId(String taxId) {
		this.taxId = taxId;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getCity() {
		return city;
	}

	public void setCity(String city) {
		this.city = city;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getPrice() {
		return price;
	}

	public void setPrice(String price) {
		this.price = price;
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

	public String getWebsite() {
		return website;
	}

	public void setWebsite(String website) {
		this.website = website;
	}

	public String getLogoUrl() {
		return logoUrl;
	}

	public void setLogoUrl(String logoUrl) {
		this.logoUrl = logoUrl;
	}

	public List<String> getImageUrls() {
		return imageUrls;
	}

	public void setImageUrls(List<String> imageUrls) {
		this.imageUrls = imageUrls;
	}

	public AppUser getUser() {
		return user;
	}

	public void setUser(AppUser user) {
		this.user = user;
	}

	public List<TourService> getServices() {
		return services;
	}

	public void setServices(List<TourService> services) {
		this.services = services;
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
}
