package com.worldturism.spring.app.view.dto;

import com.worldturism.spring.app.model.ServiceCategory;
import com.worldturism.spring.app.model.ServiceStatus;
import com.worldturism.spring.app.model.TourService;
import java.math.BigDecimal;
import java.time.Instant;

public record TourServiceResponse(
		Long id,
		String title,
		String description,
		ServiceCategory category,
		BigDecimal price,
		String location,
		String latitude,
		String longitude,
		String imageUrl,
		Float avgRating,
		Integer totalReviews,
		ServiceStatus status,
		Instant createdAt,
		Long providerId,
		String providerBusinessName) {

	public static TourServiceResponse from(TourService service) {
		return new TourServiceResponse(
				service.getId(),
				service.getTitle(),
				service.getDescription(),
				service.getCategory(),
				service.getPrice(),
				service.getLocation(),
				service.getLatitude(),
				service.getLongitude(),
				service.getImageUrl(),
				service.getAvgRating(),
				service.getTotalReviews(),
				service.getStatus(),
				service.getCreatedAt(),
				service.getProvider().getId(),
				service.getProvider().getBusinessName());
	}
}
