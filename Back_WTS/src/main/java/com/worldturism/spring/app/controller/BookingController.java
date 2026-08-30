package com.worldturism.spring.app.controller;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.service.BookingService;
import com.worldturism.spring.app.view.dto.BookingRequest;
import com.worldturism.spring.app.view.dto.BookingResponse;
import com.worldturism.spring.app.view.dto.ItineraryResponse;
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
@RequestMapping("/api/bookings")
@Tag(name = "Reservas", description = "Creacion y consulta de reservas del usuario autenticado.")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear reserva", description = "Permite al usuario autenticado reservar un servicio.")
    public BookingResponse create(
            @AuthenticationPrincipal AppUser user,
            @Valid @RequestBody BookingRequest request) {
        return bookingService.create(user, request);
    }

    @GetMapping
    @Operation(summary = "Listar mis reservas", description = "Devuelve las reservas creadas por el usuario autenticado.")
    public List<BookingResponse> listMyBookings(@AuthenticationPrincipal AppUser user) {
        return bookingService.listMyBookings(user);
    }

    @GetMapping("/itinerary")
    @Operation(
            summary = "Ver itinerario",
            description = "Devuelve las reservas activas del usuario agrupadas por ciudad, ordenadas por fecha y hora.")
    public List<ItineraryResponse> getItinerary(@AuthenticationPrincipal AppUser user) {
        return bookingService.getItinerary(user);
    }
}