package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.ServiceStatus;
import com.worldturism.spring.app.infrastructure.persistence.repository.TourServiceRepository;
import com.worldturism.spring.app.presentation.dto.TourServiceResponse;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PublicServiceManager {

	private final TourServiceRepository tourServiceRepository;

	public PublicServiceManager(
			TourServiceRepository tourServiceRepository) {
		this.tourServiceRepository = tourServiceRepository;
	}

	public List<TourServiceResponse> listAll() {

		return tourServiceRepository
				.findByStatus(ServiceStatus.APPROVED)
				.stream()
				.map(TourServiceResponse::from)
				.toList();
	}
}