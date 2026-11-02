package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.UserProfileService;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.presentation.dto.ChangePasswordDTO;
import com.worldturism.spring.app.presentation.dto.ProfilePictureResponse;
import com.worldturism.spring.app.presentation.dto.ProfilePictureUrlRequest;
import com.worldturism.spring.app.presentation.dto.UpdateProfileDTO;
import com.worldturism.spring.app.presentation.dto.UserProfileDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/profile")
@Tag(name = "Perfil de usuario", description = "Consulta y edicion del perfil del usuario autenticado.")
public class UserController {

	private final UserProfileService userProfileService;

	public UserController(UserProfileService userProfileService) {
		this.userProfileService = userProfileService;
	}

	@GetMapping("/me")
	@Operation(summary = "Obtener mi perfil", description = "Devuelve los datos del usuario autenticado.")
	public UserProfileDTO getMyProfile(@AuthenticationPrincipal AppUser user) {
		return userProfileService.getMyProfile(user);
	}

	@PutMapping
	@Operation(summary = "Actualizar perfil", description = "Actualiza nombre y telefono del usuario autenticado.")
	public UserProfileDTO updateProfile(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody UpdateProfileDTO request) {
		return userProfileService.updateProfile(user, request);
	}

	@PostMapping(value = "/picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "Subir foto de perfil", description = "Guarda la imagen en /uploads/profiles/ y actualiza profilePictureUrl.")
	public ProfilePictureResponse uploadProfilePicture(
			@AuthenticationPrincipal AppUser user,
			@RequestParam("file") MultipartFile file) {
		return userProfileService.uploadProfilePicture(user, file);
	}

	@PutMapping("/picture")
	@Operation(summary = "Actualizar foto de perfil", description = "Guarda la URL publica de Supabase Storage en users.profile_picture_url.")
	public ProfilePictureResponse updateProfilePicture(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody ProfilePictureUrlRequest request) {
		return userProfileService.updateProfilePictureUrl(user, request.profilePictureUrl());
	}

	@PutMapping("/password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Cambiar contrasena", description = "Valida la contrasena actual y actualiza la nueva clave del usuario autenticado.")
	public void changePassword(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody ChangePasswordDTO request) {
		userProfileService.changePassword(user, request);
	}
}
