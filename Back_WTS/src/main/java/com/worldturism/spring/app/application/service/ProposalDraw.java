package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.application.exception.InsufficientProposalCatalogException;
import com.worldturism.spring.app.application.exception.InsufficientProposalCatalogException.CategoryShortage;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.presentation.dto.ProposalFilterCriteria;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Selecciona y optimiza de forma determinista 5 perfiles distintos: 1 hospedaje, 2 restaurantes y 2 actividades,
 * priorizando calidad (calificación) y cercanía espacial, sin recurrir a aleatoriedad.
 */
public final class ProposalDraw {

	private ProposalDraw() {
	}

	public static List<ProviderProfile> draw(List<ProviderProfile> eligible, ProposalFilterCriteria filters) {
		Map<String, List<ProviderProfile>> buckets = new LinkedHashMap<>();
		buckets.put(ProposalCategories.LODGING, new ArrayList<>());
		buckets.put(ProposalCategories.RESTAURANT, new ArrayList<>());
		buckets.put(ProposalCategories.ACTIVITY, new ArrayList<>());

		Map<Long, ProviderProfile> unique = new LinkedHashMap<>();
		if (eligible != null) {
			for (ProviderProfile profile : eligible) {
				if (profile == null || profile.getId() == null) {
					continue;
				}
				unique.putIfAbsent(profile.getId(), profile);
			}
		}

		for (ProviderProfile profile : unique.values()) {
			String category = ProposalCategories.canonical(profile.getCategory());
			if (category == null) {
				continue;
			}
			buckets.get(category).add(profile);
		}

		List<CategoryShortage> shortages = new ArrayList<>();
		collectShortage(shortages, ProposalCategories.LODGING, ProposalCategories.LODGING_QUOTA, buckets);
		collectShortage(shortages, ProposalCategories.RESTAURANT, ProposalCategories.RESTAURANT_QUOTA, buckets);
		collectShortage(shortages, ProposalCategories.ACTIVITY, ProposalCategories.ACTIVITY_QUOTA, buckets);
		if (!shortages.isEmpty()) {
			throw new InsufficientProposalCatalogException(shortages);
		}

		// Extracción de coordenadas de origen (si el usuario dio permisos de geolocalización en los filtros)
		Double originLat = filters != null ? filters.originLatitude() : null;
		Double originLon = filters != null ? filters.originLongitude() : null;

		// Selección inteligente y determinista por puntuación (Calificación + Cercanía)
		List<ProviderProfile> lodging = pickSmart(buckets.get(ProposalCategories.LODGING), ProposalCategories.LODGING_QUOTA, originLat, originLon);
		List<ProviderProfile> restaurants = pickSmart(buckets.get(ProposalCategories.RESTAURANT), ProposalCategories.RESTAURANT_QUOTA, originLat, originLon);
		List<ProviderProfile> activities = pickSmart(buckets.get(ProposalCategories.ACTIVITY), ProposalCategories.ACTIVITY_QUOTA, originLat, originLon);

		// El punto de partida fijo (origen de la ruta del día) es el hospedaje seleccionado
		ProviderProfile baseLodging = lodging.get(0);

		// Combinamos los 4 puntos restantes para optimizar la ruta espacial
		List<ProviderProfile> candidates = new ArrayList<>();
		candidates.addAll(restaurants);
		candidates.addAll(activities);

		// Aplicamos la heurística del Vecino Más Cercano (Nearest Neighbor TSP)
		return optimizeRoute(baseLodging, candidates);
	}

	private static List<ProviderProfile> pickSmart(List<ProviderProfile> bucket, int count, Double originLat, Double originLon) {
		List<ProviderProfile> copy = new ArrayList<>(bucket);
		
		// Ordenamiento determinista basado en:
		// 1. Calificación promedio (mayor es mejor)
		// 2. Distancia al origen del usuario (menor es mejor, si hay coordenadas GPS)
		copy.sort((p1, p2) -> {
			double score1 = calculateScore(p1, originLat, originLon);
			double score2 = calculateScore(p2, originLat, originLon);
			return Double.compare(score2, score1); // Orden descendente (mayor puntaje primero)
		});

		return copy.subList(0, Math.min(copy.size(), count));
	}

	private static double calculateScore(ProviderProfile profile, Double originLat, Double originLon) {
		double rating = profile.getAvgRating() != null ? profile.getAvgRating() : 3.0; // Base neutra si no tiene rating
		
		// Si el usuario no dio su ubicación GPS, priorizamos puramente la calidad (rating)
		if (originLat == null || originLon == null || profile.getLatitude() == null || profile.getLongitude() == null) {
			return rating * 20.0; 
		}

		// Si hay ubicación, ponderamos la distancia para premiar los más cercanos
		double distanceKm = calculateDistance(originLat, originLon, profile.getLatitude(), profile.getLongitude());
		return (rating * 15.0) - (distanceKm * 0.5);
	}

	private static List<ProviderProfile> optimizeRoute(ProviderProfile start, List<ProviderProfile> candidates) {
		List<ProviderProfile> optimized = new ArrayList<>();
		List<ProviderProfile> remaining = new ArrayList<>(candidates);

		optimized.add(start);
		ProviderProfile current = start;

		while (!remaining.isEmpty()) {
			ProviderProfile nearest = null;
			double minDistance = Double.MAX_VALUE;

			for (ProviderProfile candidate : remaining) {
				double dist = calculateDistance(
						current.getLatitude(), current.getLongitude(),
						candidate.getLatitude(), candidate.getLongitude()
				);
				if (dist < minDistance) {
					minDistance = dist;
					nearest = candidate;
				}
			}

			if (nearest != null) {
				optimized.add(nearest);
				remaining.remove(nearest);
				current = nearest;
			} else {
				optimized.addAll(remaining);
				break;
			}
		}

		return optimized;
	}

	private static double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
		if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
			return 0.0; 
		}
		double dLat = Math.toRadians(lat2 - lat1);
		double dLon = Math.toRadians(lon2 - lon1);
		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
				Math.sin(dLon / 2) * Math.sin(dLon / 2);
		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return 6371.0 * c;
	}

	private static void collectShortage(
			List<CategoryShortage> shortages,
			String category,
			int required,
			Map<String, List<ProviderProfile>> buckets) {
		int available = buckets.get(category).size();
		if (available < required) {
			shortages.add(new CategoryShortage(category, required, available));
		}
	}
}