package com.worldturism.spring.app.domain.model;

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
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversations")
public class Conversation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant lastMessageAt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private ConversationType conversationType = ConversationType.CLIENT_TO_PROVIDER;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private SupportStatus supportStatus;

	@Enumerated(EnumType.STRING)
	@Column(length = 10)
	private SupportUrgency urgency;

	@Column(length = 200)
	private String subject;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "provider_id")
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

	public ConversationType getConversationType() {
		return conversationType;
	}

	public void setConversationType(ConversationType conversationType) {
		this.conversationType = conversationType;
	}

	public SupportStatus getSupportStatus() {
		return supportStatus;
	}

	public void setSupportStatus(SupportStatus supportStatus) {
		this.supportStatus = supportStatus;
	}

	public SupportUrgency getUrgency() {
		return urgency;
	}

	public void setUrgency(SupportUrgency urgency) {
		this.urgency = urgency;
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
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
