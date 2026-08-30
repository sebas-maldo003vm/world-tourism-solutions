package com.worldturism.spring.app.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Entity
@Table(name = "users")
public class AppUser implements UserDetails {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, unique = true, length = 160)
	private String email;

	@Column(nullable = false)
	private String password;

	@Column(nullable = false, length = 30)
	private String phoneNumber;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Role role;

	@Column(nullable = false, columnDefinition = "boolean default true")
	private Boolean isActive = true;

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Itinerary> itineraries = new ArrayList<>();

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Booking> bookings = new ArrayList<>();

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Review> reviews = new ArrayList<>();

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<SavedService> savedServices = new ArrayList<>();

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ProviderProfile> providerProfiles = new ArrayList<>();

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Conversation> conversationsAsUser = new ArrayList<>();

	@OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Conversation> conversationsAsProvider = new ArrayList<>();

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant updatedAt;

	@PrePersist
	void prePersist() {
		Instant now = Instant.now();
		if (createdAt == null) {
			createdAt = now;
		}
		if (updatedAt == null) {
			updatedAt = now;
		}
		if (isActive == null) {
			isActive = true;
		}
	}

	@PreUpdate
	void preUpdate() {
		updatedAt = Instant.now();
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return Boolean.TRUE.equals(isActive);
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	@Override
	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}

	public Boolean getIsActive() {
		return isActive;
	}

	public void setIsActive(Boolean isActive) {
		this.isActive = isActive;
	}

	public List<Itinerary> getItineraries() {
		return itineraries;
	}

	public void setItineraries(List<Itinerary> itineraries) {
		this.itineraries = itineraries;
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

	public List<SavedService> getSavedServices() {
		return savedServices;
	}

	public void setSavedServices(List<SavedService> savedServices) {
		this.savedServices = savedServices;
	}

	public List<ProviderProfile> getProviderProfiles() {
		return providerProfiles;
	}

	public void setProviderProfiles(List<ProviderProfile> providerProfiles) {
		this.providerProfiles = providerProfiles;
	}

	public List<Conversation> getConversationsAsUser() {
		return conversationsAsUser;
	}

	public void setConversationsAsUser(List<Conversation> conversationsAsUser) {
		this.conversationsAsUser = conversationsAsUser;
	}

	public List<Conversation> getConversationsAsProvider() {
		return conversationsAsProvider;
	}

	public void setConversationsAsProvider(List<Conversation> conversationsAsProvider) {
		this.conversationsAsProvider = conversationsAsProvider;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}
