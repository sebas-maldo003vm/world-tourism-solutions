package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.infrastructure.persistence.repository.UserRepository;
import com.worldturism.spring.app.infrastructure.storage.ImageStorageService;
import com.worldturism.spring.app.infrastructure.storage.SupabasePublicUrlValidator;
import com.worldturism.spring.app.presentation.dto.ChangePasswordDTO;
import com.worldturism.spring.app.presentation.dto.ProfilePictureResponse;
import com.worldturism.spring.app.presentation.dto.UpdateProfileDTO;
import com.worldturism.spring.app.presentation.dto.UserProfileDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserProfileService {

	private final UserRepository userRepository;
	private final ImageStorageService imageStorageService;
	private final SupabasePublicUrlValidator supabasePublicUrlValidator;
	private final PasswordEncoder passwordEncoder;

	public UserProfileService(
			UserRepository userRepository,
			ImageStorageService imageStorageService,
			SupabasePublicUrlValidator supabasePublicUrlValidator,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.imageStorageService = imageStorageService;
		this.supabasePublicUrlValidator = supabasePublicUrlValidator;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public UserProfileDTO getMyProfile(AppUser user) {
		AppUser managed = requireUser(user);
		return UserProfileDTO.from(managed);
	}

	@Transactional
	public UserProfileDTO updateProfile(AppUser user, UpdateProfileDTO request) {
		AppUser managed = requireUser(user);
		managed.setName(request.name().trim());
		managed.setPhoneNumber(request.phoneNumber().trim());
		return UserProfileDTO.from(userRepository.save(managed));
	}

	@Transactional
	public ProfilePictureResponse uploadProfilePicture(AppUser user, MultipartFile file) {
		AppUser managed = requireUser(user);

		String previousUrl = managed.getProfilePictureUrl();
		String profilePictureUrl = imageStorageService.storeProfilePicture(file);
		managed.setProfilePictureUrl(profilePictureUrl);
		userRepository.save(managed);

		if (previousUrl != null && !previousUrl.equals(profilePictureUrl)) {
			imageStorageService.deleteStoredImagePublic(previousUrl);
		}

		return new ProfilePictureResponse(profilePictureUrl);
	}

	@Transactional
	public ProfilePictureResponse updateProfilePictureUrl(AppUser user, String profilePictureUrl) {
		AppUser managed = requireUser(user);
		String publicUrl = supabasePublicUrlValidator.requireProfilePictureUrl(profilePictureUrl);

		String previousUrl = managed.getProfilePictureUrl();
		managed.setProfilePictureUrl(publicUrl);
		userRepository.save(managed);

		if (previousUrl != null && !previousUrl.equals(publicUrl)) {
			imageStorageService.deleteStoredImagePublic(previousUrl);
		}

		return new ProfilePictureResponse(publicUrl);
	}

	@Transactional
	public void changePassword(AppUser user, ChangePasswordDTO request) {
		AppUser managed = requireUser(user);

		if (!passwordEncoder.matches(request.currentPassword(), managed.getPassword())) {
			throw new IllegalArgumentException("La contrasena actual es incorrecta.");
		}

		managed.setPassword(passwordEncoder.encode(request.newPassword()));
		userRepository.save(managed);
	}

	private AppUser requireUser(AppUser user) {
		if (user == null || user.getId() == null) {
			throw new IllegalArgumentException("Token invalido o usuario no autenticado.");
		}

		return userRepository.findById(user.getId())
				.orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
	}
}
