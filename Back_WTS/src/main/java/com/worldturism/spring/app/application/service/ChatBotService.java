package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.Message;
import com.worldturism.spring.app.domain.model.Role;
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
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatBotService {

    public static final String BOT_SUBJECT = Conversation.BOT_SUBJECT;
    private static final String BOT_EMAIL = "bot@worldtourism.local";
    private static final String BOT_NAME = Conversation.BOT_SUBJECT;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final ConversationService conversationService;
    private final GeminiService geminiService;

    public ChatBotService(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            UserRepository userRepository,
            ProviderProfileRepository providerProfileRepository,
            PasswordEncoder passwordEncoder,
            ConversationService conversationService,
            GeminiService geminiService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.conversationService = conversationService;
        this.geminiService = geminiService;
    }

    @Transactional
    public ChatBotMessageResponse procesarMensaje(AppUser user, ChatBotMessageRequest request) {
        AppUser current = conversationService.requireAuthenticatedUser(user);
        if (current.getRole() != Role.USER && current.getRole() != Role.PROVIDER) {
            throw new IllegalArgumentException("Solo turistas y proveedores pueden usar el asistente virtual.");
        }

        String content = request.content().trim();
        Conversation conversation = resolveSession(current, request.conversationId());
        Message userMessage = appendMessage(conversation, current, content);

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
                    MessageResponse.from(userMessage, current.getId()),
                    MessageResponse.from(botMessage, current.getId()));
        }

        conversation.setSupportStatus(SupportStatus.UNASSIGNED);
        conversation.setAssignedAdvisor(null);
        conversation.setUrgency(SupportUrgency.MEDIUM);
        if (conversation.getConversationType() == ConversationType.CATALOG_INQUIRY
                || conversation.isBotSession()) {
            ConversationType humanType = current.getRole() == Role.PROVIDER
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
                conversation.getSupportStatus(),
                false,
                escalationReply,
                List.of(),
                MessageResponse.from(userMessage, current.getId()),
                MessageResponse.from(botMessage, current.getId()));
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listarTicketsActivos(AppUser staff) {
        AppUser current = conversationService.requireAuthenticatedUser(staff);
        validateStaff(current);
        return conversationService.listStaffSupportTickets(current)
                .stream()
                .filter(conversation -> conversation.getSupportStatus() == SupportStatus.NEEDS_HUMAN_SUPPORT
                        || (conversation.getAssignedAdvisor() == null
                                && conversation.getSupportStatus() == SupportStatus.UNASSIGNED))
                .map(conversation -> {
                    loadMessages(conversation);
                    return SupportTicketResponse.from(conversation);
                })
                .toList();
    }

    @Transactional
    public MessageResponse responderTicket(AppUser staff, Long conversationId, SendMessageRequest request) {
        AppUser current = conversationService.requireAuthenticatedUser(staff);
        validateStaff(current);
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
        conversationRepository.save(conversation);

        Message message = appendMessage(conversation, current, request.content().trim());
        return MessageResponse.from(message, current.getId());
    }

    private Conversation resolveSession(AppUser user, Long conversationId) {
        if (conversationId != null) {
            Conversation existing = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("La sesión de chat no existe."));
            conversationService.assertCanAccess(user, existing);
            if (existing.getConversationType() != null && existing.getConversationType().isHumanSupport()) {
                throw new IllegalArgumentException("La conversación indicada no es una sesión del asistente.");
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

        // Opción A: Cada vez que abra el asistente se crea una sesión limpia e independiente
        return createBotSession(user);
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
        String respuestaIA = geminiService.generarRespuestaNatural(content);
        return new MatchResult(true, respuestaIA, List.of());
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
        message.setSender(sender);
        message.setContent(content);
        message.setSentAt(Instant.now());
        if (conversation.getId() == null) {
            conversationRepository.saveAndFlush(conversation);
        }
        conversation.addMessage(message);
        conversation.setLastMessageAt(message.getSentAt());
        return messageRepository.save(message);
    }

    private void loadMessages(Conversation conversation) {
        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId());
        conversation.syncMessages(messages);
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

    private record MatchResult(boolean automated, String reply, List<ChatBotSuggestionResponse> suggestions) {
    }
}