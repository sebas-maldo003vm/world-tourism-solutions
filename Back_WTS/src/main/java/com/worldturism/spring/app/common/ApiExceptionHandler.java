package com.worldturism.spring.app.common;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
		Map<String, String> errors = new LinkedHashMap<>();
		exception.getBindingResult().getFieldErrors()
				.forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

		return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, "Datos invalidos", errors));
	}

	@ExceptionHandler({ IllegalArgumentException.class, BadCredentialsException.class })
	public ResponseEntity<Map<String, Object>> handleBadRequest(RuntimeException exception) {
		if (exception instanceof BadCredentialsException) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(body(HttpStatus.UNAUTHORIZED, "Correo o contrasena invalidos.", null));
		}

		return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, exception.getMessage(), null));
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
