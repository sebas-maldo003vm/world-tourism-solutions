package com.worldturism.spring.app.view.dto;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.model.Role;
import java.time.Instant;

public record UserResponse(
		Long id,
		String name,
		String email,
		String phoneNumber,
		Role role,
		Boolean isActive,
		Instant createdAt,
		Instant updatedAt) {

	public static UserResponse from(AppUser user) {
		return new UserResponse(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getPhoneNumber(),
				user.getRole(),
				user.getIsActive(),
				user.getCreatedAt(),
				user.getUpdatedAt());
	}
}
