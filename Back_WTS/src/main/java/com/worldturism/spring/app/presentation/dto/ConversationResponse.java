package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.domain.model.SupportStatus;
import com.worldturism.spring.app.domain.model.SupportUrgency;
import java.time.Instant;

public record ConversationResponse(
		Long id,
		Instant createdAt,
		String displayName,
		String lastMessage,
		Instant lastMessageAt,
		long unreadCount,
		ConversationType conversationType,
		SupportStatus supportStatus,
		SupportUrgency urgency,
		String subject,
		Long assignedAdvisorId,
		String assignedAdvisorName,
		Long otherParticipantId,
		String otherParticipantName,
		String otherParticipantAvatarUrl,
		Long clientId,
		String clientName,
		String clientAvatarUrl,
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
			Long currentUserId,
			Role viewerRole) {
		ProviderProfile providerProfile = conversation.getProvider();
		AppUser client = conversation.getUser();
		AppUser providerUser = providerProfile != null ? providerProfile.getUser() : null;
		AppUser assignedAdvisor = conversation.getAssignedAdvisor();

		Long clientId = client != null ? client.getId() : null;
		String clientName = client != null ? client.getName() : null;
		String clientAvatarUrl = client != null ? client.getProfilePictureUrl() : null;

		Long providerProfileId = providerProfile != null ? providerProfile.getId() : null;
		String businessName = providerProfile != null ? providerProfile.getBusinessName() : null;
		String providerProfileName = businessName != null ? businessName : conversation.getSubject();
		String logoUrl = providerProfile != null ? providerProfile.getLogoUrl() : null;
		String category = providerProfile != null ? providerProfile.getCategory() : null;
		String city = providerProfile != null ? providerProfile.getCity() : null;

		Counterparty counterparty = resolveCounterparty(
				conversation, currentUserId, viewerRole, client, providerProfile, providerUser);

		String displayName = resolveDisplayName(
				conversation, viewerRole, businessName, clientName, counterparty.name());

		return new ConversationResponse(
				conversation.getId(),
				conversation.getCreatedAt(),
				displayName,
				lastMessage,
				conversation.getLastMessageAt(),
				unreadCount,
				conversation.getConversationType(),
				conversation.getSupportStatus(),
				conversation.getUrgency(),
				conversation.getSubject(),
				assignedAdvisor != null ? assignedAdvisor.getId() : null,
				assignedAdvisor != null ? assignedAdvisor.getName() : null,
				counterparty.id(),
				counterparty.name(),
				counterparty.avatarUrl(),
				clientId,
				clientName,
				clientAvatarUrl,
				providerProfileId,
				providerProfileId,
				providerProfileName,
				businessName,
				logoUrl,
				category,
				city);
	}

	/** Compatibilidad con llamadas que solo pasan currentUserId. */
	public static ConversationResponse from(
			Conversation conversation,
			String lastMessage,
			long unreadCount,
			Long currentUserId) {
		return from(conversation, lastMessage, unreadCount, currentUserId, null);
	}

	private static Counterparty resolveCounterparty(
			Conversation conversation,
			Long currentUserId,
			Role viewerRole,
			AppUser client,
			ProviderProfile providerProfile,
			AppUser providerUser) {
		boolean isStaff = viewerRole == Role.ADMIN || viewerRole == Role.SUPPORT;

		if (conversation.getConversationType() == ConversationType.CLIENT_TO_PROVIDER) {
			boolean viewerIsClient = currentUserId != null
					&& client != null
					&& currentUserId.equals(client.getId());

			if (isStaff) {
				// Staff: la contraparte "principal" es el cliente; el negocio va en campos dedicados.
				return new Counterparty(
						client != null ? client.getId() : null,
						client != null ? client.getName() : null,
						client != null ? client.getProfilePictureUrl() : null);
			}
			if (viewerIsClient) {
				// USER/CUSTOMER → ProviderProfile (negocio + logo)
				return new Counterparty(
						providerProfile != null ? providerProfile.getId() : null,
						businessDisplayName(providerProfile, providerUser),
						providerProfile != null ? providerProfile.getLogoUrl() : null);
			}
			// PROVIDER → AppUser iniciador (cliente)
			return new Counterparty(
					client != null ? client.getId() : null,
					client != null ? client.getName() : null,
					client != null ? client.getProfilePictureUrl() : null);
		}

		if (conversation.getConversationType().isHumanSupport()) {
			if (isStaff) {
				return new Counterparty(
						client != null ? client.getId() : null,
						client != null ? client.getName() : null,
						client != null ? client.getProfilePictureUrl() : null);
			}
			return new Counterparty(null, "Soporte Técnico", null);
		}

		return new Counterparty(null, null, null);
	}

	private static String businessDisplayName(ProviderProfile providerProfile, AppUser providerUser) {
		if (providerProfile != null && providerProfile.getBusinessName() != null
				&& !providerProfile.getBusinessName().isBlank()) {
			return providerProfile.getBusinessName();
		}
		return providerUser != null ? providerUser.getName() : null;
	}

	private static String resolveDisplayName(
			Conversation conversation,
			Role viewerRole,
			String businessName,
			String clientName,
			String otherParticipantName) {
		if (conversation.isBotSession()) {
			return Conversation.BOT_SUBJECT;
		}

		boolean isStaff = viewerRole == Role.ADMIN || viewerRole == Role.SUPPORT;
		if (isStaff && conversation.getConversationType() == ConversationType.CLIENT_TO_PROVIDER) {
			String client = clientName != null && !clientName.isBlank() ? clientName : "Cliente";
			String business = businessName != null && !businessName.isBlank() ? businessName : "Proveedor";
			return client + " · " + business;
		}

		if (conversation.getConversationType().isHumanSupport()) {
			if (isStaff && clientName != null && !clientName.isBlank()) {
				return clientName;
			}
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

	private record Counterparty(Long id, String name, String avatarUrl) {
	}
}
