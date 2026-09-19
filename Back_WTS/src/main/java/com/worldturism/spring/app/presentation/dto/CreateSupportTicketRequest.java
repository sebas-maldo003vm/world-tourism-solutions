package com.worldturism.spring.app.presentation.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Alta de ticket de soporte. La urgencia y el estado no los elige el cliente:
 * los fija el servidor.
 */
public record CreateSupportTicketRequest(
		@NotBlank @Size(max = 200) String subject,
		@NotBlank
		@Size(max = 2000)
		@JsonAlias({"description", "message"})
		String initialMessage) {
}
