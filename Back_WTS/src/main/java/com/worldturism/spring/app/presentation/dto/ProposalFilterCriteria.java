package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * Criterios de filtrado del catálogo. El radio solo se aplica si también llega el origen.
 */
public record ProposalFilterCriteria(
		@Size(max = 120, message = "La busqueda admite como maximo 120 caracteres")
		String search,

		List<@Size(max = 80) String> categories,

		@Size(max = 100, message = "La ubicacion admite como maximo 100 caracteres")
		String location,

		@Min(value = 1, message = "El radio minimo es 1 km")
		@Max(value = 100, message = "El radio maximo es 100 km")
		Integer radiusKm,

		@DecimalMin(value = "-90.0", message = "La latitud de origen no es valida")
		@DecimalMax(value = "90.0", message = "La latitud de origen no es valida")
		Double originLatitude,

		@DecimalMin(value = "-180.0", message = "La longitud de origen no es valida")
		@DecimalMax(value = "180.0", message = "La longitud de origen no es valida")
		Double originLongitude,

		@DecimalMin(value = "0.0", message = "El precio minimo no puede ser negativo")
		BigDecimal priceMin,

		@DecimalMin(value = "0.0", message = "El precio maximo no puede ser negativo")
		BigDecimal priceMax,

		@DecimalMin(value = "0.0", message = "La calificacion minima no es valida")
		@DecimalMax(value = "5.0", message = "La calificacion minima no es valida")
		Double minRating) {
}
