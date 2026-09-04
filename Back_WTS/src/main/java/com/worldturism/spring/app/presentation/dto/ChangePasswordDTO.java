package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordDTO(
		@NotBlank(message = "La contrasena actual es obligatoria")
		String currentPassword,

		@NotBlank(message = "La nueva contrasena es obligatoria")
		@Size(min = 8, message = "La nueva contrasena debe tener minimo 8 caracteres")
		String newPassword) {
}
