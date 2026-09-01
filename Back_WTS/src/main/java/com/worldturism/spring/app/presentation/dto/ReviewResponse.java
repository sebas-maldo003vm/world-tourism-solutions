package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Review;
import java.time.Instant;

public record ReviewResponse(
		Long id,
		Integer rating,
		String comment,
		Instant createdAt,
		Long userId,
		String userName,
		Long businessId,
		String businessName) {

	public static ReviewResponse from(Review review) {
		return new ReviewResponse(
				review.getId(),
				review.getRating(),
				review.getComment(),
				review.getCreatedAt(),
				review.getUser().getId(),
				review.getUser().getName(),
				review.getProviderBusiness().getId(),
				review.getProviderBusiness().getBusinessName());
	}
}
