package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Evento de analítica de intención (VIEW detalle, CLICK, SEARCH atribuido).
 * No representa impresiones de listado: esas no deben saturar la BD.
 */
public record AnalyticsEventRequest(
		@NotBlank(message = "El tipo de evento es obligatorio (SEARCH, VIEW o CLICK)")
		String eventType,

		@Positive(message = "providerProfileId debe ser un id positivo")
		Long providerProfileId,

		@Size(max = 200, message = "El texto de búsqueda no puede superar 200 caracteres")
		String searchQuery) {
}
