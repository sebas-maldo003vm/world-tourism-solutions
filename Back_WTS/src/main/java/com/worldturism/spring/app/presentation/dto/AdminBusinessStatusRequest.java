package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.ServiceStatus;
import jakarta.validation.constraints.NotNull;

public record AdminBusinessStatusRequest(
		@NotNull(message = "El estado es obligatorio")
		ServiceStatus status) {
}
