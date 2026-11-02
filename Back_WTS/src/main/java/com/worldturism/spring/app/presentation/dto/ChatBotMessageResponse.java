package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.SupportStatus;
import java.util.List;

public record ChatBotMessageResponse(
		Long conversationId,
		SupportStatus sessionStatus,
		boolean automated,
		String reply,
		List<ChatBotSuggestionResponse> suggestions,
		MessageResponse userMessage,
		MessageResponse botMessage) {
}
