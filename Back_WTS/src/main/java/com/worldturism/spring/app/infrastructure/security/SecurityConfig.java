package com.worldturism.spring.app.infrastructure.security;

import com.worldturism.spring.app.infrastructure.persistence.repository.UserRepository;
import jakarta.servlet.DispatcherType;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http, AuthenticationProvider authenticationProvider)
			throws Exception {
		return http
				.cors(Customizer.withDefaults())
				.csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint((request, response, authException) -> {
							response.setStatus(HttpStatus.UNAUTHORIZED.value());
							response.setContentType(MediaType.APPLICATION_JSON_VALUE);
							response.getWriter().write(
									"{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"No autenticado. Se requiere JWT.\"}");
						})
						.accessDeniedHandler((request, response, accessDeniedException) -> {
							response.setStatus(HttpStatus.FORBIDDEN.value());
							response.setContentType(MediaType.APPLICATION_JSON_VALUE);
							response.getWriter().write(
									"{\"status\":403,\"error\":\"Forbidden\",\"message\":\"No tienes permiso para este recurso.\"}");
						}))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						// El dispatcher ERROR no debe exigir JWT: si no, un fallo de
						// registro/login se enmascara como 401 "Se requiere JWT".
						.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
						.requestMatchers("/error").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
						.requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
						.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
						.requestMatchers("/uploads/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/businesses/**", "/api/businesses").permitAll()
						// Asistente virtual: requiere JWT de turista (USER) o proveedor (PROVIDER)
						.requestMatchers(HttpMethod.POST, "/api/chat/message").hasAnyRole("USER", "PROVIDER")
						//Eventos para analitica 
						.requestMatchers(HttpMethod.POST, "/api/analytics/events").permitAll()
						// Soporte humano: apertura por clientes; inbox/asignación solo staff
						.requestMatchers(HttpMethod.POST, "/api/support/conversations/open")
								.hasAnyRole("USER", "PROVIDER")
						.requestMatchers(HttpMethod.PUT, "/api/support/conversations/*/assign")
								.hasAnyRole("ADMIN", "SUPPORT")
						.requestMatchers(HttpMethod.GET, "/api/support/conversations/inbox")
								.hasAnyRole("ADMIN", "SUPPORT")
						.requestMatchers("/api/support/**").hasAnyRole("ADMIN", "SUPPORT", "USER", "PROVIDER")
						// Urgencia y estado del ticket: solo mesa de ayuda
						.requestMatchers(HttpMethod.PATCH, "/api/chat/support/**").hasAnyRole("ADMIN", "SUPPORT")
						// Eliminación física y operaciones críticas — solo ADMIN
						.requestMatchers(HttpMethod.DELETE, "/api/admin/**").hasRole("ADMIN")
						// Visualización global del panel — ADMIN y SUPPORT
						.requestMatchers(HttpMethod.GET, "/api/admin/**").hasAnyRole("ADMIN", "SUPPORT")
						// Cambios de estado de negocios — ADMIN y SUPPORT
						.requestMatchers(HttpMethod.PATCH, "/api/admin/businesses/*/status").hasAnyRole("ADMIN", "SUPPORT")
						// Actualización de usuario (cambio de rol bloqueado en servicio para SUPPORT)
						.requestMatchers(HttpMethod.PUT, "/api/admin/users/**").hasAnyRole("ADMIN", "SUPPORT")
						// Resto de rutas admin — solo ADMIN
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.requestMatchers("/api/provider/**").hasAnyRole("PROVIDER", "ADMIN")
						// Favoritos: solo turista autenticado; aislamiento por userId en FavoriteService
						.requestMatchers("/api/favorites", "/api/favorites/**").hasRole("USER")
						.anyRequest().authenticated())
				.authenticationProvider(authenticationProvider)
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.build();
	}

	@Bean
	public UserDetailsService userDetailsService(UserRepository userRepository) {
		return email -> userRepository.findByEmail(email.trim().toLowerCase())
				.orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado."));
	}

	@Bean
	public AuthenticationProvider authenticationProvider(
			UserDetailsService userDetailsService,
			PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(userDetailsService);
		authenticationProvider.setPasswordEncoder(passwordEncoder);
		return authenticationProvider;
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(List.of(
				"http://localhost:3000",
				"http://localhost:4200",
				"http://localhost:5173"));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		configuration.setExposedHeaders(List.of("Authorization"));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
