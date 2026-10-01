package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Catalog payload for unauthenticated and tourist-facing reads.
 * Omits tax id (NIT), street address, and the provider's internal user id.
 */
public record PublicBusinessResponse(
		Long id,
		Long providerProfileId,
		String businessName,
		String description,
		String city,
		String category,
		BigDecimal price,
		Float avgRating,
		Integer totalReviews,
		String website,
		String logoUrl,
		List<String> imageUrls,
		Double latitude,
		Double longitude,
		ServiceStatus status) {

	public static PublicBusinessResponse from(ProviderProfile providerProfile) {
		if (providerProfile == null) {
			return null;
		}

		return new PublicBusinessResponse(
				providerProfile.getId(),
				providerProfile.getId(),
				providerProfile.getBusinessName(),
				providerProfile.getDescription(),
				providerProfile.getCity(),
				providerProfile.getCategory(),
				providerProfile.getPrice(),
				providerProfile.getAvgRating(),
				providerProfile.getTotalReviews(),
				providerProfile.getWebsite(),
				providerProfile.getLogoUrl(),
				new ArrayList<>(providerProfile.getImageUrls()),
				providerProfile.getLatitude(),
				providerProfile.getLongitude(),
				providerProfile.getStatus());
	}
}
