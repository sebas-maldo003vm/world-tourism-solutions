package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.ServiceStatus;
import com.worldturism.spring.app.domain.model.TourService;
import com.worldturism.spring.app.infrastructure.persistence.repository.TourServiceRepository;
import com.worldturism.spring.app.presentation.dto.AdminBusinessStatusRequest;
import com.worldturism.spring.app.presentation.dto.TourServiceResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminTourServiceManager {

	private final TourServiceRepository tourServiceRepository;

	public AdminTourServiceManager(TourServiceRepository tourServiceRepository) {
		this.tourServiceRepository = tourServiceRepository;
	}

	@Transactional(readOnly = true)
	public List<TourServiceResponse> listAll() {
		return tourServiceRepository.findAllByOrderByCreatedAtDesc()
				.stream()
				.map(TourServiceResponse::from)
				.toList();
	}

	@Transactional
	public TourServiceResponse updateStatus(Long serviceId, AdminBusinessStatusRequest request) {
		TourService service = tourServiceRepository.findById(serviceId)
				.orElseThrow(() -> new IllegalArgumentException("No existe un servicio con ese id."));

		service.setStatus(request.status());
		return TourServiceResponse.from(tourServiceRepository.save(service));
	}

	@Transactional
	public void delete(Long serviceId) {
		TourService service = tourServiceRepository.findById(serviceId)
				.orElseThrow(() -> new IllegalArgumentException("No existe un servicio con ese id."));

		tourServiceRepository.delete(service);
	}

	@Transactional(readOnly = true)
	public long countAll() {
		return tourServiceRepository.count();
	}

	@Transactional(readOnly = true)
	public long countPending() {
		return tourServiceRepository.countByStatus(ServiceStatus.PENDING);
	}
}
