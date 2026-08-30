package com.worldturism.spring.app.service;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.model.Role;
import com.worldturism.spring.app.model.SavedService;
import com.worldturism.spring.app.model.ServiceStatus;
import com.worldturism.spring.app.model.TourService;
import com.worldturism.spring.app.repository.SavedServiceRepository;
import com.worldturism.spring.app.repository.TourServiceRepository;
import com.worldturism.spring.app.view.dto.SavedServiceResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SavedServiceManager {

	private final SavedServiceRepository savedServiceRepository;
	private final TourServiceRepository tourServiceRepository;

	public SavedServiceManager(
			SavedServiceRepository savedServiceRepository,
			TourServiceRepository tourServiceRepository) {
		this.savedServiceRepository = savedServiceRepository;
		this.tourServiceRepository = tourServiceRepository;
	}

	@Transactional
	public SavedServiceResponse acquire(AppUser user, Long serviceId) {
		validateUser(user);

		return savedServiceRepository.findByUserIdAndServiceId(user.getId(), serviceId)
				.map(SavedServiceResponse::from)
				.orElseGet(() -> saveAcquiredService(user, serviceId));
	}

	@Transactional(readOnly = true)
	public List<SavedServiceResponse> listMyAcquiredServices(AppUser user) {
		validateUser(user);

		return savedServiceRepository.findByUserIdOrderBySavedAtDesc(user.getId())
				.stream()
				.map(SavedServiceResponse::from)
				.toList();
	}

	private SavedServiceResponse saveAcquiredService(AppUser user, Long serviceId) {
		TourService service = tourServiceRepository.findById(serviceId)
				.orElseThrow(() -> new IllegalArgumentException("El servicio no existe."));
		if (service.getStatus() == ServiceStatus.REJECTED || service.getStatus() == ServiceStatus.INACTIVE) {
			throw new IllegalArgumentException("El servicio no esta disponible para adquirir.");
		}

		SavedService savedService = new SavedService();
		savedService.setUser(user);
		savedService.setService(service);

		return SavedServiceResponse.from(savedServiceRepository.save(savedService));
	}

	private void validateUser(AppUser user) {
		if (user == null) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
		if (user.getRole() != Role.USER) {
			throw new IllegalArgumentException("Solo los usuarios pueden adquirir servicios.");
		}
	}
}
