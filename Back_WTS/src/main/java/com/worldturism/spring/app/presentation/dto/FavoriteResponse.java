package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Favorite;
import java.time.Instant;

public record FavoriteResponse(
		Long id,
		Instant savedAt,
		ProviderResponse business) {

	public static FavoriteResponse from(Favorite favorite) {
		return new FavoriteResponse(
				favorite.getId(),
				favorite.getSavedAt(),
				ProviderResponse.from(favorite.getProviderProfile()));
	}
}
