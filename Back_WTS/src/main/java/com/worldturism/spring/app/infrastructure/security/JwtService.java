package com.worldturism.spring.app.infrastructure.security;

import com.worldturism.spring.app.domain.model.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

	private static final int MIN_KEY_BYTES = 32;

	private final SecretKey signingKey;
	private final long expirationMillis;

	public JwtService(
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration-millis}") long expirationMillis) {
		this.signingKey = buildSigningKey(secret);
		this.expirationMillis = expirationMillis;
	}

	public String generateToken(AppUser user) {
		Date now = new Date();
		Date expiration = new Date(now.getTime() + expirationMillis);

		return Jwts.builder()
				.subject(user.getUsername())
				.claim("role", user.getRole().name())
				.issuedAt(now)
				.expiration(expiration)
				.signWith(getSigningKey())
				.compact();
	}

	public String extractUsername(String token) {
		return extractAllClaims(token).getSubject();
	}

	public boolean isTokenValid(String token, UserDetails userDetails) {
		String username = extractUsername(token);
		return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
	}

	private boolean isTokenExpired(String token) {
		return extractAllClaims(token).getExpiration().before(new Date());
	}

	private Claims extractAllClaims(String token) {
		return Jwts.parser()
				.verifyWith(getSigningKey())
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	private SecretKey getSigningKey() {
		return signingKey;
	}

	private static SecretKey buildSigningKey(String secret) {
		if (secret == null || secret.isBlank()) {
			throw new IllegalStateException(
					"JWT_SECRET is required and must be a Base64-encoded key of at least 32 bytes.");
		}

		final byte[] keyBytes;
		try {
			keyBytes = Decoders.BASE64.decode(secret.trim());
		} catch (RuntimeException exception) {
			throw new IllegalStateException(
					"JWT_SECRET must be a valid Base64-encoded key of at least 32 bytes.");
		}

		if (keyBytes.length < MIN_KEY_BYTES) {
			throw new IllegalStateException("JWT_SECRET must decode to at least 32 bytes.");
		}

		return Keys.hmacShaKeyFor(keyBytes);
	}
}
