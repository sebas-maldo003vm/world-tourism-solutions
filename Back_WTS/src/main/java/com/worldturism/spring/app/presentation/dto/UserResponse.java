package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Role;
import java.time.Instant;

public record UserResponse(
		Long id,
		String name,
		String email,
		String phoneNumber,
		String profilePictureUrl,
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
				user.getProfilePictureUrl(),
				user.getRole(),
				user.getIsActive(),
				user.getCreatedAt(),
				user.getUpdatedAt());
	}
}
