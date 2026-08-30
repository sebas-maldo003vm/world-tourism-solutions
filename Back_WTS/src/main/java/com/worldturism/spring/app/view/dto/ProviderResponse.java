package com.worldturism.spring.app.view.dto;

import com.worldturism.spring.app.model.ProviderProfile;
import java.util.ArrayList;
import java.util.List;

public record ProviderResponse(
		Long id,
		String businessName,
		String taxId,
		String description,
		String address,
		String city,
		String category,
		String price,
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
