package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.SupportStatus;
import com.worldturism.spring.app.domain.model.SupportUrgency;
import java.time.Instant;

public record SupportTicketResponse(
		Long id,
		String userName,
		String subject,
		SupportUrgency urgency,
		String message,
		Instant createdAt,
		SupportStatus status,
		ConversationType conversationType) {

	public static SupportTicketResponse from(Conversation conversation) {
		String latestMessage = conversation.getMessages().isEmpty()
				? ""
				: conversation.getMessages().get(conversation.getMessages().size() - 1).getContent();
		String subject = conversation.getSubject() != null ? conversation.getSubject() : "General";
		return new SupportTicketResponse(
				conversation.getId(),
				conversation.getUser().getName(),
				subject,
				conversation.getUrgency() != null ? conversation.getUrgency() : SupportUrgency.MEDIUM,
				latestMessage,
				conversation.getCreatedAt(),
				conversation.getSupportStatus() != null ? conversation.getSupportStatus() : SupportStatus.OPEN,
				conversation.getConversationType());
	}
}
