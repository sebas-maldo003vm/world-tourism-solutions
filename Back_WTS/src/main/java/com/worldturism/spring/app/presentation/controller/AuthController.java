package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.application.service.AuthService;
import com.worldturism.spring.app.presentation.dto.AuthResponse;
import com.worldturism.spring.app.presentation.dto.LoginRequest;
import com.worldturism.spring.app.presentation.dto.RegisterRequest;
import com.worldturism.spring.app.presentation.dto.ResetPasswordRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticacion", description = "Registro, login y datos del usuario autenticado.")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@Operation(summary = "Registrar usuario", description = "Crea la cuenta en public.users y el usuario confirmado en Supabase Auth. Roles permitidos: USER o PROVIDER.")
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	@Operation(summary = "Iniciar sesion", description = "Autentica con correo y contrasena, y devuelve un token JWT.")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@PutMapping("/reset-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Restablecer contrasena", description = "Verifica el access token con GET /auth/v1/user y actualiza users.password del registro local con ese auth_user_id.")
	public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		authService.resetPassword(request);
	}
	

	@GetMapping("/me")
	@Operation(summary = "Consultar usuario actual", description = "Devuelve el usuario asociado al token JWT enviado.")
	public AuthResponse me(@AuthenticationPrincipal AppUser user) {
		return authService.currentUser(user);
	}
}
