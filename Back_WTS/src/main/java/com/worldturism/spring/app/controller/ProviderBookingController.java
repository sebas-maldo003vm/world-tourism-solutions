package com.worldturism.spring.app.controller;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.service.BookingService;
import com.worldturism.spring.app.view.dto.BookingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/provider/bookings")
@Tag(name = "Reservas del proveedor", description = "Consulta y respuesta de reservas hechas a negocios del proveedor.")
public class ProviderBookingController {

	private final BookingService bookingService;

	public ProviderBookingController(BookingService bookingService) {
		this.bookingService = bookingService;
	}

	@GetMapping
	@Operation(summary = "Listar reservas de mis negocios", description = "Devuelve las reservas hechas a los negocios del proveedor autenticado.")
	public List<BookingResponse> listProviderBookings(@AuthenticationPrincipal AppUser user) {
		return bookingService.listProviderBookings(user);
	}

	@PostMapping("/{bookingId}/approve")
	@Operation(summary = "Aprobar reserva", description = "Permite al proveedor aprobar una reserva pendiente.")
	public BookingResponse approve(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long bookingId) {
		return bookingService.approve(user, bookingId);
	}

	@PostMapping("/{bookingId}/reject")
	@Operation(summary = "Rechazar reserva", description = "Permite al proveedor rechazar una reserva pendiente.")
	public BookingResponse reject(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long bookingId) {
		return bookingService.reject(user, bookingId);
	}
}
