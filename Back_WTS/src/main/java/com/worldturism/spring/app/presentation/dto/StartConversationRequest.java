package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.SupportUrgency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StartConversationRequest(
		@NotNull Long providerId,
		Long serviceId,
		@Size(max = 500) String initialMessage) {
}
