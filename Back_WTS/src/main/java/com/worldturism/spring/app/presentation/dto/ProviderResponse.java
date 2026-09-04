package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public record ProviderResponse(
		Long id,
		Long providerUserId,
		String businessName,
		String taxId,
		String description,
		String address,
		String city,
		String category,
		BigDecimal price,
		Float avgRating,
		Integer totalReviews,
		String website,
		String logoUrl,
		List<String> imageUrls) {

	public static ProviderResponse from(ProviderProfile providerProfile) {
		if (providerProfile == null) {
			return null;
		}

		return new ProviderResponse(
				providerProfile.getId(),
				providerProfile.getUser().getId(),
				providerProfile.getBusinessName(),
				providerProfile.getTaxId(),
				providerProfile.getDescription(),
				providerProfile.getAddress(),
				providerProfile.getCity(),
				providerProfile.getCategory(),
				providerProfile.getPrice(),
				providerProfile.getAvgRating(),
				providerProfile.getTotalReviews(),
				providerProfile.getWebsite(),
				providerProfile.getLogoUrl(),
				new ArrayList<>(providerProfile.getImageUrls()));
	}
}
