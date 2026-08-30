package com.worldturism.spring.app.service;

import com.worldturism.spring.app.repository.ProviderProfileRepository;
import com.worldturism.spring.app.view.dto.ProviderResponse;
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
		return providerProfileRepository.findAllByOrderByIdDesc()
				.stream()
				.map(ProviderResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public ProviderResponse getById(Long businessId) {
		return providerProfileRepository.findById(businessId)
				.map(ProviderResponse::from)
				.orElseThrow(() -> new IllegalArgumentException("No existe un negocio con ese id."));
	}
}
