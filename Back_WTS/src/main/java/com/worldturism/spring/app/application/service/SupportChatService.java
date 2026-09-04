package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.Message;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.domain.model.SupportStatus;
import com.worldturism.spring.app.domain.model.SupportUrgency;
import com.worldturism.spring.app.infrastructure.persistence.repository.ConversationRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.MessageRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.UserRepository;
import com.worldturism.spring.app.presentation.dto.ConversationResponse;
import com.worldturism.spring.app.presentation.dto.CreateSupportTicketRequest;
import com.worldturism.spring.app.presentation.dto.MessageResponse;
import com.worldturism.spring.app.presentation.dto.SendMessageRequest;
import com.worldturism.spring.app.presentation.dto.StartClientConversationRequest;
import com.worldturism.spring.app.presentation.dto.StartConversationRequest;
import com.worldturism.spring.app.presentation.dto.SupportTicketResponse;
import com.worldturism.spring.app.presentation.dto.UpdateSupportStatusRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportChatService {

	private final ConversationRepository conversationRepository;
	private final MessageRepository messageRepository;
	private final ProviderProfileRepository providerProfileRepository;
	private final UserRepository userRepository;

	public SupportChatService(
			ConversationRepository conversationRepository,
			MessageRepository messageRepository,
			ProviderProfileRepository providerProfileRepository,
			UserRepository userRepository) {
		this.conversationRepository = conversationRepository;
		this.messageRepository = messageRepository;
		this.providerProfileRepository = providerProfileRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<ConversationResponse> listarConversaciones(AppUser user) {
		validateAuthenticated(user);
		List<Conversation> conversations = findConversationsForUser(user);
		return conversations.stream()
				.map(conversation -> toConversationResponse(conversation, user))
				.toList();
	}

	@Transactional
	public ConversationResponse iniciarConversacionConProveedor(AppUser user, StartConversationRequest request) {
		validateAuthenticated(user);
		if (user.getRole() != Role.USER) {
			throw new IllegalArgumentException("Solo los turistas pueden iniciar conversaciones con proveedores.");
		}

		ProviderProfile providerProfile = providerProfileRepository.findById(request.providerProfileId())
				.orElseThrow(() -> new IllegalArgumentException("El negocio del proveedor no existe."));
		if (providerProfile.getUser() == null || providerProfile.getUser().getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException("El negocio indicado no pertenece a un proveedor.");
		}

		Conversation conversation = conversationRepository
				.findByUserIdAndProviderIdAndConversationType(
						user.getId(), providerProfile.getId(), ConversationType.CLIENT_TO_PROVIDER)
				.orElseGet(() -> createProviderConversation(user, providerProfile));

		if (request.initialMessage() != null && !request.initialMessage().isBlank()) {
			appendMessage(conversation, user, request.initialMessage().trim());
		}

		return toConversationResponse(conversation, user);
	}

	/**
	 * El proveedor inicia o recupera el chat {@code CLIENT_TO_PROVIDER} con un turista
	 * (p. ej. desde el panel de reservas).
	 */
	@Transactional
	public ConversationResponse iniciarConversacionConCliente(
			AppUser providerUser,
			StartClientConversationRequest request) {
		validateAuthenticated(providerUser);
		if (providerUser.getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException("Solo los proveedores pueden iniciar conversaciones con clientes.");
		}

		AppUser client = userRepository.findById(request.clientUserId())
				.orElseThrow(() -> new IllegalArgumentException("El cliente no existe."));
		if (client.getRole() != Role.USER) {
			throw new IllegalArgumentException("El usuario indicado no es un turista.");
		}

		ProviderProfile providerProfile;
		if (request.providerProfileId() != null) {
			providerProfile = providerProfileRepository
					.findByIdAndUserId(request.providerProfileId(), providerUser.getId())
					.orElseThrow(() -> new IllegalArgumentException(
							"El negocio no existe o no pertenece al proveedor autenticado."));
		} else {
			providerProfile = providerProfileRepository
					.findFirstByUserIdOrderByIdAsc(providerUser.getId())
					.orElseThrow(() -> new IllegalArgumentException(
							"El proveedor no tiene un perfil de negocio registrado."));
		}

		Conversation conversation = conversationRepository
				.findByUserIdAndProviderIdAndConversationType(
						client.getId(), providerProfile.getId(), ConversationType.CLIENT_TO_PROVIDER)
				.orElseGet(() -> createProviderConversation(client, providerProfile));

		if (request.initialMessage() != null && !request.initialMessage().isBlank()) {
			appendMessage(conversation, providerUser, request.initialMessage().trim());
		}

		return toConversationResponse(conversation, providerUser);
	}

	@Transactional(readOnly = true)
	public List<MessageResponse> obtenerMensajes(AppUser user, Long conversationId) {
		validateAuthenticated(user);
		Conversation conversation = getConversationForUser(user, conversationId);
		return messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId())
				.stream()
				.map(message -> MessageResponse.from(message, user.getId()))
				.toList();
	}

	@Transactional
	public MessageResponse enviarMensaje(AppUser user, Long conversationId, SendMessageRequest request) {
		validateAuthenticated(user);
		Conversation conversation = getConversationForUser(user, conversationId);
		Message message = appendMessage(conversation, user, request.content().trim());
		return MessageResponse.from(message, user.getId());
	}

	@Transactional
	public void marcarComoLeido(AppUser user, Long conversationId) {
		validateAuthenticated(user);
		Conversation conversation = getConversationForUser(user, conversationId);
		messageRepository.markAsReadForConversation(conversation.getId(), user.getId());
	}

	@Transactional
	public SupportTicketResponse crearTicketSoporte(AppUser user, CreateSupportTicketRequest request) {
		validateAuthenticated(user);
		if (user.getRole() != Role.USER && user.getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException("Solo turistas y proveedores pueden crear tickets de soporte.");
		}

		ConversationType type = user.getRole() == Role.PROVIDER
				? ConversationType.PROVIDER_TO_SUPPORT
				: ConversationType.CLIENT_TO_SUPPORT;

		Conversation conversation = new Conversation();
		conversation.setUser(user);
		conversation.setProvider(null);
		conversation.setConversationType(type);
		conversation.setSupportStatus(SupportStatus.UNASSIGNED);
		conversation.setAssignedAdvisor(null);
		conversation.setUrgency(request.urgency() != null ? request.urgency() : SupportUrgency.MEDIUM);
		conversation.setSubject(request.serviceName() != null && !request.serviceName().isBlank()
				? request.serviceName().trim()
				: "Soporte general");
		conversation = conversationRepository.save(conversation);

		appendMessage(conversation, user, request.message().trim());
		loadMessagesForTicket(conversation);
		return SupportTicketResponse.from(conversation);
	}

	/**
	 * Abre una conversación de soporte humano persistente en cola ({@link SupportStatus#UNASSIGNED}).
	 */
	@Transactional
	public SupportTicketResponse abrirConversacionSoporte(AppUser user) {
		validateAuthenticated(user);
		if (user.getRole() != Role.USER && user.getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException(
					"Solo turistas y proveedores pueden abrir conversaciones de soporte.");
		}

		Conversation conversation = new Conversation();
		conversation.setUser(user);
		conversation.setProvider(null);
		conversation.setConversationType(ConversationType.HUMAN_SUPPORT);
		conversation.setSupportStatus(SupportStatus.UNASSIGNED);
		conversation.setAssignedAdvisor(null);
		conversation.setUrgency(SupportUrgency.MEDIUM);
		conversation.setSubject("Soporte humano");
		conversation = conversationRepository.save(conversation);

		loadMessagesForTicket(conversation);
		return SupportTicketResponse.from(conversation);
	}

	/**
	 * Asigna (reclama) un ticket de soporte al asesor autenticado ({@link Role#SUPPORT}/{@link Role#ADMIN}).
	 */
	@Transactional
	public SupportTicketResponse asignarConversacionSoporte(AppUser advisor, Long conversationId) {
		validateAdmin(advisor);
		Conversation conversation = conversationRepository.findById(conversationId)
				.orElseThrow(() -> new IllegalArgumentException("La conversación de soporte no existe."));
		if (!conversation.getConversationType().isHumanSupport()) {
			throw new IllegalArgumentException("La conversación indicada no es de soporte humano.");
		}
		if (conversation.isBotSession()) {
			throw new IllegalArgumentException("No se puede asignar una sesión del asistente virtual.");
		}
		if (conversation.getSupportStatus() == SupportStatus.RESOLVED
				|| conversation.getSupportStatus() == SupportStatus.CLOSED) {
			throw new IllegalArgumentException("No se puede asignar un ticket resuelto o cerrado.");
		}
		if (conversation.getAssignedAdvisor() != null
				&& !conversation.getAssignedAdvisor().getId().equals(advisor.getId())) {
			throw new IllegalArgumentException(
					"La conversación ya está asignada a otro asesor.");
		}

		conversation.setAssignedAdvisor(advisor);
		conversation.setSupportStatus(SupportStatus.IN_PROGRESS);
		conversation = conversationRepository.save(conversation);
		loadMessagesForTicket(conversation);
		return SupportTicketResponse.from(conversation);
	}

	/**
	 * Inbox de staff: tickets sin asignar o asignados al asesor autenticado.
	 */
	@Transactional(readOnly = true)
	public List<SupportTicketResponse> listarInboxSoporte(AppUser advisor) {
		validateAdmin(advisor);
		List<ConversationType> supportTypes = List.of(
				ConversationType.HUMAN_SUPPORT,
				ConversationType.CLIENT_TO_SUPPORT,
				ConversationType.PROVIDER_TO_SUPPORT);
		List<SupportStatus> excluded = List.of(SupportStatus.RESOLVED, SupportStatus.CLOSED);
		return conversationRepository
				.findSupportInboxForAdvisor(supportTypes, advisor.getId(), excluded)
				.stream()
				.map(conversation -> {
					loadMessagesForTicket(conversation);
					return SupportTicketResponse.from(conversation);
				})
				.toList();
	}

	@Transactional(readOnly = true)
	public List<SupportTicketResponse> listarTicketsSoporte(AppUser admin) {
		validateAdmin(admin);
		List<ConversationType> supportTypes = List.of(
				ConversationType.HUMAN_SUPPORT,
				ConversationType.CLIENT_TO_SUPPORT,
				ConversationType.PROVIDER_TO_SUPPORT);
		return conversationRepository.findByConversationTypeInOrderByLastMessageAtDesc(supportTypes)
				.stream()
				.filter(conversation -> !conversation.isBotSession())
				.map(conversation -> {
					loadMessagesForTicket(conversation);
					return SupportTicketResponse.from(conversation);
				})
				.toList();
	}

	@Transactional
	public SupportTicketResponse actualizarEstadoTicket(
			AppUser admin,
			Long conversationId,
			UpdateSupportStatusRequest request) {
		validateAdmin(admin);
		Conversation conversation = conversationRepository.findById(conversationId)
				.orElseThrow(() -> new IllegalArgumentException("El ticket de soporte no existe."));
		if (!conversation.getConversationType().isHumanSupport()) {
			throw new IllegalArgumentException("La conversación indicada no es un ticket de soporte.");
		}
		conversation.setSupportStatus(request.status());
		if (request.status() == SupportStatus.UNASSIGNED) {
			conversation.setAssignedAdvisor(null);
		}
		conversation = conversationRepository.save(conversation);
		loadMessagesForTicket(conversation);
		return SupportTicketResponse.from(conversation);
	}

	@Transactional
	public MessageResponse responderTicketSoporte(AppUser admin, Long conversationId, SendMessageRequest request) {
		validateAdmin(admin);
		Conversation conversation = conversationRepository.findById(conversationId)
				.orElseThrow(() -> new IllegalArgumentException("El ticket de soporte no existe."));
		if (!conversation.getConversationType().isHumanSupport()) {
			throw new IllegalArgumentException("La conversación indicada no es un ticket de soporte.");
		}
		if (conversation.getSupportStatus() == SupportStatus.CLOSED) {
			throw new IllegalArgumentException("El ticket de soporte está cerrado.");
		}
		if (conversation.getAssignedAdvisor() == null) {
			conversation.setAssignedAdvisor(admin);
		}
		if (conversation.getSupportStatus() == SupportStatus.OPEN
				|| conversation.getSupportStatus() == SupportStatus.UNASSIGNED
				|| conversation.getSupportStatus() == SupportStatus.NEEDS_HUMAN_SUPPORT) {
			conversation.setSupportStatus(SupportStatus.IN_PROGRESS);
		}
		Message message = appendMessage(conversation, admin, request.content().trim());
		return MessageResponse.from(message, admin.getId());
	}

	private List<Conversation> findConversationsForUser(AppUser user) {
		Map<Long, Conversation> unique = new LinkedHashMap<>();
		if (isAdminOrSupport(user)) {
			// Tickets de soporte humanos (nunca chats del bot automatizado).
			conversationRepository.findByConversationTypeInOrderByLastMessageAtDesc(
					List.of(
							ConversationType.HUMAN_SUPPORT,
							ConversationType.CLIENT_TO_SUPPORT,
							ConversationType.PROVIDER_TO_SUPPORT))
					.forEach(conversation -> unique.put(conversation.getId(), conversation));
			// Chats cliente↔negocio para supervisión (ambos participantes visibles en DTO).
			conversationRepository.findHumanByConversationTypeOrderByLastMessageAtDesc(
					ConversationType.CLIENT_TO_PROVIDER)
					.forEach(conversation -> unique.put(conversation.getId(), conversation));
		}
		if (user.getRole() == Role.USER) {
			conversationRepository.findByUserIdOrderByLastMessageAtDesc(user.getId())
					.forEach(conversation -> unique.put(conversation.getId(), conversation));
		}
		if (user.getRole() == Role.PROVIDER) {
			// Inbox del proveedor: conversaciones de sus ProviderProfile → muestra al cliente.
			conversationRepository.findByProvider_User_IdOrderByLastMessageAtDesc(user.getId())
					.forEach(conversation -> unique.put(conversation.getId(), conversation));
			// Tickets de soporte abiertos por el propio proveedor.
			conversationRepository.findByUserIdOrderByLastMessageAtDesc(user.getId())
					.forEach(conversation -> unique.put(conversation.getId(), conversation));
		}
		return unique.values().stream()
				.filter(c -> !c.isBotSession())
				.sorted(Comparator.comparing(Conversation::getLastMessageAt).reversed())
				.toList();
	}

	private Conversation createProviderConversation(AppUser user, ProviderProfile providerProfile) {
		Conversation conversation = new Conversation();
		conversation.setUser(user);
		conversation.setProvider(providerProfile);
		conversation.setConversationType(ConversationType.CLIENT_TO_PROVIDER);
		return conversationRepository.save(conversation);
	}

	private Message appendMessage(Conversation conversation, AppUser sender, String content) {
		Message message = new Message();
		message.setConversation(conversation);
		message.setSender(sender);
		message.setContent(content);
		message.setSentAt(Instant.now());
		message = messageRepository.save(message);
		conversation.setLastMessageAt(message.getSentAt());
		conversationRepository.save(conversation);
		return message;
	}

	private Conversation getConversationForUser(AppUser user, Long conversationId) {
		Conversation conversation = conversationRepository.findById(conversationId)
				.orElseThrow(() -> new IllegalArgumentException("La conversación no existe."));
		if (!isParticipant(user, conversation)) {
			throw new IllegalArgumentException("No tienes acceso a esta conversación.");
		}
		return conversation;
	}

	private boolean isParticipant(AppUser user, Conversation conversation) {
		if (isAdminOrSupport(user)) {
			return true;
		}
		if (conversation.getUser().getId().equals(user.getId())) {
			return true;
		}
		return conversation.getProvider() != null
				&& conversation.getProvider().getUser() != null
				&& conversation.getProvider().getUser().getId().equals(user.getId());
	}

	private ConversationResponse toConversationResponse(Conversation conversation, Long currentUserId) {
		return toConversationResponse(conversation, currentUserId, null);
	}

	private ConversationResponse toConversationResponse(
			Conversation conversation, AppUser viewer) {
		return toConversationResponse(conversation, viewer.getId(), viewer.getRole());
	}

	private ConversationResponse toConversationResponse(
			Conversation conversation, Long currentUserId, Role viewerRole) {
		String lastMessage = messageRepository.findTopByConversationIdOrderBySentAtDesc(conversation.getId())
				.map(Message::getContent)
				.orElse("");
		long unread = messageRepository.countByConversationIdAndIsReadFalseAndSenderIdNot(
				conversation.getId(), currentUserId);
		return ConversationResponse.from(conversation, lastMessage, unread, currentUserId, viewerRole);
	}

	private void loadMessagesForTicket(Conversation conversation) {
		List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId());
		conversation.setMessages(new ArrayList<>(messages));
	}

	private void validateAuthenticated(AppUser user) {
		if (user == null) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
	}

	private boolean isAdminOrSupport(AppUser user) {
		return user.getRole() == Role.ADMIN || user.getRole() == Role.SUPPORT;
	}

	private void validateAdmin(AppUser user) {
		validateAuthenticated(user);
		if (!isAdminOrSupport(user)) {
			throw new IllegalArgumentException(
					"Solo administradores o soporte pueden realizar esta acción.");
		}
	}
}
