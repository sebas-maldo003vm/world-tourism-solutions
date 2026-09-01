package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.SupportUrgency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSupportTicketRequest(
		@NotBlank @Size(max = 2000) String message,
		@Size(max = 150) String serviceName,
		SupportUrgency urgency) {
}
