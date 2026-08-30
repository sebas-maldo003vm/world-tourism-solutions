package com.worldturism.spring.app.controller;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.service.TourServiceManager;
import com.worldturism.spring.app.view.dto.TourServiceRequest;
import com.worldturism.spring.app.view.dto.TourServiceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/provider/services")
@Tag(name = "Servicios de prestador", description = "Registro y consulta de servicios del prestador autenticado.")
public class ProviderServiceController {

	private final TourServiceManager tourServiceManager;

	public ProviderServiceController(TourServiceManager tourServiceManager) {
		this.tourServiceManager = tourServiceManager;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Registrar servicio", description = "Permite al prestador autenticado crear un nuevo servicio.")
	public TourServiceResponse create(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody TourServiceRequest request) {
		return tourServiceManager.create(user, request);
	}

	@GetMapping
	@Operation(summary = "Listar mis servicios", description = "Devuelve todos los servicios creados por el prestador autenticado.")
	public List<TourServiceResponse> listMyServices(@AuthenticationPrincipal AppUser user) {
		return tourServiceManager.listMyServices(user);
	}
}
