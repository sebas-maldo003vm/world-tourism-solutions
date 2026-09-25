package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AnalyticsEvent;
import com.worldturism.spring.app.domain.model.AnalyticsEventType;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.infrastructure.persistence.repository.AnalyticsEventRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.presentation.dto.AnalyticsEventRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsEventService {

	private final AnalyticsEventRepository analyticsEventRepository;
	private final ProviderProfileRepository providerProfileRepository;

	public AnalyticsEventService(
			AnalyticsEventRepository analyticsEventRepository,
			ProviderProfileRepository providerProfileRepository) {
		this.analyticsEventRepository = analyticsEventRepository;
		this.providerProfileRepository = providerProfileRepository;
	}

	@Transactional
	public void record(AppUser user, AnalyticsEventRequest request) {
		AnalyticsEventType eventType = parseEventType(request.eventType());

		AnalyticsEvent event = new AnalyticsEvent();
		event.setEventType(eventType);
		event.setUser(user); // puede ser null: se permite trackear usuarios anónimos
		event.setSearchQuery(request.searchQuery());

		if (request.providerProfileId() != null) {
			// getReferenceById no consulta la BD de inmediato (proxy liviano);
			// si el id no existe, falla al persistir por la FK, lo cual es aceptable
			// para un evento de analítica (no es una operación crítica de negocio).
			providerProfileRepository.findById(request.providerProfileId())
					.ifPresent(event::setProviderProfile);
		}

		analyticsEventRepository.save(event);
	}

	private AnalyticsEventType parseEventType(String value) {
		try {
			return AnalyticsEventType.valueOf(value.trim().toUpperCase());
		} catch (IllegalArgumentException | NullPointerException exception) {
			throw new IllegalArgumentException("Tipo de evento invalido: " + value);
		}
	}
}
