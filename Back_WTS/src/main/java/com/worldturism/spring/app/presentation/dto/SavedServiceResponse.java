package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.SavedService;
import java.time.Instant;

public record SavedServiceResponse(
		Long id,
		Instant savedAt,
		TourServiceResponse service) {

	public static SavedServiceResponse from(SavedService savedService) {
		return new SavedServiceResponse(
				savedService.getId(),
				savedService.getSavedAt(),
				TourServiceResponse.from(savedService.getService()));
	}
}
