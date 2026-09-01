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
	public FavoriteResponse agregarFavorito(AppUser user, Long businessId) {
		validateUser(user);

		return favoriteRepository.findByUserIdAndBusinessId(user.getId(), businessId)
				.map(FavoriteResponse::from)
				.orElseGet(() -> saveFavorite(user, businessId));
	}

	@Transactional
	public void quitarFavorito(AppUser user, Long businessId) {
		validateUser(user);

		if (!favoriteRepository.existsByUserIdAndBusinessId(user.getId(), businessId)) {
			throw new IllegalArgumentException("El sitio no esta en tus favoritos.");
		}

		favoriteRepository.deleteByUserIdAndBusinessId(user.getId(), businessId);
	}

	@Transactional(readOnly = true)
	public List<FavoriteResponse> obtenerFavoritosPorUsuario(AppUser user) {
		validateUser(user);

		return favoriteRepository.findByUserIdOrderBySavedAtDesc(user.getId())
				.stream()
				.map(FavoriteResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public FavoriteStatusResponse esFavorito(AppUser user, Long businessId) {
		validateUser(user);

		boolean favorite = favoriteRepository.existsByUserIdAndBusinessId(user.getId(), businessId);
		return new FavoriteStatusResponse(businessId, favorite);
	}

	private FavoriteResponse saveFavorite(AppUser user, Long businessId) {
		ProviderProfile business = providerProfileRepository.findById(businessId)
				.orElseThrow(() -> new IllegalArgumentException("El sitio o servicio no existe."));

		Favorite favorite = new Favorite();
		favorite.setUser(user);
		favorite.setBusiness(business);

		return FavoriteResponse.from(favoriteRepository.save(favorite));
	}

	private void validateUser(AppUser user) {
		if (user == null) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
		if (user.getRole() != Role.USER) {
			throw new IllegalArgumentException("Solo los usuarios turistas pueden gestionar favoritos.");
		}
	}
}
