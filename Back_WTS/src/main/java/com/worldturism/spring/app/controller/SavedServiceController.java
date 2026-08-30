package com.worldturism.spring.app.controller;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.service.SavedServiceManager;
import com.worldturism.spring.app.view.dto.SavedServiceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/services")
@Tag(name = "Servicios adquiridos", description = "Adquisicion y consulta de servicios del usuario autenticado.")
public class SavedServiceController {

	private final SavedServiceManager savedServiceManager;

	public SavedServiceController(SavedServiceManager savedServiceManager) {
		this.savedServiceManager = savedServiceManager;
	}

	@PostMapping("/{serviceId}/acquire")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Adquirir servicio", description = "Permite al usuario autenticado adquirir un servicio para poder dejar una resena.")
	public SavedServiceResponse acquire(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long serviceId) {
		return savedServiceManager.acquire(user, serviceId);
	}

	@GetMapping("/acquired")
	@Operation(summary = "Listar servicios adquiridos", description = "Devuelve los servicios adquiridos por el usuario autenticado.")
	public List<SavedServiceResponse> listMyAcquiredServices(@AuthenticationPrincipal AppUser user) {
		return savedServiceManager.listMyAcquiredServices(user);
	}
}
