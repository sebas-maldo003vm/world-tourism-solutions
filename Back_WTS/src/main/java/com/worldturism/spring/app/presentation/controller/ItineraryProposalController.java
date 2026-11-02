package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.ItineraryProposalService;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.presentation.dto.ItineraryProposalRequest;
import com.worldturism.spring.app.presentation.dto.ItineraryProposalResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/itineraries/proposals")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Propuestas de itinerario", description = "Propuestas informativas de un dia. No crean reservas ni pagos.")
public class ItineraryProposalController {

	private final ItineraryProposalService itineraryProposalService;

	public ItineraryProposalController(ItineraryProposalService itineraryProposalService) {
		this.itineraryProposalService = itineraryProposalService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(
			summary = "Generar propuesta de un dia",
			description = "Sortea 1 hospedaje, 2 restaurantes y 2 actividades entre perfiles APPROVED "
					+ "que cumplen los filtros. Persiste Itinerary e ItineraryItem en estado PROPOSED. "
					+ "No crea bookings.")
	public ItineraryProposalResponse generate(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody ItineraryProposalRequest request) {
		return itineraryProposalService.generate(user, request);
	}

	@GetMapping
	@Operation(
			summary = "Listar mis propuestas",
			description = "Devuelve las propuestas del turista autenticado. "
					+ "El query param opcional date (yyyy-MM-dd) limita ese dia. "
					+ "No incluye las reservas del calendario.")
	public List<ItineraryProposalResponse> list(
			@AuthenticationPrincipal AppUser user,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return itineraryProposalService.list(user, date);
	}

	@PostMapping("/{proposalId}/accept")
	@Operation(summary = "Aceptar propuesta", description = "Pasa la propuesta de PROPOSED a ACCEPTED. No crea una reserva.")
	public ItineraryProposalResponse accept(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long proposalId) {
		return itineraryProposalService.accept(user, proposalId);
	}

	@PostMapping("/{proposalId}/cancel")
	@Operation(summary = "Cancelar propuesta", description = "Marca la propuesta como CANCELLED. No toca reservas ni pagos.")
	public ItineraryProposalResponse cancel(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long proposalId) {
		return itineraryProposalService.cancel(user, proposalId);
	}
}
