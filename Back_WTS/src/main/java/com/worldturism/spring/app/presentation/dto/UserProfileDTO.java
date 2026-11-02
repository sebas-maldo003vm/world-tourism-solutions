package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Role;

public record UserProfileDTO(
		Long id,
		String name,
		String email,
		String phoneNumber,
		Role role,
		String profilePictureUrl) {

	public static UserProfileDTO from(AppUser user) {
		return new UserProfileDTO(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getPhoneNumber(),
				user.getRole(),
				user.getProfilePictureUrl());
	}
}
