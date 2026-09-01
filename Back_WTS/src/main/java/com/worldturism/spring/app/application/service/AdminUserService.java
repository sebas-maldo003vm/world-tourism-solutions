package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.infrastructure.persistence.repository.UserRepository;
import com.worldturism.spring.app.presentation.dto.AdminUserUpdateRequest;
import com.worldturism.spring.app.presentation.dto.UserResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

	private final UserRepository userRepository;

	public AdminUserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<UserResponse> listAll() {
		return userRepository.findAllByOrderByCreatedAtDesc()
				.stream()
				.map(UserResponse::from)
				.toList();
	}

	@Transactional
	public UserResponse update(AppUser admin, Long userId, AdminUserUpdateRequest request) {
		AppUser user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("No existe un usuario con ese id."));

		if (admin.getId().equals(userId)) {
			if (request.role() != null && request.role() != Role.ADMIN) {
				throw new IllegalArgumentException("No puedes cambiar tu propio rol de administrador.");
			}
			if (request.isActive() != null && !request.isActive()) {
				throw new IllegalArgumentException("No puedes desactivar tu propia cuenta.");
			}
		}

		if (request.name() != null) {
			user.setName(request.name().trim());
		}
		if (request.phoneNumber() != null) {
			user.setPhoneNumber(request.phoneNumber().trim());
		}
		if (request.role() != null) {
			user.setRole(request.role());
		}
		if (request.isActive() != null) {
			user.setIsActive(request.isActive());
		}

		return UserResponse.from(userRepository.save(user));
	}

	@Transactional
	public void delete(AppUser admin, Long userId) {
		if (admin.getId().equals(userId)) {
			throw new IllegalArgumentException("No puedes eliminar tu propia cuenta.");
		}

		AppUser user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("No existe un usuario con ese id."));

		userRepository.delete(user);
	}
}
