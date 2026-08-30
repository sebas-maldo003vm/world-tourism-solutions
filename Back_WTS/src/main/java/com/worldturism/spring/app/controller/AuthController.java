package com.worldturism.spring.app.controller;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.service.AuthService;
import com.worldturism.spring.app.view.dto.AuthResponse;
import com.worldturism.spring.app.view.dto.LoginRequest;
import com.worldturism.spring.app.view.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
	@Operation(summary = "Registrar usuario", description = "Permite registrar usuarios con rol USER o PROVIDER.")
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	@Operation(summary = "Iniciar sesion", description = "Autentica con correo y contrasena, y devuelve un token JWT.")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}
	

	@GetMapping("/me")
	@Operation(summary = "Consultar usuario actual", description = "Devuelve el usuario asociado al token JWT enviado.")
	public AuthResponse me(@AuthenticationPrincipal AppUser user) {
		return authService.currentUser(user);
	}
}
