package com.worldturism.spring.app.view.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProviderBusinessRequest(
		@NotBlank(message = "El nombre del negocio es obligatorio")
		@Size(max = 150, message = "El nombre del negocio no puede superar 150 caracteres")
		String businessName,

		@Size(max = 60, message = "El NIT o identificacion fiscal no puede superar 60 caracteres")
		String taxId,

		@NotBlank(message = "La descripcion es obligatoria")
		@Size(max = 1000, message = "La descripcion no puede superar 1000 caracteres")
		String description,

		@NotBlank(message = "La ubicacion es obligatoria")
		@Size(max = 200, message = "La ubicacion no puede superar 200 caracteres")
		String location,

		@NotBlank(message = "La ciudad es obligatoria")
		@Size(max = 100, message = "La ciudad no puede superar 100 caracteres")
		String city,

		@Size(max = 80, message = "La categoria no puede superar 80 caracteres")
		String category,

		@NotBlank(message = "El precio es obligatorio")
		String price,

		@Size(max = 200, message = "El sitio web no puede superar 200 caracteres")
		String website) {
}
