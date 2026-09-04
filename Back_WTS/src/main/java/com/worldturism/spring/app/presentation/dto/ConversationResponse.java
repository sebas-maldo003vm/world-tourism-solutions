package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.ProviderProfile;
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
		Long providerId,
		Long providerProfileId,
		String providerProfileName,
		String businessName,
		String logoUrl,
		String category,
		String city) {

	public static ConversationResponse from(
			Conversation conversation,
			String lastMessage,
			long unreadCount,
			Long currentUserId) {
		ProviderProfile providerProfile = conversation.getProvider();
		AppUser providerUser = providerProfile != null ? providerProfile.getUser() : null;

		Long otherId = null;
		String otherName = null;
		if (conversation.getConversationType() == ConversationType.CLIENT_TO_PROVIDER) {
			if (currentUserId != null && currentUserId.equals(conversation.getUser().getId())) {
				otherId = providerUser != null ? providerUser.getId() : null;
				otherName = providerProfile != null && providerProfile.getBusinessName() != null
						? providerProfile.getBusinessName()
						: (providerUser != null ? providerUser.getName() : null);
			} else {
				otherId = conversation.getUser().getId();
				otherName = conversation.getUser().getName();
			}
		}

		// providerId: alias de providerProfileId (el front inicia chat con el id del negocio).
		Long providerProfileId = providerProfile != null ? providerProfile.getId() : null;
		String businessName = providerProfile != null ? providerProfile.getBusinessName() : null;
		String providerProfileName = businessName != null ? businessName : conversation.getSubject();
		String logoUrl = providerProfile != null ? providerProfile.getLogoUrl() : null;
		String category = providerProfile != null ? providerProfile.getCategory() : null;
		String city = providerProfile != null ? providerProfile.getCity() : null;
		String displayName = resolveDisplayName(conversation, businessName, otherName);

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
				providerProfileId,
				providerProfileId,
				providerProfileName,
				businessName,
				logoUrl,
				category,
				city);
	}

	private static String resolveDisplayName(
			Conversation conversation,
			String businessName,
			String otherParticipantName) {
		if ("Asistente Virtual".equals(conversation.getSubject())) {
			return "Asistente Virtual";
		}
		if (conversation.getConversationType() == ConversationType.CLIENT_TO_SUPPORT
				|| conversation.getConversationType() == ConversationType.PROVIDER_TO_SUPPORT) {
			return "Soporte Técnico";
		}
		if (otherParticipantName != null && !otherParticipantName.isBlank()) {
			return otherParticipantName;
		}
		if (businessName != null && !businessName.isBlank()) {
			return businessName;
		}
		if (conversation.getSubject() != null && !conversation.getSubject().isBlank()) {
			return conversation.getSubject();
		}
		return "Conversación";
	}
}
