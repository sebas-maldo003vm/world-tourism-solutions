package com.worldturism.spring.app.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.worldturism.spring.app.application.exception.InsufficientProposalCatalogException;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import org.junit.jupiter.api.Test;

class ProposalDrawTest {

	@Test
	void drawsExactlyFiveDistinctProfilesInQuotaOrder() {
		List<ProviderProfile> catalog = List.of(
				profile(1, "HOSPEDAJE"),
				profile(2, "Hospedaje"),
				profile(3, "RESTAURANTE"),
				profile(4, "Restaurantes"),
				profile(5, "RESTAURANTE"),
				profile(6, "ACTIVIDAD"),
				profile(7, "Actividades"),
				profile(8, "ACTIVIDAD"));

		List<ProviderProfile> day = ProposalDraw.draw(catalog, new Random(7));

		assertEquals(5, day.size());
		assertEquals(5, day.stream().map(ProviderProfile::getId).distinct().count());
		assertEquals(ProposalCategories.LODGING, ProposalCategories.canonical(day.get(0).getCategory()));
		assertEquals(ProposalCategories.RESTAURANT, ProposalCategories.canonical(day.get(1).getCategory()));
		assertEquals(ProposalCategories.ACTIVITY, ProposalCategories.canonical(day.get(2).getCategory()));
		assertEquals(ProposalCategories.RESTAURANT, ProposalCategories.canonical(day.get(3).getCategory()));
		assertEquals(ProposalCategories.ACTIVITY, ProposalCategories.canonical(day.get(4).getCategory()));
		assertTrue(new HashSet<>(day.stream().map(ProviderProfile::getId).toList()).size() == 5);
	}

	@Test
	void duplicateProfileCountsOnceTowardTheQuota() {
		ProviderProfile restaurant = profile(10, "RESTAURANTE");
		List<ProviderProfile> catalog = new ArrayList<>();
		catalog.add(profile(1, "HOSPEDAJE"));
		catalog.add(restaurant);
		catalog.add(restaurant);
		catalog.add(profile(20, "ACTIVIDAD"));
		catalog.add(profile(21, "ACTIVIDAD"));

		InsufficientProposalCatalogException error = assertThrows(
				InsufficientProposalCatalogException.class,
				() -> ProposalDraw.draw(catalog, new Random(1)));

		assertEquals(
				"No se puede generar la propuesta. Falta la categoría RESTAURANTE: se requieren 2 y hay 1.",
				error.getMessage());
		assertEquals(1, error.shortages().size());
		assertEquals("RESTAURANTE", error.shortages().get(0).category());
	}

	@Test
	void namesEveryCategoryThatMissesItsQuota() {
		InsufficientProposalCatalogException error = assertThrows(
				InsufficientProposalCatalogException.class,
				() -> ProposalDraw.draw(List.of(profile(1, "TOUR")), new Random(1)));

		assertEquals(
				"No se puede generar la propuesta. "
						+ "Falta la categoría HOSPEDAJE: se requieren 1 y hay 0. "
						+ "Falta la categoría RESTAURANTE: se requieren 2 y hay 0. "
						+ "Falta la categoría ACTIVIDAD: se requieren 2 y hay 0.",
				error.getMessage());
	}

	private static ProviderProfile profile(long id, String category) {
		ProviderProfile profile = new ProviderProfile();
		profile.setId(id);
		profile.setCategory(category);
		profile.setBusinessName("Perfil " + id);
		return profile;
	}
}
