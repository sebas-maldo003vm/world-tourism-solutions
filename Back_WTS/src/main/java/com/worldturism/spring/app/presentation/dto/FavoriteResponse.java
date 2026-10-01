package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Favorite;
import java.time.Instant;

public record FavoriteResponse(
		Long id,
		Instant savedAt,
		PublicBusinessResponse business) {

	public static FavoriteResponse from(Favorite favorite) {
		return new FavoriteResponse(
				favorite.getId(),
				favorite.getSavedAt(),
				PublicBusinessResponse.from(favorite.getProviderProfile()));
	}
}
