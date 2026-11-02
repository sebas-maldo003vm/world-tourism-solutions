package com.worldturism.spring.app.common;

import com.worldturism.spring.app.application.exception.InsufficientProposalCatalogException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
	private static final String GENERIC_ERROR = "Ocurrio un error interno.";

	@Override
	protected ResponseEntity<Object> handleExceptionInternal(
			Exception ex,
			Object body,
			HttpHeaders headers,
			HttpStatusCode statusCode,
			WebRequest request) {
		HttpStatus status = HttpStatus.resolve(statusCode.value());
		if (status == null) {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
		}
		if (status.is5xxServerError()) {
			log.error("Request failed", ex);
		}
		return new ResponseEntity<>(this.body(status, messageFor(status), null), headers, status);
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(
			MethodArgumentNotValidException exception,
			HttpHeaders headers,
			HttpStatusCode status,
			WebRequest request) {
		Map<String, String> errors = new LinkedHashMap<>();
		exception.getBindingResult().getFieldErrors()
				.forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

		return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, "Datos invalidos", errors));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<Map<String, Object>> handleForbidden(AccessDeniedException exception) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(body(HttpStatus.FORBIDDEN, clientSafeMessage(exception.getMessage(),
						"No tienes permiso para este recurso."), null));
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException exception) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(body(HttpStatus.UNAUTHORIZED, "Correo o contrasena invalidos.", null));
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<Map<String, Object>> handleUnauthenticated(AuthenticationException exception) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(body(HttpStatus.UNAUTHORIZED, "No autenticado.", null));
	}

	@ExceptionHandler(InsufficientProposalCatalogException.class)
	public ResponseEntity<Map<String, Object>> handleProposalQuota(InsufficientProposalCatalogException exception) {
		return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
				.body(body(HttpStatus.UNPROCESSABLE_ENTITY,
						clientSafeMessage(exception.getMessage(),
								"No hay suficientes perfiles aprobados para armar la propuesta."),
						exception.shortagesByCategory()));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException exception) {
		return ResponseEntity.badRequest()
				.body(body(HttpStatus.BAD_REQUEST,
						clientSafeMessage(exception.getMessage(), "La solicitud no es valida."), null));
	}

	@ExceptionHandler(DataAccessException.class)
	public ResponseEntity<Map<String, Object>> handleDataAccess(DataAccessException exception) {
		log.error("Database error while handling request", exception);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(body(HttpStatus.INTERNAL_SERVER_ERROR, GENERIC_ERROR, null));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleUnexpected(Exception exception) {
		log.error("Unhandled error while handling request", exception);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(body(HttpStatus.INTERNAL_SERVER_ERROR, GENERIC_ERROR, null));
	}

	private String messageFor(HttpStatus status) {
		return switch (status) {
			case BAD_REQUEST -> "La solicitud no es valida.";
			case UNAUTHORIZED -> "No autenticado.";
			case FORBIDDEN -> "No tienes permiso para este recurso.";
			case NOT_FOUND -> "Recurso no encontrado.";
			case METHOD_NOT_ALLOWED -> "Metodo no permitido.";
			case UNSUPPORTED_MEDIA_TYPE -> "Tipo de contenido no soportado.";
			case CONFLICT -> "No se pudo completar la operacion.";
			default -> status.is4xxClientError() ? "La solicitud no es valida." : GENERIC_ERROR;
		};
	}

	/**
	 * Keeps intentional business messages and drops anything that looks like a
	 * framework, SQL, or stack-trace leak.
	 */
	private String clientSafeMessage(String message, String fallback) {
		if (message == null || message.isBlank() || message.length() > 300) {
			return fallback;
		}
		String lower = message.toLowerCase();
		if (message.contains("\n")
				|| message.contains("\r")
				|| lower.contains("exception")
				|| lower.contains("sql")
				|| lower.contains("hibernate")
				|| lower.contains("jdbc")
				|| lower.contains("org.")
				|| lower.contains("stack")) {
			return fallback;
		}
		return message;
	}

	private Map<String, Object> body(HttpStatus status, String message, Object errors) {
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("timestamp", Instant.now());
		response.put("status", status.value());
		response.put("error", status.getReasonPhrase());
		response.put("message", message);
		if (errors != null) {
			response.put("errors", errors);
		}
		return response;
	}
}
