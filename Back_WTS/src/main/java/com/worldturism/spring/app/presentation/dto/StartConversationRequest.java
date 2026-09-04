package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StartConversationRequest(
		@NotNull Long providerProfileId,
		@Size(max = 500) String initialMessage) {
}
