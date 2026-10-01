package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.PublicBusinessManager;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.presentation.dto.PublicBusinessResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/businesses")
@Tag(name = "Negocios publicos", description = "Consulta publica de negocios registrados por proveedores.")
public class PublicBusinessController {

	private final PublicBusinessManager publicBusinessManager;

	public PublicBusinessController(PublicBusinessManager publicBusinessManager) {
		this.publicBusinessManager = publicBusinessManager;
	}

	@GetMapping
	@Operation(summary = "Listar negocios", description = "Devuelve los negocios registrados por proveedores sin requerir login.")
	public List<PublicBusinessResponse> listAll() {
		return publicBusinessManager.listAll();
	}

	@GetMapping("/{businessId}")
	@Operation(
			summary = "Consultar negocio",
			description = "Devuelve el detalle de un negocio. Visitantes y turistas solo ven servicios APPROVED. "
					+ "El proveedor dueño y un administrador pueden ver el servicio en cualquier estado.")
	public PublicBusinessResponse getById(
			@PathVariable Long businessId,
			@AuthenticationPrincipal AppUser currentUser) {
		return publicBusinessManager.getById(businessId, currentUser);
	}
}
