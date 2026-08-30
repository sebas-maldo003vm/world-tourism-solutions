package com.worldturism.spring.app.view.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
		@NotNull(message = "El negocio es obligatorio")
		Long businessId,

		@NotNull(message = "La calificacion es obligatoria")
		@Min(value = 1, message = "La calificacion minima es 1")
		@Max(value = 5, message = "La calificacion maxima es 5")
		Integer rating,

		@Size(max = 1000, message = "El comentario no puede superar 1000 caracteres")
		String comment) {
}
