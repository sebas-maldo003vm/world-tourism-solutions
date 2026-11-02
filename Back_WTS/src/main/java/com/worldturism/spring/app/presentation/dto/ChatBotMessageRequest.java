package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatBotMessageRequest(
		@NotBlank @Size(max = 2000) String content,
		Long conversationId) {
}
