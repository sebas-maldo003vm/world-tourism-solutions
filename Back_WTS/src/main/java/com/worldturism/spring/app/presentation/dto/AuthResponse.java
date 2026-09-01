package com.worldturism.spring.app.presentation.dto;

public record AuthResponse(
		String token,
		String tokenType,
		UserResponse user) {
}
