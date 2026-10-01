package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.ItineraryItem;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import java.math.BigDecimal;

public record ItineraryProposalItemResponse(
		Long id,
		Integer sortOrder,
		Long providerProfileId,
		String businessName,
		String category,
		String city,
		String description,
		BigDecimal price,
		Float avgRating,
		String logoUrl) {

	public static ItineraryProposalItemResponse from(ItineraryItem item) {
		ProviderProfile profile = item.getProviderProfile();
		return new ItineraryProposalItemResponse(
				item.getId(),
				item.getSortOrder(),
				profile == null ? null : profile.getId(),
				profile == null ? null : profile.getBusinessName(),
				profile == null ? null : profile.getCategory(),
				profile == null ? null : profile.getCity(),
				profile == null ? null : profile.getDescription(),
				profile == null ? null : profile.getPrice(),
				profile == null ? null : profile.getAvgRating(),
				profile == null ? null : profile.getLogoUrl());
	}
}
