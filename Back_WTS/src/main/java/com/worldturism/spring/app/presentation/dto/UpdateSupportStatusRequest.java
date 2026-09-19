package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.SupportStatus;
import com.worldturism.spring.app.domain.model.SupportUrgency;

/**
 * Actualización de ticket reservada a {@code ADMIN} y {@code SUPPORT}.
 * Al menos uno de los campos debe venir informado.
 */
public record UpdateSupportStatusRequest(
		SupportStatus status,
		SupportUrgency urgency) {
}
