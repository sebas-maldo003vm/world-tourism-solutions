package com.worldturism.spring.app.application.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.presentation.dto.ProposalFilterCriteria;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class ProposalCatalogFilterTest {

	@Test
	void blankCriteriaKeepsTheProfile() {
		assertTrue(ProposalCatalogFilter.matches(profile(), null));
		assertTrue(ProposalCatalogFilter.matches(profile(), criteria(null, null, "all", null, null, null, null, null, null)));
	}

	@Test
	void searchAndCityAndPriceAndRatingMatchTheClientRules() {
		ProviderProfile cafe = profile();
		cafe.setBusinessName("Cafe del muelle");
		cafe.setCity("Cartagena");
		cafe.setPrice(new BigDecimal("80000"));
		cafe.setAvgRating(4.5f);

		assertTrue(ProposalCatalogFilter.matches(cafe,
				criteria("cafe", null, "Cartagena", null, null, null, new BigDecimal("10000"), new BigDecimal("100000"), 4d)));
		assertFalse(ProposalCatalogFilter.matches(cafe,
				criteria("cafe", null, "Medellin", null, null, null, null, null, null)));
		assertFalse(ProposalCatalogFilter.matches(cafe,
				criteria(null, null, "all", null, null, null, null, new BigDecimal("1000"), null)));
		assertFalse(ProposalCatalogFilter.matches(cafe,
				criteria(null, null, "all", null, null, null, null, null, 5d)));
	}

	@Test
	void categoryFilterIsCaseInsensitive() {
		ProviderProfile lodging = profile();
		lodging.setCategory("Hospedaje");

		assertTrue(ProposalCatalogFilter.matches(lodging,
				criteria(null, List.of("hospedaje"), "all", null, null, null, null, null, null)));
		assertFalse(ProposalCatalogFilter.matches(lodging,
				criteria(null, List.of("RESTAURANTE"), "all", null, null, null, null, null, null)));
	}

	@Test
	void radiusUsesHaversineAndDropsProfilesWithoutCoordinates() {
		ProviderProfile near = profile();
		near.setLatitude(0d);
		near.setLongitude(0d);

		ProviderProfile far = profile();
		far.setLatitude(0d);
		far.setLongitude(1d);

		ProviderProfile unknown = profile();

		ProposalFilterCriteria nearby = criteria(null, null, "all", 25, 0d, 0d, null, null, null);
		assertTrue(ProposalCatalogFilter.matches(near, nearby));
		assertFalse(ProposalCatalogFilter.matches(far, nearby));
		assertFalse(ProposalCatalogFilter.matches(unknown, nearby));

		ProposalFilterCriteria wide = criteria(null, null, "all", 100, 0d, 0d, null, null, null);
		assertFalse(ProposalCatalogFilter.matches(far, wide));
		assertTrue(ProposalCatalogFilter.matches(far,
				criteria(null, null, "all", null, 0d, 0d, null, null, null)));
	}

	private static ProviderProfile profile() {
		ProviderProfile profile = new ProviderProfile();
		profile.setId(1L);
		profile.setBusinessName("Lugar");
		profile.setCategory("ACTIVIDAD");
		profile.setCity("Cartagena");
		profile.setPrice(new BigDecimal("50000"));
		profile.setAvgRating(4f);
		return profile;
	}

	private static ProposalFilterCriteria criteria(
			String search,
			List<String> categories,
			String location,
			Integer radiusKm,
			Double originLatitude,
			Double originLongitude,
			BigDecimal priceMin,
			BigDecimal priceMax,
			Double minRating) {
		return new ProposalFilterCriteria(
				search,
				categories,
				location,
				radiusKm,
				originLatitude,
				originLongitude,
				priceMin,
				priceMax,
				minRating);
	}
}
