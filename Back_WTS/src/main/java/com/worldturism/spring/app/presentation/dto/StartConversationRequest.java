package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StartConversationRequest(
		@NotNull Long providerProfileId,
		@Size(max = 500) String initialMessage,
		/**
		 * Nombre del servicio consultado. Se guarda en {@code subject} para mostrarlo
		 * en la cabecera del chat. No crea el hilo si el cliente aún no envía mensaje.
		 */
		@Size(max = 200) String serviceName,
		/**
		 * Id del servicio del catálogo. En este modelo coincide con el perfil del
		 * proveedor; el vínculo persistido es {@code provider_profile_id} + subject.
		 */
		Long serviceId) {
}
