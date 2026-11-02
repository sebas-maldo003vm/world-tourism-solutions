package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.application.service.ProviderBusinessManager;
import com.worldturism.spring.app.presentation.dto.ProviderBusinessRequest;
import com.worldturism.spring.app.presentation.dto.ProviderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/provider/business")
@Tag(name = "Negocio del proveedor", description = "Registro y consulta del negocio del proveedor autenticado.")
public class ProviderBusinessController {

	private final ProviderBusinessManager providerBusinessManager;

	public ProviderBusinessController(ProviderBusinessManager providerBusinessManager) {
		this.providerBusinessManager = providerBusinessManager;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Registrar negocio", description = "Persiste el negocio y hace insert de las URLs publicas en provider_profile_images.")
	public ProviderResponse create(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody ProviderBusinessRequest request) {
		return providerBusinessManager.create(user, request);
	}

	@GetMapping
	@Operation(summary = "Listar mis negocios", description = "Devuelve los negocios del proveedor autenticado.")
	public List<ProviderResponse> listMyBusinesses(@AuthenticationPrincipal AppUser user) {
		return providerBusinessManager.listMyBusinesses(user);
	}

	@PutMapping("/{businessId}")
	@Operation(summary = "Actualizar negocio", description = "Actualiza el negocio y, si llegan imageUrls, reemplaza la galeria en provider_profile_images.")
	public ProviderResponse update(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long businessId,
			@Valid @RequestBody ProviderBusinessRequest request) {
		return providerBusinessManager.update(user, businessId, request);
	}

	@DeleteMapping("/{businessId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Eliminar negocio", description = "Permite al proveedor autenticado eliminar uno de sus negocios.")
	public void delete(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long businessId) {
		providerBusinessManager.delete(user, businessId);
	}
}
