package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfilePictureUrlRequest(
		@NotBlank(message = "La URL de la foto es obligatoria")
		@Size(max = 255, message = "La URL de la foto no puede superar 255 caracteres")
		String profilePictureUrl) {
}
