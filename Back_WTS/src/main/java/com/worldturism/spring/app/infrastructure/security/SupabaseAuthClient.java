package com.worldturism.spring.app.infrastructure.security;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
public class SupabaseAuthClient {

	private static final Logger log = LoggerFactory.getLogger(SupabaseAuthClient.class);
	private static final ParameterizedTypeReference<Map<String, Object>> JSON_OBJECT =
			new ParameterizedTypeReference<>() {};

	private final RestClient restClient;
	private final String anonKey;
	private final String serviceRoleKey;

	public SupabaseAuthClient(
			@Qualifier("supabaseRestClient") RestClient restClient,
			@Value("${app.supabase.anon-key:}") String anonKey,
			@Value("${app.supabase.service-role-key:}") String serviceRoleKey) {
		this.restClient = restClient;
		this.anonKey = anonKey == null ? "" : anonKey.trim();
		this.serviceRoleKey = serviceRoleKey == null ? "" : serviceRoleKey.trim();
	}

	public UUID createConfirmedUser(String email, String password, String name, String phoneNumber, String role) {
		requireServiceRoleKey();

		Map<String, Object> metadata = new LinkedHashMap<>();
		metadata.put("name", name);
		metadata.put("phone", phoneNumber);
		metadata.put("role", role);

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("email", email);
		body.put("password", password);
		body.put("email_confirm", true);
		body.put("user_metadata", metadata);

		try {
			Map<String, Object> created = restClient.post()
					.uri("/auth/v1/admin/users")
					.header("apikey", serviceRoleKey)
					.header("Authorization", "Bearer " + serviceRoleKey)
					.contentType(MediaType.APPLICATION_JSON)
					.body(body)
					.retrieve()
					.body(JSON_OBJECT);
			return readAuthUserId(created);
		} catch (RestClientResponseException exception) {
			throw translateAdminCreateFailure(exception);
		} catch (RestClientException exception) {
			log.error("No se pudo contactar a Supabase Auth durante el registro", exception);
			throw new IllegalArgumentException(
					"No se pudo registrar el usuario en Supabase Auth. Intentalo de nuevo.");
		}
	}

	public void deleteUser(UUID authUserId) {
		if (authUserId == null) {
			return;
		}
		requireServiceRoleKey();
		try {
			restClient.delete()
					.uri("/auth/v1/admin/users/{id}?should_soft_delete=false", authUserId)
					.header("apikey", serviceRoleKey)
					.header("Authorization", "Bearer " + serviceRoleKey)
					.retrieve()
					.toBodilessEntity();
		} catch (RestClientResponseException exception) {
			if (exception.getStatusCode().value() == 404) {
				return;
			}
			log.error("Supabase Auth rechazo eliminar el usuario {}", authUserId, exception);
			throw new IllegalStateException("No se pudo eliminar el usuario huerfano de Supabase Auth.");
		} catch (RestClientException exception) {
			log.error("No se pudo contactar a Supabase Auth para eliminar {}", authUserId, exception);
			throw new IllegalStateException("No se pudo eliminar el usuario huerfano de Supabase Auth.");
		}
	}

	/**
	 * Resuelve el UUID de Supabase Auth a partir del access token de recuperacion.
	 * La identidad de dominio se busca despues por {@code auth_user_id}.
	 */
	public UUID requireAuthUserId(String accessToken, String expectedEmail) {
		if (anonKey.isBlank()) {
			throw new IllegalArgumentException(
					"No se pudo verificar la sesion: falta app.supabase.anon-key.");
		}
		if (accessToken == null || accessToken.isBlank()) {
			throw new IllegalArgumentException("La sesion de recuperacion no es valida.");
		}
		String normalizedEmail = expectedEmail == null ? "" : expectedEmail.trim().toLowerCase();
		if (normalizedEmail.isBlank()) {
			throw new IllegalArgumentException("El correo no coincide con la sesion de recuperacion.");
		}

		try {
			Map<String, Object> user = restClient.get()
					.uri("/auth/v1/user")
					.header("apikey", anonKey)
					.header("Authorization", "Bearer " + accessToken.trim())
					.retrieve()
					.body(JSON_OBJECT);

			String email = text(user == null ? null : user.get("email")).toLowerCase();
			String rawId = text(user == null ? null : user.get("id"));
			if (email.isBlank() || rawId.isBlank()) {
				throw new IllegalArgumentException(
						"No se pudo verificar el usuario de la sesion de recuperacion.");
			}
			if (!email.equals(normalizedEmail)) {
				throw new IllegalArgumentException("El correo no coincide con la sesion de recuperacion.");
			}
			return parseAuthUserId(rawId);
		} catch (IllegalArgumentException exception) {
			throw exception;
		} catch (RestClientResponseException exception) {
			throw new IllegalArgumentException("La sesion de recuperacion expiro o no es valida.");
		} catch (RestClientException exception) {
			log.error("No se pudo consultar la sesion de Supabase Auth", exception);
			throw new IllegalArgumentException("No se pudo verificar la sesion de recuperacion.");
		}
	}

	private void requireServiceRoleKey() {
		if (serviceRoleKey.isBlank()) {
			throw new IllegalArgumentException(
					"No se pudo completar el registro: falta app.supabase.service-role-key.");
		}
	}

	private UUID readAuthUserId(Map<String, Object> body) {
		if (body == null || body.isEmpty()) {
			throw new IllegalStateException("Supabase Auth no devolvio el usuario creado.");
		}
		String rawId = text(body.get("id"));
		if (rawId.isBlank() && body.get("user") instanceof Map<?, ?> nestedUser) {
			rawId = text(nestedUser.get("id"));
		}
		if (rawId.isBlank()) {
			throw new IllegalStateException("Supabase Auth no devolvio el identificador del usuario.");
		}
		return parseAuthUserId(rawId);
	}

	private static String text(Object value) {
		return value == null ? "" : value.toString().trim();
	}

	private UUID parseAuthUserId(String rawId) {
		try {
			return UUID.fromString(rawId);
		} catch (IllegalArgumentException exception) {
			throw new IllegalArgumentException("Supabase Auth devolvio un identificador invalido.");
		}
	}

	private RuntimeException translateAdminCreateFailure(RestClientResponseException exception) {
		int status = exception.getStatusCode().value();
		String body = exception.getResponseBodyAsString();
		String lower = body == null ? "" : body.toLowerCase();
		log.warn("Supabase Auth admin respondio HTTP {} al crear el usuario", status);

		if (lower.contains("already") || lower.contains("email_exists") || lower.contains("user_already_exists")) {
			return new IllegalArgumentException("Ya existe un usuario registrado con ese correo.");
		}
		if (lower.contains("password")) {
			return new IllegalArgumentException("La contrasena no cumple los requisitos de Supabase Auth.");
		}
		if (status == 401 || status == 403) {
			return new IllegalArgumentException(
					"No se pudo completar el registro: la clave de servicio de Supabase fue rechazada.");
		}
		return new IllegalArgumentException(
				"No se pudo registrar el usuario en Supabase Auth. Intentalo de nuevo.");
	}
}
