package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Message;
import java.time.Instant;

public record MessageResponse(
		Long id,
		Long conversationId,
		Long senderId,
		String senderName,
		String content,
		String imageUrl,
		Instant sentAt,
		boolean isRead,
		boolean isOwn) {

	public static MessageResponse from(Message message, Long currentUserId) {
		boolean isOwn = currentUserId != null && currentUserId.equals(message.getSender().getId());
		Long conversationId = message.getConversation() != null ? message.getConversation().getId() : null;
		return new MessageResponse(
				message.getId(),
				conversationId,
				message.getSender().getId(),
				message.getSender().getName(),
				message.getContent(),
				message.getImageUrl(),
				message.getSentAt(),
				Boolean.TRUE.equals(message.getIsRead()),
				isOwn);
	}
}
