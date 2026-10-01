package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
		@NotBlank(message = "El correo es obligatorio")
		@Email(message = "El correo no tiene un formato valido")
		String email,

		@NotBlank(message = "La nueva contrasena es obligatoria")
		@Size(min = 8, max = 72, message = "La nueva contrasena debe tener entre 8 y 72 caracteres")
		String newPassword,

		@NotBlank(message = "La sesion de recuperacion es obligatoria")
		String accessToken) {
}
