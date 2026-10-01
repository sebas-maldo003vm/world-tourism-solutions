package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ItineraryProposalRequest(
		@NotNull(message = "La fecha es obligatoria")
		LocalDate date,

		@Valid
		ProposalFilterCriteria filters) {
}
