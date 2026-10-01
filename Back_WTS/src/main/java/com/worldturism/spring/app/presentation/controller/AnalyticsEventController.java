package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.AnalyticsEventService;
import com.worldturism.spring.app.presentation.dto.AnalyticsEventBatchRequest;
import com.worldturism.spring.app.presentation.dto.AnalyticsEventRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics/events")
@Tag(
		name = "Analítica",
		description = "Incrementa contadores diarios por proveedor (no inserta filas crudas por impresión).")
public class AnalyticsEventController {

	private final AnalyticsEventService analyticsEventService;

	public AnalyticsEventController(AnalyticsEventService analyticsEventService) {
		this.analyticsEventService = analyticsEventService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(
			summary = "Registrar evento de analítica",
			description = "Incrementa views/clicks/searches del día para un proveedor. "
					+ "Accesible sin autenticación (anónimos también generan métricas).")
	public void record(@Valid @RequestBody AnalyticsEventRequest request) {
		analyticsEventService.record(request);
	}

	@PostMapping("/batch")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(
			summary = "Registrar lote de eventos",
			description = "Agrupa hasta 40 eventos en un solo request (p. ej. SEARCH atribuido a resultados). "
					+ "Colapsa por proveedor antes del UPSERT.")
	public void recordBatch(@Valid @RequestBody AnalyticsEventBatchRequest request) {
		analyticsEventService.recordBatch(request.events());
	}
}
