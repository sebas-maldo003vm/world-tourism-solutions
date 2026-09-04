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
import com.worldturism.spring.app.presentation.dto.ConversationResponse;
import com.worldturism.spring.app.presentation.dto.CreateSupportTicketRequest;
import com.worldturism.spring.app.presentation.dto.MessageResponse;
import com.worldturism.spring.app.presentation.dto.SendMessageRequest;
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

	public SupportChatService(
			ConversationRepository conversationRepository,
			MessageRepository messageRepository,
			ProviderProfileRepository providerProfileRepository) {
		this.conversationRepository = conversationRepository;
		this.messageRepository = messageRepository;
		this.providerProfileRepository = providerProfileRepository;
	}

	@Transactional(readOnly = true)
	public List<ConversationResponse> listarConversaciones(AppUser user) {
		validateAuthenticated(user);
		List<Conversation> conversations = findConversationsForUser(user);
		return conversations.stream()
				.map(conversation -> toConversationResponse(conversation, user.getId()))
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

		return toConversationResponse(conversation, user.getId());
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
		conversation.setSupportStatus(SupportStatus.OPEN);
		conversation.setUrgency(request.urgency() != null ? request.urgency() : SupportUrgency.MEDIUM);
		conversation.setSubject(request.serviceName() != null && !request.serviceName().isBlank()
				? request.serviceName().trim()
				: "Soporte general");
		conversation = conversationRepository.save(conversation);

		appendMessage(conversation, user, request.message().trim());
		loadMessagesForTicket(conversation);
		return SupportTicketResponse.from(conversation);
	}

	@Transactional(readOnly = true)
	public List<SupportTicketResponse> listarTicketsSoporte(AppUser admin) {
		validateAdmin(admin);
		List<ConversationType> supportTypes = List.of(
				ConversationType.CLIENT_TO_SUPPORT,
				ConversationType.PROVIDER_TO_SUPPORT);
		return conversationRepository.findByConversationTypeInOrderByLastMessageAtDesc(supportTypes)
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
		validateAdmin(admin);
		Conversation conversation = conversationRepository.findById(conversationId)
				.orElseThrow(() -> new IllegalArgumentException("El ticket de soporte no existe."));
		if (conversation.getConversationType() != ConversationType.CLIENT_TO_SUPPORT
				&& conversation.getConversationType() != ConversationType.PROVIDER_TO_SUPPORT) {
			throw new IllegalArgumentException("La conversación indicada no es un ticket de soporte.");
		}
		conversation.setSupportStatus(request.status());
		conversation = conversationRepository.save(conversation);
		loadMessagesForTicket(conversation);
		return SupportTicketResponse.from(conversation);
	}

	@Transactional
	public MessageResponse responderTicketSoporte(AppUser admin, Long conversationId, SendMessageRequest request) {
		validateAdmin(admin);
		Conversation conversation = conversationRepository.findById(conversationId)
				.orElseThrow(() -> new IllegalArgumentException("El ticket de soporte no existe."));
		if (conversation.getConversationType() != ConversationType.CLIENT_TO_SUPPORT
				&& conversation.getConversationType() != ConversationType.PROVIDER_TO_SUPPORT) {
			throw new IllegalArgumentException("La conversación indicada no es un ticket de soporte.");
		}
		if (conversation.getSupportStatus() == SupportStatus.CLOSED) {
			throw new IllegalArgumentException("El ticket de soporte está cerrado.");
		}
		if (conversation.getSupportStatus() == SupportStatus.OPEN
				|| conversation.getSupportStatus() == SupportStatus.NEEDS_HUMAN_SUPPORT) {
			conversation.setSupportStatus(SupportStatus.IN_PROGRESS);
		}
		Message message = appendMessage(conversation, admin, request.content().trim());
		return MessageResponse.from(message, admin.getId());
	}

	private List<Conversation> findConversationsForUser(AppUser user) {
		Map<Long, Conversation> unique = new LinkedHashMap<>();
		if (isAdminOrSupport(user)) {
			conversationRepository.findByConversationTypeInOrderByLastMessageAtDesc(
					List.of(ConversationType.CLIENT_TO_SUPPORT, ConversationType.PROVIDER_TO_SUPPORT))
					.forEach(conversation -> unique.put(conversation.getId(), conversation));
		}
		if (user.getRole() == Role.USER || isAdminOrSupport(user)) {
			conversationRepository.findByUserIdOrderByLastMessageAtDesc(user.getId())
					.forEach(conversation -> unique.put(conversation.getId(), conversation));
		}
		if (user.getRole() == Role.PROVIDER || isAdminOrSupport(user)) {
			conversationRepository.findByProvider_User_IdOrderByLastMessageAtDesc(user.getId())
					.forEach(conversation -> unique.put(conversation.getId(), conversation));
		}
		return unique.values().stream()
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
		String lastMessage = messageRepository.findTopByConversationIdOrderBySentAtDesc(conversation.getId())
				.map(Message::getContent)
				.orElse("");
		long unread = messageRepository.countByConversationIdAndIsReadFalseAndSenderIdNot(
				conversation.getId(), currentUserId);
		return ConversationResponse.from(conversation, lastMessage, unread, currentUserId);
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
