package com.worldturism.spring.app.controller;

import com.worldturism.spring.app.service.PublicBusinessManager;
import com.worldturism.spring.app.view.dto.ProviderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
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
	public List<ProviderResponse> listAll() {
		return publicBusinessManager.listAll();
	}

	@GetMapping("/{businessId}")
	@Operation(summary = "Consultar negocio", description = "Devuelve el detalle de un negocio sin requerir login.")
	public ProviderResponse getById(@PathVariable Long businessId) {
		return publicBusinessManager.getById(businessId);
	}
}
