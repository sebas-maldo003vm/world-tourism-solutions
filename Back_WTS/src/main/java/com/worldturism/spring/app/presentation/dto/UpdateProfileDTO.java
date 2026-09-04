package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileDTO(
		@NotBlank(message = "El nombre es obligatorio")
		@Size(max = 120, message = "El nombre no puede superar 120 caracteres")
		String name,

		@NotBlank(message = "El telefono es obligatorio")
		@Size(max = 30, message = "El telefono no puede superar 30 caracteres")
		String phoneNumber) {
}
