package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.application.exception.InsufficientProposalCatalogException;
import com.worldturism.spring.app.application.exception.InsufficientProposalCatalogException.CategoryShortage;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Sortea exactamente cinco perfiles distintos: 1 hospedaje, 2 restaurantes y 2 actividades.
 */
public final class ProposalDraw {

	private ProposalDraw() {
	}

	public static List<ProviderProfile> draw(List<ProviderProfile> eligible, Random random) {
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

		List<ProviderProfile> lodging = pick(buckets.get(ProposalCategories.LODGING), ProposalCategories.LODGING_QUOTA, random);
		List<ProviderProfile> restaurants = pick(buckets.get(ProposalCategories.RESTAURANT), ProposalCategories.RESTAURANT_QUOTA, random);
		List<ProviderProfile> activities = pick(buckets.get(ProposalCategories.ACTIVITY), ProposalCategories.ACTIVITY_QUOTA, random);

		List<ProviderProfile> day = new ArrayList<>(5);
		day.add(lodging.get(0));
		day.add(restaurants.get(0));
		day.add(activities.get(0));
		day.add(restaurants.get(1));
		day.add(activities.get(1));
		return day;
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

	private static List<ProviderProfile> pick(List<ProviderProfile> bucket, int count, Random random) {
		List<ProviderProfile> copy = new ArrayList<>(bucket);
		Collections.shuffle(copy, random);
		return copy.subList(0, count);
	}
}
