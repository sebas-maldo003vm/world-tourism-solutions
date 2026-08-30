package com.worldturism.spring.app.view.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record BookingRequest(
        @NotNull(message = "El negocio es obligatorio")
        Long businessId,

        @NotNull(message = "La fecha de reserva es obligatoria")
        @FutureOrPresent(message = "La fecha de reserva no puede estar en el pasado")
        LocalDate bookingDate,

        LocalTime startTime,

        LocalTime endTime,

        @NotNull(message = "El numero de personas es obligatorio")
        @Min(value = 1, message = "La reserva debe ser para al menos una persona")
        Integer numPeople) {
}