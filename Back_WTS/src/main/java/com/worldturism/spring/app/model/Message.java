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
import java.time.Instant;

@Entity
@Table(name = "messages")
public class Message {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 2000)
	private String content;

	@Column(length = 300)
	private String imageUrl;

	@Column(nullable = false, columnDefinition = "boolean default false")
	private Boolean isRead = false;

	@Column(nullable = false, updatable = false)
	private Instant sentAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "conversation_id", nullable = false)
	private Conversation conversation;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sender_id", nullable = false)
	private AppUser sender;

	@PrePersist
	void prePersist() {
		if (sentAt == null) {
			sentAt = Instant.now();
		}
		if (isRead == null) {
			isRead = false;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	public Boolean getIsRead() {
		return isRead;
	}

	public void setIsRead(Boolean isRead) {
		this.isRead = isRead;
	}

	public Instant getSentAt() {
		return sentAt;
	}

	public void setSentAt(Instant sentAt) {
		this.sentAt = sentAt;
	}

	public Conversation getConversation() {
		return conversation;
	}

	public void setConversation(Conversation conversation) {
		this.conversation = conversation;
	}

	public AppUser getSender() {
		return sender;
	}

	public void setSender(AppUser sender) {
		this.sender = sender;
	}
}
