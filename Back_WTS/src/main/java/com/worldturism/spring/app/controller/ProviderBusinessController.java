package com.worldturism.spring.app.controller;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.service.ProviderBusinessManager;
import com.worldturism.spring.app.view.dto.ProviderBusinessRequest;
import com.worldturism.spring.app.view.dto.ProviderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/provider/business")
@Tag(name = "Negocio del proveedor", description = "Registro y consulta del negocio del proveedor autenticado.")
public class ProviderBusinessController {

	private final ProviderBusinessManager providerBusinessManager;

	public ProviderBusinessController(ProviderBusinessManager providerBusinessManager) {
		this.providerBusinessManager = providerBusinessManager;
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Registrar negocio", description = "Permite al proveedor autenticado registrar su negocio.")
	public ProviderResponse create(
			@AuthenticationPrincipal AppUser user,
			@Valid @ModelAttribute ProviderBusinessRequest request,
			@RequestPart("images") List<MultipartFile> images) {
		return providerBusinessManager.create(user, request, images);
	}

	@GetMapping
	@Operation(summary = "Listar mis negocios", description = "Devuelve los negocios del proveedor autenticado.")
	public List<ProviderResponse> listMyBusinesses(@AuthenticationPrincipal AppUser user) {
		return providerBusinessManager.listMyBusinesses(user);
	}

	@PutMapping(value = "/{businessId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "Actualizar negocio", description = "Permite al proveedor autenticado actualizar uno de sus negocios.")
	public ProviderResponse update(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long businessId,
			@Valid @ModelAttribute ProviderBusinessRequest request,
			@RequestPart(value = "images", required = false) List<MultipartFile> images) {
		return providerBusinessManager.update(user, businessId, request, images);
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
