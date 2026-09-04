package com.worldturism.spring.app.domain.model;

public enum SupportStatus {
	/** Ticket abierto sin asesor asignado (cola de soporte). */
	UNASSIGNED,
	/** Compatibilidad: ticket creado por flujo legacy. */
	OPEN,
	IN_PROGRESS,
	NEEDS_HUMAN_SUPPORT,
	RESOLVED,
	CLOSED
}
