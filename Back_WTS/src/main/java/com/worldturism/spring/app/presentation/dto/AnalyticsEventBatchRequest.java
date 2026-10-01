package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Lote de eventos (p. ej. SEARCH atribuido a varios proveedores visibles tras un filtro).
 * Tope bajo para evitar abuso del endpoint público.
 */
public record AnalyticsEventBatchRequest(
		@NotEmpty(message = "El lote de eventos no puede estar vacío")
		@Size(max = 40, message = "Máximo 40 eventos por lote")
		List<@Valid AnalyticsEventRequest> events) {
}
