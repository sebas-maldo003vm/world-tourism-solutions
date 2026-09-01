package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.SupportStatus;
import com.worldturism.spring.app.domain.model.SupportUrgency;
import java.time.Instant;

public record ConversationResponse(
		Long id,
		String displayName,
		String lastMessage,
		Instant lastMessageAt,
		long unreadCount,
		ConversationType conversationType,
		SupportStatus supportStatus,
		SupportUrgency urgency,
		Long otherParticipantId,
		String otherParticipantName,
		Long serviceId,
		String serviceName) {

	public static ConversationResponse from(
			Conversation conversation,
			String lastMessage,
			long unreadCount,
			Long currentUserId) {
		String displayName = resolveDisplayName(conversation);
		Long otherId = null;
		String otherName = null;
		if (conversation.getConversationType() == ConversationType.CLIENT_TO_PROVIDER) {
			if (currentUserId != null && currentUserId.equals(conversation.getUser().getId())) {
				otherId = conversation.getProvider() != null ? conversation.getProvider().getId() : null;
				otherName = conversation.getProvider() != null ? conversation.getProvider().getName() : null;
			} else {
				otherId = conversation.getUser().getId();
				otherName = conversation.getUser().getName();
			}
		}
		String serviceName = conversation.getService() != null
				? conversation.getService().getTitle()
				: conversation.getSubject();
		Long serviceId = conversation.getService() != null ? conversation.getService().getId() : null;
		return new ConversationResponse(
				conversation.getId(),
				displayName,
				lastMessage,
				conversation.getLastMessageAt(),
				unreadCount,
				conversation.getConversationType(),
				conversation.getSupportStatus(),
				conversation.getUrgency(),
				otherId,
				otherName,
				serviceId,
				serviceName);
	}

	private static String resolveDisplayName(Conversation conversation) {
		if (conversation.getConversationType() == ConversationType.CLIENT_TO_SUPPORT) {
			return "Atención al Cliente";
		}
		if (conversation.getConversationType() == ConversationType.PROVIDER_TO_SUPPORT) {
			return "Soporte para Proveedores";
		}
		if (conversation.getService() != null) {
			return conversation.getService().getTitle();
		}
		if (conversation.getProvider() != null) {
			return conversation.getProvider().getName();
		}
		return "Conversación";
	}
}
