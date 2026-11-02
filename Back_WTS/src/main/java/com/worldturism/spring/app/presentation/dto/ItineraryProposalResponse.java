package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Itinerary;
import com.worldturism.spring.app.domain.model.ProposalStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public record ItineraryProposalResponse(
		Long id,
		String title,
		LocalDate date,
		ProposalStatus status,
		Instant createdAt,
		List<ItineraryProposalItemResponse> items) {

	public static ItineraryProposalResponse from(Itinerary itinerary) {
		LocalDate date = itinerary.getStartDate() != null ? itinerary.getStartDate() : itinerary.getEndDate();
		List<ItineraryProposalItemResponse> items = itinerary.getItems().stream()
				.sorted(Comparator.comparing(item -> item.getSortOrder() == null ? 0 : item.getSortOrder()))
				.map(ItineraryProposalItemResponse::from)
				.toList();
		return new ItineraryProposalResponse(
				itinerary.getId(),
				itinerary.getTitle(),
				date,
				itinerary.getProposalStatus(),
				itinerary.getCreatedAt(),
				items);
	}
}
