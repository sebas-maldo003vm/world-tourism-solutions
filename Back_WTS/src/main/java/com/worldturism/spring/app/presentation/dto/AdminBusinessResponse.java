package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import java.util.ArrayList;
import java.util.List;

public record AdminBusinessResponse(
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
		List<String> imageUrls,
		ServiceStatus status,
		String providerName,
		String providerEmail) {

	public static AdminBusinessResponse from(ProviderProfile profile) {
		return new AdminBusinessResponse(
				profile.getId(),
				profile.getBusinessName(),
				profile.getTaxId(),
				profile.getDescription(),
				profile.getAddress(),
				profile.getCity(),
				profile.getCategory(),
				profile.getPrice(),
				profile.getAvgRating(),
				profile.getTotalReviews(),
				profile.getWebsite(),
				profile.getLogoUrl(),
				new ArrayList<>(profile.getImageUrls()),
				profile.getStatus(),
				profile.getUser().getName(),
				profile.getUser().getEmail());
	}
}
