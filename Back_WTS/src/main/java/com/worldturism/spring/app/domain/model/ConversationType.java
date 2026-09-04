package com.worldturism.spring.app.domain.model;

public enum ConversationType {
	/** Chat cliente ↔ proveedor (catálogo / negocio). */
	CLIENT_TO_PROVIDER,
	/** Alias semántico de consulta de catálogo (bot / catálogo). */
	CATALOG_INQUIRY,
	/** Ticket de soporte humano genérico. */
	HUMAN_SUPPORT,
	/** Ticket de soporte abierto por un turista. */
	CLIENT_TO_SUPPORT,
	/** Ticket de soporte abierto por un proveedor. */
	PROVIDER_TO_SUPPORT;

	/** Conversaciones elegibles para enrutamiento a asesor humano. */
	public boolean isHumanSupport() {
		return this == HUMAN_SUPPORT
				|| this == CLIENT_TO_SUPPORT
				|| this == PROVIDER_TO_SUPPORT;
	}
}
