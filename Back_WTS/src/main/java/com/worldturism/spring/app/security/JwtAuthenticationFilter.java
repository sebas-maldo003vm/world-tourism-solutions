package com.worldturism.spring.app.security;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtService jwtService;
	private final UserRepository userRepository;

	public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
		this.jwtService = jwtService;
		this.userRepository = userRepository;
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		String token = extractToken(request);

		try {
			if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
				String email = jwtService.extractUsername(token);
				AppUser user = userRepository.findByEmail(email).orElse(null);

				if (user != null && jwtService.isTokenValid(token, user)) {
					UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
							user,
							null,
							user.getAuthorities());
					authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
					SecurityContextHolder.getContext().setAuthentication(authentication);
				}
			}
		} catch (JwtException | IllegalArgumentException ignored) {
			SecurityContextHolder.clearContext();
		}

		filterChain.doFilter(request, response);
	}

	private String extractToken(HttpServletRequest request) {
		String authorizationHeader = request.getHeader("Authorization");
		if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
			return null;
		}
		return authorizationHeader.substring(7);
	}
}
