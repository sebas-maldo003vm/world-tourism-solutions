package com.worldturism.spring.app.presentation.dto;

public record ChatBotSuggestionResponse(
		String type,
		String title,
		String description,
		Long entityId) {
}
