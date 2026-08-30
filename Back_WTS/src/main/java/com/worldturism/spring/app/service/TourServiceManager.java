package com.worldturism.spring.app.service;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.model.ProviderProfile;
import com.worldturism.spring.app.model.Role;
import com.worldturism.spring.app.model.TourService;
import com.worldturism.spring.app.repository.ProviderProfileRepository;
import com.worldturism.spring.app.repository.TourServiceRepository;
import com.worldturism.spring.app.view.dto.TourServiceRequest;
import com.worldturism.spring.app.view.dto.TourServiceResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TourServiceManager {

	private final TourServiceRepository tourServiceRepository;
	private final ProviderProfileRepository providerProfileRepository;

	public TourServiceManager(
			TourServiceRepository tourServiceRepository,
			ProviderProfileRepository providerProfileRepository) {
		this.tourServiceRepository = tourServiceRepository;
		this.providerProfileRepository = providerProfileRepository;
	}

	@Transactional
	public TourServiceResponse create(AppUser user, TourServiceRequest request) {
		ProviderProfile provider = getProviderProfile(user);

		TourService service = new TourService();
		service.setTitle(request.title());
		service.setDescription(request.description());
		service.setCategory(request.category());
		service.setPrice(request.price());
		service.setLocation(request.location());
		service.setLatitude(request.latitude());
		service.setLongitude(request.longitude());
		service.setImageUrl(request.imageUrl());
		service.setProvider(provider);

		TourService savedService = tourServiceRepository.save(service);
		return TourServiceResponse.from(savedService);
	}

	@Transactional(readOnly = true)
	public List<TourServiceResponse> listMyServices(AppUser user) {
		ProviderProfile provider = getProviderProfile(user);

		return tourServiceRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId())
				.stream()
				.map(TourServiceResponse::from)
				.toList();
	}

	private ProviderProfile getProviderProfile(AppUser user) {
		if (user == null) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
		if (user.getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException("Solo los prestadores pueden registrar servicios.");
		}

		return providerProfileRepository.findFirstByUserIdOrderByIdAsc(user.getId())
				.orElseThrow(() -> new IllegalArgumentException("El usuario no tiene perfil de prestador."));
	}
}
