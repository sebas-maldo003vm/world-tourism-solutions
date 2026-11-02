package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Role;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminUserUpdateRequest(
		@Size(max = 120, message = "El nombre no puede superar 120 caracteres")
		String name,
		@Size(max = 30, message = "El telefono no puede superar 30 caracteres")
		String phoneNumber,
		Role role,
		Boolean isActive) {
}
