package com.worldturism.spring.app.service;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.model.Role;
import com.worldturism.spring.app.repository.UserRepository;
import com.worldturism.spring.app.security.JwtService;
import com.worldturism.spring.app.view.dto.AuthResponse;
import com.worldturism.spring.app.view.dto.LoginRequest;
import com.worldturism.spring.app.view.dto.RegisterRequest;
import com.worldturism.spring.app.view.dto.UserResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;

	public AuthService(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			AuthenticationManager authenticationManager) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.authenticationManager = authenticationManager;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (request.role() == Role.ADMIN) {
			throw new IllegalArgumentException("No se puede registrar un administrador desde el formulario publico.");
		}

		if (userRepository.existsByEmail(request.email())) {
			throw new IllegalArgumentException("Ya existe un usuario registrado con ese correo.");
		}

		AppUser user = new AppUser();
		user.setName(request.name());
		user.setEmail(request.email().trim().toLowerCase());
		user.setPassword(passwordEncoder.encode(request.password()));
		user.setPhoneNumber(request.phoneNumber());
		user.setRole(request.role());

		AppUser savedUser = userRepository.save(user);
		return buildAuthResponse(savedUser);
	}

	public AuthResponse login(LoginRequest request) {
		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password()));

		AppUser user = userRepository.findByEmail(request.email().trim().toLowerCase())
				.orElseThrow(() -> new IllegalArgumentException("Credenciales invalidas."));
		return buildAuthResponse(user);
	}

	public AuthResponse currentUser(AppUser user) {
		if (user == null) {
			throw new IllegalArgumentException("Token invalido o usuario no autenticado.");
		}
		return buildAuthResponse(user);
	}

	private AuthResponse buildAuthResponse(AppUser user) {
		String token = jwtService.generateToken(user);
		return new AuthResponse(token, "Bearer", UserResponse.from(user));
	}
}
