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
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportChatService {

	private final ConversationRepository conversationRepository;
	private final MessageRepository messageRepository;
	private final ProviderProfileRepository providerProfileRepository;
	private final UserRepository userRepository;
	private final ConversationService conversationService;

	public SupportChatService(
			ConversationRepository conversationRepository,
			MessageRepository messageRepository,
			ProviderProfileRepository providerProfileRepository,
			UserRepository userRepository,
			ConversationService conversationService) {
		this.conversationRepository = conversationRepository;
		this.messageRepository = messageRepository;
		this.providerProfileRepository = providerProfileRepository;
		this.userRepository = userRepository;
		this.conversationService = conversationService;
	}

	@Transactional(readOnly = true)
	public List<ConversationResponse> listarConversaciones(AppUser user) {
		AppUser current = conversationService.requireAuthenticatedUser(user);
		return conversationService.listHumanInbox(current).stream()
				.map(conversation -> toConversationResponse(conversation, current))
				.toList();
	}

	@Transactional
	public ConversationResponse iniciarConversacionConProveedor(AppUser user, StartConversationRequest request) {
		AppUser current = conversationService.requireAuthenticatedUser(user);
		if (current.getRole() != Role.USER) {
			throw new IllegalArgumentException("Solo los turistas pueden iniciar conversaciones con proveedores.");
		}

		ProviderProfile providerProfile = providerProfileRepository.findById(request.providerProfileId())
				.orElseThrow(() -> new IllegalArgumentException("El negocio del proveedor no existe."));
		if (providerProfile.getUser() == null || providerProfile.getUser().getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException("El negocio indicado no pertenece a un proveedor.");
		}

		String inquiry = normalizeInquiry(request.serviceName());
		Conversation conversation = conversationRepository
				.findByUserIdAndProviderIdAndConversationType(
						current.getId(), providerProfile.getId(), ConversationType.CLIENT_TO_PROVIDER)
				.orElseGet(() -> createProviderConversation(current, providerProfile, inquiry));

		if (inquiry != null && (conversation.getSubject() == null || conversation.getSubject().isBlank())) {
			conversation.setSubject(inquiry);
			conversation = conversationRepository.save(conversation);
		}

		if (request.initialMessage() != null && !request.initialMessage().isBlank()) {
			appendMessage(conversation, current, request.initialMessage().trim());
		}

		return toConversationResponse(conversation, current);
	}

	/**
	 * El proveedor inicia o recupera el chat {@code CLIENT_TO_PROVIDER} con un turista
	 * (p. ej. desde el panel de reservas).
	 */
	@Transactional
	public ConversationResponse iniciarConversacionConCliente(
			AppUser providerUser,
			StartClientConversationRequest request) {
		AppUser current = conversationService.requireAuthenticatedUser(providerUser);
		if (current.getRole() != Role.PROVIDER) {
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
					.findByIdAndUserId(request.providerProfileId(), current.getId())
					.orElseThrow(() -> new IllegalArgumentException(
							"El negocio no existe o no pertenece al proveedor autenticado."));
		} else {
			providerProfile = providerProfileRepository
					.findFirstByUserIdOrderByIdAsc(current.getId())
					.orElseThrow(() -> new IllegalArgumentException(
							"El proveedor no tiene un perfil de negocio registrado."));
		}

		Conversation conversation = conversationRepository
				.findByUserIdAndProviderIdAndConversationType(
						client.getId(), providerProfile.getId(), ConversationType.CLIENT_TO_PROVIDER)
				.orElseGet(() -> createProviderConversation(client, providerProfile, null));

		if (request.initialMessage() != null && !request.initialMessage().isBlank()) {
			appendMessage(conversation, current, request.initialMessage().trim());
		}

		return toConversationResponse(conversation, current);
	}

	@Transactional(readOnly = true)
	public List<MessageResponse> obtenerMensajes(AppUser user, Long conversationId) {
		AppUser current = conversationService.requireAuthenticatedUser(user);
		Conversation conversation = getConversationForUser(current, conversationId);
		return messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId())
				.stream()
				.map(message -> MessageResponse.from(message, current.getId()))
				.toList();
	}

	@Transactional
	public MessageResponse enviarMensaje(AppUser user, Long conversationId, SendMessageRequest request) {
		AppUser current = conversationService.requireAuthenticatedUser(user);
		Conversation conversation = getConversationForUser(current, conversationId);
		Message message = appendMessage(conversation, current, request.content().trim());
		return MessageResponse.from(message, current.getId());
	}

	@Transactional
	public void marcarComoLeido(AppUser user, Long conversationId) {
		AppUser current = conversationService.requireAuthenticatedUser(user);
		Conversation conversation = getConversationForUser(current, conversationId);
		messageRepository.markAsReadForConversation(conversation.getId(), current.getId());
	}

	@Transactional
	public SupportTicketResponse crearTicketSoporte(AppUser user, CreateSupportTicketRequest request) {
		AppUser current = conversationService.requireAuthenticatedUser(user);
		if (current.getRole() != Role.USER && current.getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException("Solo turistas y proveedores pueden crear tickets de soporte.");
		}

		ConversationType type = current.getRole() == Role.PROVIDER
				? ConversationType.PROVIDER_TO_SUPPORT
				: ConversationType.CLIENT_TO_SUPPORT;

		Conversation conversation = new Conversation();
		conversation.setUser(current);
		conversation.setProvider(null);
		conversation.setConversationType(type);
		// El esquema no tiene SUPPORT/PENDING: cola inicial = UNASSIGNED, urgencia por defecto MEDIUM.
		conversation.setSupportStatus(SupportStatus.UNASSIGNED);
		conversation.setAssignedAdvisor(null);
		conversation.setUrgency(SupportUrgency.MEDIUM);
		conversation.setSubject(request.subject().trim());
		// Flush para que Hibernate envuelva messages antes de añadir hijos.
		conversation = conversationRepository.saveAndFlush(conversation);

		Message initialMessage = new Message();
		initialMessage.setSender(current);
		initialMessage.setContent(request.initialMessage().trim());
		initialMessage.setSentAt(Instant.now());
		conversation.addMessage(initialMessage);
		conversation.setLastMessageAt(initialMessage.getSentAt());
		messageRepository.save(initialMessage);

		return SupportTicketResponse.from(conversation);
	}

	/**
	 * Abre una conversación de soporte humano persistente en cola ({@link SupportStatus#UNASSIGNED}).
	 * Acepta asunto y mensaje inicial del turista o proveedor.
	 */
	@Transactional
	public SupportTicketResponse abrirConversacionSoporte(AppUser user, CreateSupportTicketRequest request) {
		AppUser current = conversationService.requireAuthenticatedUser(user);
		if (current.getRole() != Role.USER && current.getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException(
					"Solo turistas y proveedores pueden abrir conversaciones de soporte.");
		}

		ConversationType type = current.getRole() == Role.PROVIDER
				? ConversationType.PROVIDER_TO_SUPPORT
				: ConversationType.CLIENT_TO_SUPPORT;

		Conversation conversation = new Conversation();
		conversation.setUser(current);
		conversation.setProvider(null);
		conversation.setConversationType(type);
		conversation.setSupportStatus(SupportStatus.UNASSIGNED);
		conversation.setAssignedAdvisor(null);
		conversation.setUrgency(SupportUrgency.MEDIUM);
		conversation.setSubject(request.subject().trim());
		conversation = conversationRepository.saveAndFlush(conversation);

		Message initialMessage = new Message();
		initialMessage.setSender(current);
		initialMessage.setContent(request.initialMessage().trim());
		initialMessage.setSentAt(Instant.now());
		conversation.addMessage(initialMessage);
		conversation.setLastMessageAt(initialMessage.getSentAt());
		messageRepository.save(initialMessage);

		loadMessagesForTicket(conversation);
		return SupportTicketResponse.from(conversation);
	}

	/**
	 * Asigna (reclama) un ticket de soporte al asesor autenticado ({@link Role#SUPPORT}/{@link Role#ADMIN}).
	 */
	@Transactional
	public SupportTicketResponse asignarConversacionSoporte(AppUser advisor, Long conversationId) {
		AppUser current = requireStaff(advisor);
		Conversation conversation = conversationService.requireReadable(current, conversationId);
		if (!conversation.getConversationType().isHumanSupport()) {
			throw new IllegalArgumentException("La conversación indicada no es de soporte humano.");
		}
		if (ConversationService.isCatalogInquiry(conversation)) {
			throw new IllegalArgumentException("No se puede asignar una sesión del asistente virtual.");
		}
		if (conversation.getSupportStatus() == SupportStatus.RESOLVED
				|| conversation.getSupportStatus() == SupportStatus.CLOSED) {
			throw new IllegalArgumentException("No se puede asignar un ticket resuelto o cerrado.");
		}
		if (conversation.getAssignedAdvisor() != null
				&& !conversation.getAssignedAdvisor().getId().equals(current.getId())) {
			throw new IllegalArgumentException(
					"La conversación ya está asignada a otro asesor.");
		}

		conversation.setAssignedAdvisor(current);
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
		AppUser current = requireStaff(advisor);
		return conversationService.listStaffSupportTickets(current)
				.stream()
				.map(conversation -> {
					loadMessagesForTicket(conversation);
					return SupportTicketResponse.from(conversation);
				})
				.toList();
	}

	@Transactional(readOnly = true)
	public List<SupportTicketResponse> listarTicketsSoporte(AppUser admin) {
		AppUser current = requireStaff(admin);
		return conversationService.listStaffSupportTickets(current)
				.stream()
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
		AppUser current = requireStaff(admin);
		Conversation conversation = conversationService.requireReadable(current, conversationId);
		if (!conversation.getConversationType().isHumanSupport()) {
			throw new IllegalArgumentException("La conversación indicada no es un ticket de soporte.");
		}
		if (request.status() == null && request.urgency() == null) {
			throw new IllegalArgumentException("Debe indicar el estado o la urgencia a actualizar.");
		}
		if (request.status() != null) {
			conversation.setSupportStatus(request.status());
			if (request.status() == SupportStatus.UNASSIGNED) {
				conversation.setAssignedAdvisor(null);
			} else if (conversation.getAssignedAdvisor() == null) {
				conversation.setAssignedAdvisor(current);
			}
		}
		if (request.urgency() != null) {
			conversation.setUrgency(request.urgency());
		}
		conversation = conversationRepository.save(conversation);
		loadMessagesForTicket(conversation);
		return SupportTicketResponse.from(conversation);
	}

	@Transactional
	public MessageResponse responderTicketSoporte(AppUser admin, Long conversationId, SendMessageRequest request) {
		AppUser current = requireStaff(admin);
		Conversation conversation = conversationService.requireReadable(current, conversationId);
		if (!conversation.getConversationType().isHumanSupport()) {
			throw new IllegalArgumentException("La conversación indicada no es un ticket de soporte.");
		}
		if (conversation.getSupportStatus() == SupportStatus.CLOSED) {
			throw new IllegalArgumentException("El ticket de soporte está cerrado.");
		}
		if (conversation.getAssignedAdvisor() == null) {
			conversation.setAssignedAdvisor(current);
		}
		if (conversation.getSupportStatus() == SupportStatus.OPEN
				|| conversation.getSupportStatus() == SupportStatus.UNASSIGNED
				|| conversation.getSupportStatus() == SupportStatus.NEEDS_HUMAN_SUPPORT) {
			conversation.setSupportStatus(SupportStatus.IN_PROGRESS);
		}
		Message message = appendMessage(conversation, current, request.content().trim());
		return MessageResponse.from(message, current.getId());
	}

	private Conversation createProviderConversation(
			AppUser user, ProviderProfile providerProfile, String inquirySubject) {
		Conversation conversation = new Conversation();
		conversation.setUser(user);
		conversation.setProvider(providerProfile);
		conversation.setConversationType(ConversationType.CLIENT_TO_PROVIDER);
		if (inquirySubject != null && !inquirySubject.isBlank()) {
			conversation.setSubject(inquirySubject.trim());
		}
		return conversationRepository.save(conversation);
	}

	private String normalizeInquiry(String serviceName) {
		if (serviceName == null || serviceName.isBlank()) {
			return null;
		}
		String trimmed = serviceName.trim();
		return trimmed.length() > 200 ? trimmed.substring(0, 200) : trimmed;
	}

	private Message appendMessage(Conversation conversation, AppUser sender, String content) {
		Message message = new Message();
		message.setSender(sender);
		message.setContent(content);
		message.setSentAt(Instant.now());
		if (conversation.getId() == null) {
			conversationRepository.saveAndFlush(conversation);
		}
		conversation.addMessage(message);
		conversation.setLastMessageAt(message.getSentAt());
		// No hacer save() de la conversación ya administrada: Spring Data llama a
		// merge() y Hibernate puede soltar la colección con orphanRemoval.
		return messageRepository.save(message);
	}

	private Conversation getConversationForUser(AppUser user, Long conversationId) {
		return conversationService.requireReadable(user, conversationId);
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
		conversation.syncMessages(messages);
	}

	private AppUser requireStaff(AppUser claimed) {
		AppUser current = conversationService.requireAuthenticatedUser(claimed);
		if (current.getRole() != Role.ADMIN && current.getRole() != Role.SUPPORT) {
			throw new IllegalArgumentException(
					"Solo administradores o soporte pueden realizar esta acción.");
		}
		return current;
	}
}
