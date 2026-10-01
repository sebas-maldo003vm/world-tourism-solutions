package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.infrastructure.persistence.repository.UserRepository;
import com.worldturism.spring.app.infrastructure.security.JwtService;
import com.worldturism.spring.app.infrastructure.security.SupabaseAuthClient;
import com.worldturism.spring.app.presentation.dto.AuthResponse;
import com.worldturism.spring.app.presentation.dto.LoginRequest;
import com.worldturism.spring.app.presentation.dto.RegisterRequest;
import com.worldturism.spring.app.presentation.dto.ResetPasswordRequest;
import com.worldturism.spring.app.presentation.dto.UserResponse;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class AuthService {

	private static final Logger log = LoggerFactory.getLogger(AuthService.class);

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;
	private final SupabaseAuthClient supabaseAuthClient;

	public AuthService(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			AuthenticationManager authenticationManager,
			SupabaseAuthClient supabaseAuthClient) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.authenticationManager = authenticationManager;
		this.supabaseAuthClient = supabaseAuthClient;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (request.role() == Role.ADMIN || request.role() == Role.SUPPORT) {
			throw new IllegalArgumentException(
					"No se puede registrar un administrador o soporte desde el formulario publico.");
		}

		String email = request.email().trim().toLowerCase();
		if (userRepository.existsByEmail(email)) {
			throw new IllegalArgumentException("Ya existe un usuario registrado con ese correo.");
		}

		AppUser user = new AppUser();
		user.setName(request.name());
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(request.password()));
		user.setPhoneNumber(request.phoneNumber());
		user.setRole(request.role());

		AppUser savedUser = userRepository.saveAndFlush(user);
		UUID authUserId = supabaseAuthClient.createConfirmedUser(
				email,
				request.password(),
				savedUser.getName(),
				savedUser.getPhoneNumber(),
				savedUser.getRole().name());
		deleteAuthUserIfTransactionRollsBack(savedUser, authUserId);

		savedUser.setAuthUserId(authUserId);
		userRepository.saveAndFlush(savedUser);
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

	@Transactional
	public void resetPassword(ResetPasswordRequest request) {
		String requestedEmail = request.email().trim().toLowerCase();
		UUID authUserId = supabaseAuthClient.requireAuthUserId(request.accessToken(), requestedEmail);

		AppUser user = userRepository.findByAuthUserId(authUserId)
				.orElseThrow(() -> new IllegalArgumentException(
						"No existe un usuario vinculado a esta sesion de recuperacion."));
		if (!requestedEmail.equals(user.getEmail())) {
			throw new IllegalArgumentException("El correo no coincide con la sesion de recuperacion.");
		}

		user.setPassword(passwordEncoder.encode(request.newPassword()));
		userRepository.save(user);
	}

	private void deleteAuthUserIfTransactionRollsBack(AppUser savedUser, UUID authUserId) {
		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			supabaseAuthClient.deleteUser(authUserId);
			userRepository.delete(savedUser);
			throw new IllegalStateException("El registro requiere una transaccion activa.");
		}

		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCompletion(int status) {
				if (status == TransactionSynchronization.STATUS_COMMITTED) {
					return;
				}
				try {
					log.warn(
							"El alta local no quedo confirmada (status {}). Se elimina el usuario de Supabase Auth {}",
							status,
							authUserId);
					supabaseAuthClient.deleteUser(authUserId);
				} catch (RuntimeException exception) {
					log.error("No se pudo eliminar el usuario huerfano de Supabase Auth {}", authUserId, exception);
				}
			}
		});
	}

	private AuthResponse buildAuthResponse(AppUser user) {
		String token = jwtService.generateToken(user);
		return new AuthResponse(token, "Bearer", UserResponse.from(user));
	}
}
