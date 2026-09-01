package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.PublicServiceManager;
import com.worldturism.spring.app.presentation.dto.TourServiceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/services")
@Tag(name = "Servicios publicos")
public class PublicServiceController {

	private final PublicServiceManager publicServiceManager;

	public PublicServiceController(
			PublicServiceManager publicServiceManager) {
		this.publicServiceManager = publicServiceManager;
	}

	@GetMapping
	@Operation(summary = "Listar servicios")
	public List<TourServiceResponse> listAll() {
		return publicServiceManager.listAll();
	}
}