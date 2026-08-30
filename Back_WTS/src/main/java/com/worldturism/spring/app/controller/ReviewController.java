package com.worldturism.spring.app.controller;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.service.ReviewService;
import com.worldturism.spring.app.view.dto.ReviewRequest;
import com.worldturism.spring.app.view.dto.ReviewResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
@Tag(name = "Resenas", description = "Creacion y consulta de resenas de negocios reservados.")
public class ReviewController {

	private final ReviewService reviewService;

	public ReviewController(ReviewService reviewService) {
		this.reviewService = reviewService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Crear resena", description = "Permite al usuario dejar una resena sobre un negocio reservado y aprobado.")
	public ReviewResponse create(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody ReviewRequest request) {
		return reviewService.create(user, request);
	}

	@GetMapping("/me")
	@Operation(summary = "Listar mis resenas", description = "Devuelve las resenas creadas por el usuario autenticado.")
	public List<ReviewResponse> listMyReviews(@AuthenticationPrincipal AppUser user) {
		return reviewService.listMyReviews(user);
	}

	@GetMapping("/businesses/{businessId}")
	@Operation(summary = "Listar resenas de un negocio", description = "Devuelve las resenas asociadas a un negocio.")
	public List<ReviewResponse> listByBusiness(@PathVariable Long businessId) {
		return reviewService.listByBusiness(businessId);
	}
}
