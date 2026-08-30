package com.worldturism.spring.app.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
		name = "conversations",
		uniqueConstraints = @UniqueConstraint(
				name = "uq_conversation",
				columnNames = {"user_id", "provider_id", "service_id"}))
public class Conversation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant lastMessageAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "provider_id", nullable = false)
	private AppUser provider;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "service_id")
	private TourService service;

	@OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("sentAt ASC")
	private List<Message> messages = new ArrayList<>();

	@PrePersist
	void prePersist() {
		Instant now = Instant.now();
		if (createdAt == null) {
			createdAt = now;
		}
		if (lastMessageAt == null) {
			lastMessageAt = now;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getLastMessageAt() {
		return lastMessageAt;
	}

	public void setLastMessageAt(Instant lastMessageAt) {
		this.lastMessageAt = lastMessageAt;
	}

	public AppUser getUser() {
		return user;
	}

	public void setUser(AppUser user) {
		this.user = user;
	}

	public AppUser getProvider() {
		return provider;
	}

	public void setProvider(AppUser provider) {
		this.provider = provider;
	}

	public TourService getService() {
		return service;
	}

	public void setService(TourService service) {
		this.service = service;
	}

	public List<Message> getMessages() {
		return messages;
	}

	public void setMessages(List<Message> messages) {
		this.messages = messages;
	}
}
