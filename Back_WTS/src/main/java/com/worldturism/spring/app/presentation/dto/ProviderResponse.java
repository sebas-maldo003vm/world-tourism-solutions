package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public record ProviderResponse(
		Long id,
		Long providerProfileId,
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
		List<String> imageUrls,
		Double latitude,
		Double longitude,
		ServiceStatus status) {

	public static ProviderResponse from(ProviderProfile providerProfile) {
		if (providerProfile == null) {
			return null;
		}

		return new ProviderResponse(
				providerProfile.getId(),
				providerProfile.getId(),
				providerProfile.getUser() != null ? providerProfile.getUser().getId() : null,
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
				new ArrayList<>(providerProfile.getImageUrls()),
				providerProfile.getLatitude(),
				providerProfile.getLongitude(),
				providerProfile.getStatus());
	}
}
