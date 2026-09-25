package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnalyticsEventRequest(
		@NotBlank(message = "El tipo de evento es obligatorio (SEARCH, VIEW o CLICK)")
		String eventType,

		Long providerProfileId,

		@Size(max = 200, message = "El texto de búsqueda no puede superar 200 caracteres")
		String searchQuery) {
}
