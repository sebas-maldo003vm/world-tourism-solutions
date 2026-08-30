package com.worldturism.spring.app.view.dto;

import com.worldturism.spring.app.model.ServiceCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record TourServiceRequest(
		@NotBlank(message = "El titulo es obligatorio")
		@Size(max = 150, message = "El titulo no puede superar 150 caracteres")
		String title,

		@NotBlank(message = "La descripcion es obligatoria")
		@Size(max = 2000, message = "La descripcion no puede superar 2000 caracteres")
		String description,

		@NotNull(message = "La categoria es obligatoria")
		ServiceCategory category,

		@NotNull(message = "El precio es obligatorio")
		@DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a cero")
		BigDecimal price,

		@Size(max = 200, message = "La ubicacion no puede superar 200 caracteres")
		String location,

		@Size(max = 20, message = "La latitud no puede superar 20 caracteres")
		String latitude,

		@Size(max = 20, message = "La longitud no puede superar 20 caracteres")
		String longitude,

		@Size(max = 300, message = "La imagen no puede superar 300 caracteres")
		String imageUrl) {
}
