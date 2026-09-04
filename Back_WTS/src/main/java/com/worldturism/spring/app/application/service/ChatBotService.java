package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.Message;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import com.worldturism.spring.app.domain.model.SupportStatus;
import com.worldturism.spring.app.domain.model.SupportUrgency;
import com.worldturism.spring.app.infrastructure.persistence.repository.ConversationRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.MessageRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.UserRepository;
import com.worldturism.spring.app.presentation.dto.ChatBotMessageRequest;
import com.worldturism.spring.app.presentation.dto.ChatBotMessageResponse;
import com.worldturism.spring.app.presentation.dto.ChatBotSuggestionResponse;
import com.worldturism.spring.app.presentation.dto.MessageResponse;
import com.worldturism.spring.app.presentation.dto.SendMessageRequest;
import com.worldturism.spring.app.presentation.dto.SupportTicketResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatBotService {

	public static final String BOT_SUBJECT = Conversation.BOT_SUBJECT;
	private static final String BOT_EMAIL = "bot@worldtourism.local";
	private static final String BOT_NAME = Conversation.BOT_SUBJECT;

	private static final List<FaqRule> FAQ_RULES = List.of(
			new FaqRule(
					List.of("reservar", "reserva", "booking", "agendar", "cómo reservo", "como reservo"),
					"Para reservar un servicio: abre el catálogo, elige un negocio y pulsa Reservar. "
							+ "Puedes revisar tus reservas e itinerario desde el menú superior.",
					"FAQ: Cómo reservar"),
			new FaqRule(
					List.of("cancelar", "cancelación", "cancelacion", "anular"),
					"Para gestionar o cancelar una reserva, ve a tu Perfil o Itinerario y abre el detalle de la reserva. "
							+ "Si el asesor ya la aprobó, contacta soporte humano desde este chat.",
					"FAQ: Cancelaciones"),
			new FaqRule(
					List.of("itinerario", "viaje", "plan", "agenda"),
					"Tu itinerario agrupa las reservas confirmadas por ciudad. Accede desde el icono de calendario en la barra superior.",
					"FAQ: Itinerario"),
			new FaqRule(
					List.of("favorito", "favoritos", "guardar"),
					"Puedes marcar negocios como favoritos desde las tarjetas del catálogo. Los verás en tu perfil.",
					"FAQ: Favoritos"),
			new FaqRule(
					List.of("reseña", "resena", "opinión", "opinion", "calificar", "rating"),
					"Tras disfrutar un servicio puedes dejar una reseña desde la ficha del negocio o desde tus reservas.",
					"FAQ: Reseñas"),
			new FaqRule(
					List.of("pago", "pagar", "precio", "costo", "tarifa"),
					"Los precios se muestran en cada servicio/negocio. El cobro y políticas específicas las define el proveedor del servicio.",
					"FAQ: Pagos y precios"),
			new FaqRule(
					List.of("contacto", "proveedor", "asesor", "hablar con"),
					"Puedes contactar al proveedor con el botón Contactar en la tarjeta del servicio. "
							+ "Si necesitas ayuda de la plataforma, escribe aquí o pide un agente humano.",
					"FAQ: Contacto"),
			new FaqRule(
					List.of("hola", "buenas", "ayuda", "help", "asistente"),
					"¡Hola! Soy el asistente virtual de World Tourism Solutions. "
							+ "Puedo ayudarte con reservas, itinerario, favoritos o sugerirte servicios del catálogo. "
							+ "Si no encuentro respuesta, te conectaré con un agente humano.",
					"FAQ: Bienvenida"));

	private final ConversationRepository conversationRepository;
	private final MessageRepository messageRepository;
	private final UserRepository userRepository;
	private final ProviderProfileRepository providerProfileRepository;
	private final PasswordEncoder passwordEncoder;

	public ChatBotService(
			ConversationRepository conversationRepository,
			MessageRepository messageRepository,
			UserRepository userRepository,
			ProviderProfileRepository providerProfileRepository,
			PasswordEncoder passwordEncoder) {
		this.conversationRepository = conversationRepository;
		this.messageRepository = messageRepository;
		this.userRepository = userRepository;
		this.providerProfileRepository = providerProfileRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public ChatBotMessageResponse procesarMensaje(AppUser user, ChatBotMessageRequest request) {
		validateAuthenticated(user);
		if (user.getRole() != Role.USER && user.getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException("Solo turistas y proveedores pueden usar el asistente virtual.");
		}

		String content = request.content().trim();
		Conversation conversation = resolveSession(user, request.conversationId());
		Message userMessage = appendMessage(conversation, user, content);

		MatchResult match = matchAutomatedReply(content);
		AppUser bot = ensureBotUser();

		if (match.automated()) {
			if (conversation.getSupportStatus() == SupportStatus.NEEDS_HUMAN_SUPPORT) {
				conversation.setSupportStatus(SupportStatus.OPEN);
			} else if (conversation.getSupportStatus() == null
					|| conversation.getSupportStatus() == SupportStatus.CLOSED
					|| conversation.getSupportStatus() == SupportStatus.RESOLVED) {
				conversation.setSupportStatus(SupportStatus.OPEN);
			}
			conversation = conversationRepository.save(conversation);
			Message botMessage = appendMessage(conversation, bot, match.reply());
			return new ChatBotMessageResponse(
					conversation.getId(),
					conversation.getSupportStatus(),
					true,
					match.reply(),
					match.suggestions(),
					MessageResponse.from(userMessage, user.getId()),
					MessageResponse.from(botMessage, user.getId()));
		}

		conversation.setSupportStatus(SupportStatus.NEEDS_HUMAN_SUPPORT);
		conversation.setUrgency(SupportUrgency.MEDIUM);
		if (conversation.getConversationType() == ConversationType.CATALOG_INQUIRY
				|| conversation.isBotSession()) {
			ConversationType humanType = user.getRole() == Role.PROVIDER
					? ConversationType.PROVIDER_TO_SUPPORT
					: ConversationType.CLIENT_TO_SUPPORT;
			conversation.setConversationType(humanType);
			conversation.setSubject("Escalado desde " + BOT_SUBJECT);
		}
		conversation = conversationRepository.save(conversation);

		String escalationReply =
				"No encontré una respuesta automática para tu consulta. "
						+ "He escalado esta conversación a un agente de soporte humano. "
						+ "Un miembro del equipo te responderá en este mismo chat en breve.";
		Message botMessage = appendMessage(conversation, bot, escalationReply);

		return new ChatBotMessageResponse(
				conversation.getId(),
				SupportStatus.NEEDS_HUMAN_SUPPORT,
				false,
				escalationReply,
				List.of(),
				MessageResponse.from(userMessage, user.getId()),
				MessageResponse.from(botMessage, user.getId()));
	}

	@Transactional(readOnly = true)
	public List<SupportTicketResponse> listarTicketsActivos(AppUser staff) {
		validateStaff(staff);
		return conversationRepository
				.findBySupportStatusOrderByLastMessageAtDesc(SupportStatus.NEEDS_HUMAN_SUPPORT)
				.stream()
				.map(conversation -> {
					loadMessages(conversation);
					return SupportTicketResponse.from(conversation);
				})
				.toList();
	}

	@Transactional
	public MessageResponse responderTicket(AppUser staff, Long conversationId, SendMessageRequest request) {
		validateStaff(staff);
		Conversation conversation = conversationRepository.findById(conversationId)
				.orElseThrow(() -> new IllegalArgumentException("El ticket de soporte no existe."));
		if (!conversation.getConversationType().isHumanSupport()) {
			throw new IllegalArgumentException("La conversación indicada no es un ticket de soporte.");
		}
		if (conversation.getSupportStatus() == SupportStatus.CLOSED) {
			throw new IllegalArgumentException("El ticket de soporte está cerrado.");
		}

		if (conversation.getAssignedAdvisor() == null) {
			conversation.setAssignedAdvisor(staff);
		}
		if (conversation.getSupportStatus() == SupportStatus.OPEN
				|| conversation.getSupportStatus() == SupportStatus.UNASSIGNED
				|| conversation.getSupportStatus() == SupportStatus.NEEDS_HUMAN_SUPPORT) {
			conversation.setSupportStatus(SupportStatus.IN_PROGRESS);
		}
		conversationRepository.save(conversation);

		Message message = appendMessage(conversation, staff, request.content().trim());
		return MessageResponse.from(message, staff.getId());
	}

	private Conversation resolveSession(AppUser user, Long conversationId) {
		if (conversationId != null) {
			Conversation existing = conversationRepository.findById(conversationId)
					.orElseThrow(() -> new IllegalArgumentException("La sesión de chat no existe."));
			if (!existing.getUser().getId().equals(user.getId())) {
				throw new IllegalArgumentException("No tienes acceso a esta sesión de chat.");
			}
			if (!existing.isBotSession()
					&& existing.getConversationType() != ConversationType.CATALOG_INQUIRY) {
				throw new IllegalArgumentException("La conversación indicada no es una sesión del asistente.");
			}
			if (existing.getConversationType() != ConversationType.CATALOG_INQUIRY) {
				existing.setConversationType(ConversationType.CATALOG_INQUIRY);
				existing.setSubject(BOT_SUBJECT);
				return conversationRepository.save(existing);
			}
			return existing;
		}

		Optional<Conversation> openSession = conversationRepository
				.findFirstByUserIdAndConversationTypeAndSubjectAndSupportStatusNotInOrderByLastMessageAtDesc(
						user.getId(),
						ConversationType.CATALOG_INQUIRY,
						BOT_SUBJECT,
						List.of(SupportStatus.CLOSED, SupportStatus.RESOLVED));

		return openSession.orElseGet(() -> createBotSession(user));
	}

	private Conversation createBotSession(AppUser user) {
		Conversation conversation = new Conversation();
		conversation.setUser(user);
		conversation.setProvider(null);
		conversation.setConversationType(ConversationType.CATALOG_INQUIRY);
		conversation.setSupportStatus(SupportStatus.OPEN);
		conversation.setUrgency(SupportUrgency.LOW);
		conversation.setSubject(BOT_SUBJECT);
		return conversationRepository.save(conversation);
	}

	private MatchResult matchAutomatedReply(String content) {
		String normalized = content.toLowerCase(Locale.ROOT).trim();
		List<ChatBotSuggestionResponse> suggestions = new ArrayList<>();

		for (FaqRule rule : FAQ_RULES) {
			boolean hit = rule.keywords().stream().anyMatch(normalized::contains);
			if (hit) {
				suggestions.add(new ChatBotSuggestionResponse("FAQ", rule.label(), rule.answer(), null));
				return new MatchResult(true, rule.answer(), suggestions);
			}
		}

		List<ProviderProfile> businesses = providerProfileRepository.findByStatusOrderByIdDesc(ServiceStatus.APPROVED);
		for (ProviderProfile business : businesses) {
			if (matchesText(
					normalized,
					business.getBusinessName(),
					business.getDescription(),
					business.getCity(),
					business.getCategory())) {
				String snippet = "Negocio sugerido: " + business.getBusinessName()
						+ (business.getCity() != null ? " en " + business.getCity() : "")
						+ (business.getCategory() != null ? " · " + business.getCategory() : "") + ".";
				suggestions.add(new ChatBotSuggestionResponse(
						"BUSINESS",
						business.getBusinessName(),
						snippet,
						business.getId()));
			}
		}

		if (!suggestions.isEmpty()) {
			StringBuilder reply = new StringBuilder("Encontré estas opciones en el catálogo que podrían interesarte:\n");
			int limit = Math.min(suggestions.size(), 5);
			for (int i = 0; i < limit; i++) {
				reply.append("• ").append(suggestions.get(i).description()).append('\n');
			}
			reply.append("¿Quieres que te conecte con un agente humano?");
			return new MatchResult(true, reply.toString().trim(), suggestions.subList(0, limit));
		}

		return new MatchResult(false, "", List.of());
	}

	private boolean matchesText(String query, String... fields) {
		for (String field : fields) {
			if (field == null || field.isBlank()) {
				continue;
			}
			String value = field.toLowerCase(Locale.ROOT);
			if (query.contains(value) || value.contains(query) || containsAnyToken(query, value)) {
				return true;
			}
		}
		return false;
	}

	private boolean containsAnyToken(String query, String value) {
		String[] tokens = query.split("\\s+");
		for (String token : tokens) {
			if (token.length() >= 4 && value.contains(token)) {
				return true;
			}
		}
		return false;
	}

	private AppUser ensureBotUser() {
		return userRepository.findByEmail(BOT_EMAIL).map(existing -> {
			if (existing.getRole() != Role.BOT) {
				existing.setRole(Role.BOT);
				return userRepository.save(existing);
			}
			return existing;
		}).orElseGet(() -> {
			AppUser bot = new AppUser();
			bot.setName(BOT_NAME);
			bot.setEmail(BOT_EMAIL);
			bot.setPassword(passwordEncoder.encode("BotVirtualWTS!2026"));
			bot.setPhoneNumber("0000000000");
			bot.setRole(Role.BOT);
			bot.setIsActive(true);
			return userRepository.save(bot);
		});
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

	private void loadMessages(Conversation conversation) {
		List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId());
		conversation.setMessages(new ArrayList<>(messages));
	}

	private void validateAuthenticated(AppUser user) {
		if (user == null) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
	}

	private void validateStaff(AppUser user) {
		validateAuthenticated(user);
		if (user.getRole() != Role.ADMIN && user.getRole() != Role.SUPPORT) {
			throw new IllegalArgumentException("Solo administradores o soporte pueden realizar esta acción.");
		}
	}

	private record FaqRule(List<String> keywords, String answer, String label) {
	}

	private record MatchResult(boolean automated, String reply, List<ChatBotSuggestionResponse> suggestions) {
	}
}
