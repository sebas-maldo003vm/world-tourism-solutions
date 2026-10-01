package com.worldturism.spring.app.application.service;

import java.util.Locale;

/**
 * Cubos estrictos de una propuesta de un día.
 * Los alias cubren el código guardado y las etiquetas en plural del catálogo.
 */
public final class ProposalCategories {

	public static final String LODGING = "HOSPEDAJE";
	public static final String RESTAURANT = "RESTAURANTE";
	public static final String ACTIVITY = "ACTIVIDAD";

	public static final int LODGING_QUOTA = 1;
	public static final int RESTAURANT_QUOTA = 2;
	public static final int ACTIVITY_QUOTA = 2;

	private ProposalCategories() {
	}

	public static String canonical(String raw) {
		if (raw == null) {
			return null;
		}
		String value = raw.trim().toUpperCase(Locale.ROOT);
		return switch (value) {
			case "HOSPEDAJE", "ALOJAMIENTO" -> LODGING;
			case "RESTAURANTE", "RESTAURANTES" -> RESTAURANT;
			case "ACTIVIDAD", "ACTIVIDADES" -> ACTIVITY;
			default -> null;
		};
	}
}
