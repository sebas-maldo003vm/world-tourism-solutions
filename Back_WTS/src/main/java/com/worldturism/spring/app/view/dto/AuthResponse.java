package com.worldturism.spring.app.view.dto;

public record AuthResponse(
		String token,
		String tokenType,
		UserResponse user) {
}
