package com.worldturism.spring.app.application.exception;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * El catálogo aprobado, ya filtrado, no alcanza la cuota de una propuesta de un día.
 */
public class InsufficientProposalCatalogException extends RuntimeException {

	private final List<CategoryShortage> shortages;

	public InsufficientProposalCatalogException(List<CategoryShortage> shortages) {
		super(messageFor(shortages));
		this.shortages = List.copyOf(shortages);
	}

	public List<CategoryShortage> shortages() {
		return shortages;
	}

	public Map<String, String> shortagesByCategory() {
		Map<String, String> errors = new LinkedHashMap<>();
		for (CategoryShortage shortage : shortages) {
			errors.put(shortage.category(),
					"Se requieren " + shortage.required() + " y hay " + shortage.available() + ".");
		}
		return errors;
	}

	private static String messageFor(List<CategoryShortage> shortages) {
		StringBuilder message = new StringBuilder("No se puede generar la propuesta.");
		for (CategoryShortage shortage : shortages) {
			message.append(" Falta la categoría ")
					.append(shortage.category())
					.append(": se requieren ")
					.append(shortage.required())
					.append(" y hay ")
					.append(shortage.available())
					.append('.');
		}
		return message.toString();
	}

	public record CategoryShortage(String category, int required, int available) {
	}
}
