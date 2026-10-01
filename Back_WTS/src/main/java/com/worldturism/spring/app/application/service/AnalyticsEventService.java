package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AnalyticsEventType;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderDailyAnalyticsRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.presentation.dto.AnalyticsEventRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persiste métricas como contadores diarios (UPSERT), no como filas crudas por interacción.
 */
@Service
public class AnalyticsEventService {

	private static final Logger log = LoggerFactory.getLogger(AnalyticsEventService.class);

	private final ProviderDailyAnalyticsRepository dailyAnalyticsRepository;
	private final ProviderProfileRepository providerProfileRepository;

	public AnalyticsEventService(
			ProviderDailyAnalyticsRepository dailyAnalyticsRepository,
			ProviderProfileRepository providerProfileRepository) {
		this.dailyAnalyticsRepository = dailyAnalyticsRepository;
		this.providerProfileRepository = providerProfileRepository;
	}

	@Transactional
	public void record(AnalyticsEventRequest request) {
		recordInternal(request);
	}

	@Transactional
	public void recordBatch(List<AnalyticsEventRequest> requests) {
		if (requests == null || requests.isEmpty()) {
			return;
		}

		// Colapsa el lote por proveedor para un solo UPSERT por id (menos locks).
		Map<Long, long[]> deltas = new LinkedHashMap<>();
		for (AnalyticsEventRequest request : requests) {
			DeltaParts parts = resolveDelta(request);
			if (parts == null) {
				continue;
			}
			long[] bucket = deltas.computeIfAbsent(parts.providerProfileId(), id -> new long[3]);
			bucket[0] += parts.views();
			bucket[1] += parts.clicks();
			bucket[2] += parts.searches();
		}

		for (Map.Entry<Long, long[]> entry : deltas.entrySet()) {
			applyUpsert(entry.getKey(), entry.getValue()[0], entry.getValue()[1], entry.getValue()[2]);
		}
	}

	private void recordInternal(AnalyticsEventRequest request) {
		DeltaParts parts = resolveDelta(request);
		if (parts == null) {
			return;
		}
		applyUpsert(parts.providerProfileId(), parts.views(), parts.clicks(), parts.searches());
	}

	private DeltaParts resolveDelta(AnalyticsEventRequest request) {
		AnalyticsEventType eventType = parseEventType(request.eventType());
		Long providerProfileId = request.providerProfileId();

		if (providerProfileId == null) {
			throw new IllegalArgumentException(
					"providerProfileId es obligatorio para eventos " + eventType);
		}

		long views = eventType == AnalyticsEventType.VIEW ? 1L : 0L;
		long clicks = eventType == AnalyticsEventType.CLICK ? 1L : 0L;
		long searches = eventType == AnalyticsEventType.SEARCH ? 1L : 0L;

		return new DeltaParts(providerProfileId, views, clicks, searches);
	}

	private void applyUpsert(Long providerProfileId, long views, long clicks, long searches) {
		if (views == 0 && clicks == 0 && searches == 0) {
			return;
		}

		// Evita FK violation ruidosa: si el perfil no existe, se ignora (fire-and-forget).
		if (!providerProfileRepository.existsById(providerProfileId)) {
			log.debug("Analítica ignorada: provider_profile_id={} no existe", providerProfileId);
			return;
		}

		dailyAnalyticsRepository.upsertIncrement(providerProfileId, views, clicks, searches);
	}

	private AnalyticsEventType parseEventType(String value) {
		try {
			return AnalyticsEventType.valueOf(value.trim().toUpperCase());
		} catch (IllegalArgumentException | NullPointerException exception) {
			throw new IllegalArgumentException("Tipo de evento invalido: " + value);
		}
	}

	private record DeltaParts(Long providerProfileId, long views, long clicks, long searches) {
	}
}
