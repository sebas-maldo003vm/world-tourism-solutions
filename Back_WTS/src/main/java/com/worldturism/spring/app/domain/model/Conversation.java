package com.worldturism.spring.app.domain.model;

import jakarta.persistence.Access;
import jakarta.persistence.AccessType;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.collection.spi.PersistentCollection;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.dialect.type.PostgreSQLEnumJdbcType;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "conversations")
@Access(AccessType.FIELD)
public class Conversation {

	public static final String BOT_SUBJECT = "Asistente Virtual";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant lastMessageAt;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "conversation_type", nullable = false, columnDefinition = "conversation_type_enum")
	private ConversationType conversationType = ConversationType.CLIENT_TO_PROVIDER;

	/**
	 * Estado del ticket. {@code null} en chats comerciales.
	 * PostgreSQL exige el enum nativo; sin el cast el INSERT llega como {@code varchar}.
	 */
	@Enumerated(EnumType.STRING)
	@Column(name = "support_status", columnDefinition = "support_status_enum")
	@JdbcType(PostgreSQLEnumJdbcType.class)
	@ColumnTransformer(write = "?::support_status_enum")
	private SupportStatus supportStatus;

	/** Urgencia asignada por mesa de ayuda. {@code null} en chats comerciales. */
	@Enumerated(EnumType.STRING)
	@Column(name = "urgency", columnDefinition = "support_urgency_enum")
	@JdbcType(PostgreSQLEnumJdbcType.class)
	@ColumnTransformer(write = "?::support_urgency_enum")
	private SupportUrgency urgency;

	@Column(length = 200)
	private String subject;

	/**
	 * Asesor de soporte asignado ({@link Role#SUPPORT} o {@link Role#ADMIN}).
	 * Null mientras el ticket permanece en cola ({@link SupportStatus#UNASSIGNED}).
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_advisor_id", nullable = true)
	private AppUser assignedAdvisor;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private AppUser user;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "provider_profile_id", nullable = true)
	private ProviderProfile provider;

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

	/**
	 * Sesión del asistente virtual: sin columna dedicada en el esquema actual.
	 * Se identifica por {@link ConversationType#CATALOG_INQUIRY} o por subject.
	 */
	public boolean isBotSession() {
		if (conversationType == ConversationType.CATALOG_INQUIRY) {
			return true;
		}
		return subject != null
				&& (BOT_SUBJECT.equalsIgnoreCase(subject.trim())
						|| subject.contains(BOT_SUBJECT));
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

	public AppUser getAssignedAdvisor() {
		return assignedAdvisor;
	}

	public void setAssignedAdvisor(AppUser assignedAdvisor) {
		this.assignedAdvisor = assignedAdvisor;
	}

	public AppUser getUser() {
		return user;
	}

	public void setUser(AppUser user) {
		this.user = user;
	}

	public ProviderProfile getProvider() {
		return provider;
	}

	public void setProvider(ProviderProfile provider) {
		this.provider = provider;
	}

	public List<Message> getMessages() {
		return messages;
	}

	/**
	 * No sustituye la colección que Hibernate ya administra ({@code orphanRemoval}).
	 * Reasignar la lista provoca
	 * {@code HibernateException: A collection with orphan deletion was no longer referenced}.
	 */
	public void setMessages(List<Message> messages) {
		// Hibernate instala su wrapper por este setter si el acceso es por propiedad.
		if (messages instanceof PersistentCollection) {
			this.messages = messages;
			return;
		}
		// Colección ya persistente: no reemplazar el wrapper ni hacer clear()
		// (clear() programaría el DELETE de los hijos por orphanRemoval).
		if (this.messages instanceof PersistentCollection) {
			syncMessages(messages);
			return;
		}
		if (this.messages == null) {
			this.messages = new ArrayList<>();
		} else {
			this.messages.clear();
		}
		if (messages != null) {
			messages.forEach(this::addMessage);
		}
	}

	/**
	 * Enlaza el mensaje sin sustituir la instancia de la colección.
	 */
	public void addMessage(Message message) {
		if (message == null) {
			return;
		}
		if (this.messages == null) {
			this.messages = new ArrayList<>();
		}
		if (!this.messages.contains(message)) {
			this.messages.add(message);
		}
		message.setConversation(this);
	}

	/**
	 * Incorpora mensajes ya persistidos sin sustituir ni vaciar la colección.
	 * Vaciar una lista con {@code orphanRemoval} programaría el DELETE de esos hijos.
	 */
	public void syncMessages(List<Message> loaded) {
		if (loaded == null || loaded.isEmpty()) {
			return;
		}
		if (this.messages == null) {
			this.messages = new ArrayList<>();
		}
		Set<Long> presentIds = new HashSet<>();
		for (Message existing : this.messages) {
			if (existing.getId() != null) {
				presentIds.add(existing.getId());
			}
		}
		for (Message message : loaded) {
			if (message == null) {
				continue;
			}
			if (message.getId() != null && !presentIds.add(message.getId())) {
				message.setConversation(this);
				continue;
			}
			addMessage(message);
		}
	}
}
