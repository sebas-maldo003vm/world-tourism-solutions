package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Favorite;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.infrastructure.persistence.repository.FavoriteRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.presentation.dto.FavoriteResponse;
import com.worldturism.spring.app.presentation.dto.FavoriteStatusResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {

	private final FavoriteRepository favoriteRepository;
	private final ProviderProfileRepository providerProfileRepository;

	public FavoriteService(
			FavoriteRepository favoriteRepository,
			ProviderProfileRepository providerProfileRepository) {
		this.favoriteRepository = favoriteRepository;
		this.providerProfileRepository = providerProfileRepository;
	}

	@Transactional
	public FavoriteResponse agregarFavorito(Long providerProfileId) {
		AppUser user = requireAuthenticatedTourist();

		return favoriteRepository.findByUserIdAndProviderProfileId(user.getId(), providerProfileId)
				.map(FavoriteResponse::from)
				.orElseGet(() -> saveFavorite(user, providerProfileId));
	}

	@Transactional
	public void quitarFavorito(Long providerProfileId) {
		AppUser user = requireAuthenticatedTourist();

		if (!favoriteRepository.existsByUserIdAndProviderProfileId(user.getId(), providerProfileId)) {
			throw new IllegalArgumentException("El sitio no esta en tus favoritos.");
		}

		favoriteRepository.deleteByUserIdAndProviderProfileId(user.getId(), providerProfileId);
	}

	@Transactional(readOnly = true)
	public List<FavoriteResponse> obtenerFavoritosDelUsuarioAutenticado() {
		AppUser user = requireAuthenticatedTourist();

		return favoriteRepository.findByUserId(user.getId())
				.stream()
				.map(FavoriteResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public FavoriteStatusResponse esFavorito(Long providerProfileId) {
		AppUser user = requireAuthenticatedTourist();

		boolean favorite = favoriteRepository.existsByUserIdAndProviderProfileId(
				user.getId(),
				providerProfileId);
		return new FavoriteStatusResponse(providerProfileId, favorite);
	}

	private FavoriteResponse saveFavorite(AppUser user, Long providerProfileId) {
		ProviderProfile providerProfile = providerProfileRepository.findById(providerProfileId)
				.orElseThrow(() -> new IllegalArgumentException("El sitio o servicio no existe."));

		Favorite favorite = new Favorite();
		favorite.setUser(user);
		favorite.setProviderProfile(providerProfile);

		return FavoriteResponse.from(favoriteRepository.save(favorite));
	}

	private AppUser requireAuthenticatedTourist() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof AppUser user)) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
		if (user.getRole() != Role.USER) {
			throw new IllegalArgumentException("Solo los usuarios turistas pueden gestionar favoritos.");
		}
		return user;
	}
}
