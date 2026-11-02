package com.worldturism.spring.app.presentation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Solicitud del proveedor para iniciar o recuperar el chat con un cliente
 * ({@code CLIENT_TO_PROVIDER}).
 */
public record StartClientConversationRequest(
		@NotNull Long clientUserId,
		/** Si es null, se usa el primer {@code ProviderProfile} del proveedor autenticado. */
		Long providerProfileId,
		@Size(max = 500) String initialMessage) {
}
