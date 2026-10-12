package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.presentation.dto.PublicBusinessResponse;
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
	public List<PublicBusinessResponse> listAll() {
		return providerProfileRepository.findByStatusOrderByIdDesc(ServiceStatus.APPROVED)
				.stream()
				.map(PublicBusinessResponse::from)
				.toList();
	}
@Transactional(readOnly = true)
	public List<PublicBusinessResponse> list(Double lat, Double lng, Double radiusKm) {
		boolean noProximity = lat == null && lng == null && radiusKm == null;
		if (noProximity) {
			return listAll();
		}

		if (lat == null || lng == null || radiusKm == null) {
			throw new IllegalArgumentException("Para filtrar por cercanía envía lat, lng y radiusKm.");
		}
		if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			throw new IllegalArgumentException("Coordenadas fuera de rango.");
		}
		if (radiusKm <= 0 || radiusKm > 500) {
			throw new IllegalArgumentException("El radio debe estar entre 0 y 500 km.");
		}

		return providerProfileRepository.findApprovedWithinRadius(lat, lng, radiusKm * 1000.0)
				.stream()
				.map(PublicBusinessResponse::from)
				.toList();
	}


	@Transactional(readOnly = true)
	public PublicBusinessResponse getById(Long businessId, AppUser currentUser) {
		ProviderProfile business = providerProfileRepository.findById(businessId)
				.orElseThrow(() -> new IllegalArgumentException("No existe un negocio con ese id."));

		if (isPubliclyVisible(business) || canPreviewUnpublished(business, currentUser)) {
			return PublicBusinessResponse.from(business);
		}

		throw new IllegalArgumentException("No existe un negocio con ese id.");
	}

	private boolean isPubliclyVisible(ProviderProfile business) {
		return business.getStatus() == ServiceStatus.APPROVED;
	}

	/**
	 * El dueño (providerUserId) y un administrador pueden previsualizar el servicio
	 * aunque esté PENDING, REJECTED o INACTIVE. Visitantes y turistas no.
	 */
	private boolean canPreviewUnpublished(ProviderProfile business, AppUser currentUser) {
		if (currentUser == null || currentUser.getId() == null) {
			return false;
		}
		if (currentUser.getRole() == Role.ADMIN) {
			return true;
		}

		AppUser owner = business.getUser();
		return owner != null && currentUser.getId().equals(owner.getId());
	}
}
