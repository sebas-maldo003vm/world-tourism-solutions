package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.AnalyticsEventService;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.presentation.dto.AnalyticsEventRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics/events")
@Tag(name = "Analítica", description = "Registro de eventos de búsqueda, vista y clic para reportes.")
public class AnalyticsEventController {

	private final AnalyticsEventService analyticsEventService;

	public AnalyticsEventController(AnalyticsEventService analyticsEventService) {
		this.analyticsEventService = analyticsEventService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(
			summary = "Registrar evento de analítica",
			description = "Registra un evento SEARCH, VIEW o CLICK. Accesible sin autenticación (usuarios anónimos también generan datos de analítica).")
	public void record(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody AnalyticsEventRequest request) {
		analyticsEventService.record(user, request);
	}
}
