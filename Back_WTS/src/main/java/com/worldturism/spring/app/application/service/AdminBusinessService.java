package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.infrastructure.storage.ImageStorageService;
import com.worldturism.spring.app.presentation.dto.AdminBusinessResponse;
import com.worldturism.spring.app.presentation.dto.AdminBusinessStatusRequest;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminBusinessService {

	private final ProviderProfileRepository providerProfileRepository;
	private final ImageStorageService imageStorageService;

	public AdminBusinessService(
			ProviderProfileRepository providerProfileRepository,
			ImageStorageService imageStorageService) {
		this.providerProfileRepository = providerProfileRepository;
		this.imageStorageService = imageStorageService;
	}

	@Transactional(readOnly = true)
	public List<AdminBusinessResponse> listAll() {
		return providerProfileRepository.findAllByOrderByIdDesc()
				.stream()
				.map(AdminBusinessResponse::from)
				.toList();
	}

	@Transactional
	public AdminBusinessResponse updateStatus(Long businessId, AdminBusinessStatusRequest request) {
		ProviderProfile profile = providerProfileRepository.findById(businessId)
				.orElseThrow(() -> new IllegalArgumentException("No existe un negocio con ese id."));

		profile.setStatus(request.status());
		return AdminBusinessResponse.from(providerProfileRepository.save(profile));
	}

	@Transactional
	public void delete(Long businessId) {
		ProviderProfile profile = providerProfileRepository.findById(businessId)
				.orElseThrow(() -> new IllegalArgumentException("No existe un negocio con ese id."));

		imageStorageService.deleteStoredImages(profile.getImageUrls());
		providerProfileRepository.delete(profile);
	}

	@Transactional(readOnly = true)
	public long countAll() {
		return providerProfileRepository.count();
	}

	@Transactional(readOnly = true)
	public long countPending() {
		return providerProfileRepository.countByStatus(ServiceStatus.PENDING);
	}
}
