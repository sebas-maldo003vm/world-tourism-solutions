package com.worldturism.spring.app.view.dto;

import com.worldturism.spring.app.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
		@NotBlank(message = "El nombre es obligatorio")
		String name,

		@NotBlank(message = "El correo es obligatorio")
		@Email(message = "El correo no tiene un formato valido")
		String email,

		@NotBlank(message = "La contrasena es obligatoria")
		@Size(min = 8, message = "La contrasena debe tener minimo 8 caracteres")
		String password,

		@NotBlank(message = "El numero es obligatorio")
		String phoneNumber,

		@NotNull(message = "El rol es obligatorio")
		Role role) {
}
