package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.presentation.dto.ProposalFilterCriteria;
import java.math.BigDecimal;
import java.util.Locale;

/**
 * Misma lectura que {@code matchesCatalogFilters} del cliente, incluida la distancia Haversine.
 * El sorteo usa el resultado para no depender de una lista de ids enviada por el navegador.
 */
public final class ProposalCatalogFilter {

	private static final double EARTH_RADIUS_KM = 6371.0;

	private ProposalCatalogFilter() {
	}

	public static boolean matches(ProviderProfile profile, ProposalFilterCriteria filters) {
		if (filters == null) {
			return true;
		}

		String search = filters.search() == null ? "" : filters.search().trim().toLowerCase(Locale.ROOT);
		if (!search.isEmpty()) {
			String searchable = String.join(" ",
					text(profile.getBusinessName()),
					text(profile.getDescription()),
					text(profile.getCategory()),
					text(profile.getCity()))
					.toLowerCase(Locale.ROOT);
			if (!searchable.contains(search)) {
				return false;
			}
		}

		if (filters.categories() != null && !filters.categories().isEmpty()) {
			String category = profile.getCategory() == null ? "" : profile.getCategory().trim().toUpperCase(Locale.ROOT);
			boolean selected = filters.categories().stream()
					.filter(value -> value != null && !value.isBlank())
					.anyMatch(value -> value.trim().toUpperCase(Locale.ROOT).equals(category));
			if (!selected) {
				return false;
			}
		}

		if (filters.location() != null && !filters.location().isBlank() && !"all".equalsIgnoreCase(filters.location().trim())) {
			String location = filters.location().trim();
			boolean matchesLocation = location.equals(profile.getCity());
			if (!matchesLocation) {
				return false;
			}
		}

		BigDecimal price = profile.getPrice() == null ? BigDecimal.ZERO : profile.getPrice();
		if (filters.priceMin() != null && price.compareTo(filters.priceMin()) < 0) {
			return false;
		}
		if (filters.priceMax() != null && price.compareTo(filters.priceMax()) > 0) {
			return false;
		}

		if (filters.minRating() != null) {
			double rating = profile.getAvgRating() == null ? 0d : profile.getAvgRating().doubleValue();
			if (rating < filters.minRating()) {
				return false;
			}
		}

		if (filters.radiusKm() != null && filters.originLatitude() != null && filters.originLongitude() != null) {
			if (profile.getLatitude() == null || profile.getLongitude() == null) {
				return false;
			}
			double distance = distanceKm(
					filters.originLatitude(),
					filters.originLongitude(),
					profile.getLatitude(),
					profile.getLongitude());
			if (distance > filters.radiusKm()) {
				return false;
			}
		}

		return true;
	}

	static double distanceKm(double fromLat, double fromLng, double toLat, double toLng) {
		double dLat = Math.toRadians(toLat - fromLat);
		double dLng = Math.toRadians(toLng - fromLng);
		double lat1 = Math.toRadians(fromLat);
		double lat2 = Math.toRadians(toLat);
		double haversine = Math.sin(dLat / 2) * Math.sin(dLat / 2)
				+ Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
		return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1d, Math.sqrt(haversine)));
	}

	private static String text(String value) {
		return value == null ? "" : value;
	}
}
