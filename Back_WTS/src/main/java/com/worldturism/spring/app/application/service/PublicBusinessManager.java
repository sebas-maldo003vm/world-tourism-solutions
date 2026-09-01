package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.ServiceStatus;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.presentation.dto.ProviderResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicBusinessManager {

	private final ProviderProfileRepository providerProfileRepository;

	public PublicBusinessManager(ProviderProfileRepository providerProfileRepository) {
		this.providerProfileRepository = providerProfileRepository;
	}

	@Transactional(readOnly = true)
	public List<ProviderResponse> listAll() {
		return providerProfileRepository.findByStatusOrderByIdDesc(ServiceStatus.APPROVED)
				.stream()
				.map(ProviderResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public ProviderResponse getById(Long businessId) {
		return providerProfileRepository.findById(businessId)
				.filter(business -> business.getStatus() == ServiceStatus.APPROVED)
				.map(ProviderResponse::from)
				.orElseThrow(() -> new IllegalArgumentException("No existe un negocio con ese id."));
	}
}
