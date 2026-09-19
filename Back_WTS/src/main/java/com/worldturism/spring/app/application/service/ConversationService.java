package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.domain.model.SupportStatus;
import com.worldturism.spring.app.infrastructure.persistence.repository.ConversationRepository;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aislamiento de bandejas y lectura de chats según el rol del usuario autenticado
 * en el {@link SecurityContextHolder}.
 */
@Service
public class ConversationService {

	static final String ACCESS_DENIED_MESSAGE = "No tienes permiso para acceder a esta conversación.";

	private final ConversationRepository conversationRepository;

	public ConversationService(ConversationRepository conversationRepository) {
		this.conversationRepository = conversationRepository;
	}

	/**
	 * Identidad del request. No se acepta un usuario pasado por parámetro:
	 * el filtro de bandeja y el 403 se calculan siempre con este principal.
	 */
	public AppUser requireAuthenticatedUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null
				|| !authentication.isAuthenticated()
				|| !(authentication.getPrincipal() instanceof AppUser user)
				|| user.getId() == null) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
		return user;
	}

	/**
	 * Si el controlador entrega un principal, debe coincidir con el SecurityContext.
	 */
	public AppUser requireAuthenticatedUser(AppUser claimed) {
		AppUser current = requireAuthenticatedUser();
		if (claimed != null && claimed.getId() != null && !claimed.getId().equals(current.getId())) {
			throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
		}
		return current;
	}

	@Transactional(readOnly = true)
	public List<Conversation> listHumanInbox(AppUser claimed) {
		AppUser actor = requireAuthenticatedUser(claimed);
		Map<Long, Conversation> unique = new LinkedHashMap<>();
		switch (actor.getRole()) {
			case USER -> {
				conversationRepository.findCommercialByClientUserId(actor.getId())
						.forEach(conversation -> unique.put(conversation.getId(), conversation));
				conversationRepository
						.findSupportTicketsByOwner(actor.getId(), ConversationType.humanSupportTypes())
						.forEach(conversation -> unique.put(conversation.getId(), conversation));
			}
			case PROVIDER -> {
				conversationRepository.findCommercialByProviderUserId(actor.getId())
						.forEach(conversation -> unique.put(conversation.getId(), conversation));
				conversationRepository
						.findSupportTicketsByOwner(actor.getId(), ConversationType.humanSupportTypes())
						.forEach(conversation -> unique.put(conversation.getId(), conversation));
			}
			case ADMIN, SUPPORT -> conversationRepository
					.findStaffVisibleSupportTickets(ConversationType.humanSupportTypes(), actor.getId())
					.forEach(conversation -> unique.put(conversation.getId(), conversation));
			default -> {
				// BOT y roles desconocidos no tienen bandeja humana.
			}
		}
		return unique.values().stream()
				.filter(conversation -> !isCatalogInquiry(conversation))
				.filter(conversation -> canAccess(actor, conversation))
				.sorted(Comparator.comparing(
						Conversation::getLastMessageAt, Comparator.nullsLast(Comparator.reverseOrder())))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<Conversation> listStaffSupportTickets(AppUser claimed) {
		AppUser actor = requireAuthenticatedUser(claimed);
		if (!isStaff(actor)) {
			throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
		}
		return conversationRepository
				.findStaffVisibleSupportTickets(ConversationType.humanSupportTypes(), actor.getId())
				.stream()
				.filter(conversation -> !isCatalogInquiry(conversation))
				.filter(conversation -> canAccess(actor, conversation))
				.toList();
	}

	@Transactional(readOnly = true)
	public Conversation requireReadable(AppUser claimed, Long conversationId) {
		AppUser actor = requireAuthenticatedUser(claimed);
		Conversation conversation = conversationRepository.findById(conversationId)
				.orElseThrow(() -> new IllegalArgumentException("La conversación no existe."));
		assertCanAccess(actor, conversation);
		return conversation;
	}

	public void assertCanAccess(AppUser actor, Conversation conversation) {
		AppUser current = requireAuthenticatedUser(actor);
		if (!canAccess(current, conversation)) {
			throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
		}
	}

	boolean canAccess(AppUser actor, Conversation conversation) {
		if (actor == null || actor.getId() == null || actor.getRole() == null || conversation == null) {
			return false;
		}
		ConversationType type = conversation.getConversationType();
		if (type == null || isCatalogInquiry(conversation)) {
			return isCatalogOwner(actor, conversation);
		}
		if (type == ConversationType.CLIENT_TO_PROVIDER) {
			return canAccessCommercial(actor, conversation);
		}
		if (type.isHumanSupport()) {
			return canAccessSupportTicket(actor, conversation);
		}
		return false;
	}

	private boolean canAccessCommercial(AppUser actor, Conversation conversation) {
		if (actor.getRole() == Role.USER) {
			return isClient(actor, conversation);
		}
		if (actor.getRole() == Role.PROVIDER) {
			return isProviderOwner(actor, conversation);
		}
		return false;
	}

	private boolean canAccessSupportTicket(AppUser actor, Conversation conversation) {
		if (actor.getRole() == Role.USER || actor.getRole() == Role.PROVIDER) {
			return isClient(actor, conversation);
		}
		if (isStaff(actor)) {
			return isVisibleToStaff(actor, conversation);
		}
		return false;
	}

	private boolean isVisibleToStaff(AppUser advisor, Conversation conversation) {
		if (conversation.getConversationType() == null || !conversation.getConversationType().isHumanSupport()) {
			return false;
		}
		if (isCatalogInquiry(conversation)) {
			return false;
		}
		boolean assignedToSelf = conversation.getAssignedAdvisor() != null
				&& advisor.getId().equals(conversation.getAssignedAdvisor().getId());
		boolean unassignedQueue = conversation.getAssignedAdvisor() == null
				&& conversation.getSupportStatus() == SupportStatus.UNASSIGNED;
		return assignedToSelf || unassignedQueue;
	}

	private boolean isCatalogOwner(AppUser actor, Conversation conversation) {
		if (!isCatalogInquiry(conversation)) {
			return false;
		}
		if (actor.getRole() != Role.USER && actor.getRole() != Role.PROVIDER) {
			return false;
		}
		return isClient(actor, conversation);
	}

	private boolean isClient(AppUser actor, Conversation conversation) {
		return conversation.getUser() != null && actor.getId().equals(conversation.getUser().getId());
	}

	private boolean isProviderOwner(AppUser actor, Conversation conversation) {
		return conversation.getProvider() != null
				&& conversation.getProvider().getUser() != null
				&& actor.getId().equals(conversation.getProvider().getUser().getId());
	}

	static boolean isCatalogInquiry(Conversation conversation) {
		if (conversation.getConversationType() == ConversationType.CATALOG_INQUIRY) {
			return true;
		}
		if (conversation.getConversationType() != null && conversation.getConversationType().isHumanSupport()) {
			return false;
		}
		String subject = conversation.getSubject();
		return subject != null && Conversation.BOT_SUBJECT.equalsIgnoreCase(subject.trim());
	}

	private boolean isStaff(AppUser user) {
		return user.getRole() == Role.ADMIN || user.getRole() == Role.SUPPORT;
	}
}
