package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Message;
import java.time.Instant;

public record MessageResponse(
		Long id,
		Long senderId,
		String senderName,
		String content,
		Instant sentAt,
		boolean isRead,
		boolean isOwn) {

	public static MessageResponse from(Message message, Long currentUserId) {
		boolean isOwn = currentUserId != null && currentUserId.equals(message.getSender().getId());
		return new MessageResponse(
				message.getId(),
				message.getSender().getId(),
				message.getSender().getName(),
				message.getContent(),
				message.getSentAt(),
				Boolean.TRUE.equals(message.getIsRead()),
				isOwn);
	}
}
