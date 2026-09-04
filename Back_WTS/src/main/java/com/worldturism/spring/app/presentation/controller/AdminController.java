package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.AdminBusinessService;
import com.worldturism.spring.app.application.service.AdminUserService;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.infrastructure.persistence.repository.UserRepository;
import com.worldturism.spring.app.presentation.dto.AdminBusinessResponse;
import com.worldturism.spring.app.presentation.dto.AdminBusinessStatusRequest;
import com.worldturism.spring.app.presentation.dto.AdminStatsResponse;
import com.worldturism.spring.app.presentation.dto.AdminUserUpdateRequest;
import com.worldturism.spring.app.presentation.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Administracion", description = "Gestion de usuarios y negocios (ADMIN; SUPPORT con acceso de solo lectura/estado).")
public class AdminController {

	private final AdminUserService adminUserService;
	private final AdminBusinessService adminBusinessService;
	private final UserRepository userRepository;

	public AdminController(
			AdminUserService adminUserService,
			AdminBusinessService adminBusinessService,
			UserRepository userRepository) {
		this.adminUserService = adminUserService;
		this.adminBusinessService = adminBusinessService;
		this.userRepository = userRepository;
	}

	@GetMapping("/stats")
	@Operation(summary = "Estadisticas del panel", description = "Totales de usuarios y negocios.")
	public AdminStatsResponse stats() {
		return new AdminStatsResponse(
				userRepository.count(),
				adminBusinessService.countAll(),
				adminBusinessService.countPending());
	}

	@GetMapping("/users")
	@Operation(summary = "Listar usuarios", description = "Devuelve todos los usuarios registrados.")
	public List<UserResponse> listUsers() {
		return adminUserService.listAll();
	}

	@PutMapping("/users/{id}")
	@Operation(summary = "Actualizar usuario", description = "Permite cambiar rol, estado o datos basicos de un usuario.")
	public UserResponse updateUser(
			@AuthenticationPrincipal AppUser admin,
			@PathVariable Long id,
			@Valid @RequestBody AdminUserUpdateRequest request) {
		return adminUserService.update(admin, id, request);
	}

	@DeleteMapping("/users/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Eliminar usuario", description = "Elimina un usuario del sistema.")
	public void deleteUser(@AuthenticationPrincipal AppUser admin, @PathVariable Long id) {
		adminUserService.delete(admin, id);
	}

	@GetMapping("/businesses")
	@Operation(summary = "Listar negocios", description = "Devuelve todos los negocios registrados por proveedores.")
	public List<AdminBusinessResponse> listBusinesses() {
		return adminBusinessService.listAll();
	}

	@PatchMapping("/businesses/{id}/status")
	@Operation(summary = "Cambiar estado de negocio", description = "Aprueba, rechaza o desactiva un negocio.")
	public AdminBusinessResponse updateBusinessStatus(
			@PathVariable Long id,
			@Valid @RequestBody AdminBusinessStatusRequest request) {
		return adminBusinessService.updateStatus(id, request);
	}

	@DeleteMapping("/businesses/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Eliminar negocio", description = "Elimina un negocio del sistema.")
	public void deleteBusiness(@PathVariable Long id) {
		adminBusinessService.delete(id);
	}
}
