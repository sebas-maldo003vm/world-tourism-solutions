package com.worldturism.spring.app.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.worldturism.spring.app.application.exception.InsufficientProposalCatalogException;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Itinerary;
import com.worldturism.spring.app.domain.model.ProposalStatus;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import com.worldturism.spring.app.infrastructure.persistence.repository.ItineraryRepository;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.presentation.dto.ItineraryProposalRequest;
import com.worldturism.spring.app.presentation.dto.ItineraryProposalResponse;
import com.worldturism.spring.app.presentation.dto.ProposalFilterCriteria;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ItineraryProposalServiceTest {

	@Mock
	private ItineraryRepository itineraryRepository;

	@Mock
	private ProviderProfileRepository providerProfileRepository;

	@InjectMocks
	private ItineraryProposalService service;

	@Test
	void generatePersistsAProposedItineraryAndDoesNotTouchBookings() {
		when(providerProfileRepository.findByStatusOrderByIdDesc(ServiceStatus.APPROVED)).thenReturn(List.of(
				profile(1, "HOSPEDAJE"),
				profile(2, "RESTAURANTE"),
				profile(3, "RESTAURANTE"),
				profile(4, "ACTIVIDAD"),
				profile(5, "ACTIVIDAD")));
		when(itineraryRepository.save(any(Itinerary.class))).thenAnswer(invocation -> {
			Itinerary itinerary = invocation.getArgument(0);
			itinerary.setId(42L);
			return itinerary;
		});

		ItineraryProposalResponse response = service.generate(
				tourist(),
				new ItineraryProposalRequest(LocalDate.of(2026, 10, 2), null));

		assertEquals(42L, response.id());
		assertEquals(ProposalStatus.PROPOSED, response.status());
		assertEquals(LocalDate.of(2026, 10, 2), response.date());
		assertEquals(5, response.items().size());

		ArgumentCaptor<Itinerary> saved = ArgumentCaptor.forClass(Itinerary.class);
		verify(itineraryRepository).save(saved.capture());
		assertEquals(ProposalStatus.PROPOSED, saved.getValue().getProposalStatus());
		assertEquals(5, saved.getValue().getItems().size());
		assertEquals(5, saved.getValue().getItems().stream().map(item -> item.getProviderProfile().getId()).distinct().count());
	}

	@Test
	void generateFailsWithTheMissingCategoryWhenFiltersEmptyABucket() {
		when(providerProfileRepository.findByStatusOrderByIdDesc(ServiceStatus.APPROVED)).thenReturn(List.of(
				profile(1, "HOSPEDAJE"),
				profile(2, "RESTAURANTE"),
				profile(3, "RESTAURANTE"),
				profile(4, "ACTIVIDAD"),
				profile(5, "ACTIVIDAD")));

		ProposalFilterCriteria onlyRestaurants = new ProposalFilterCriteria(
				null, List.of("RESTAURANTE"), "all", null, null, null, null, null, null);

		InsufficientProposalCatalogException error = assertThrows(
				InsufficientProposalCatalogException.class,
				() -> service.generate(tourist(), new ItineraryProposalRequest(LocalDate.of(2026, 10, 2), onlyRestaurants)));

		assertEquals(true, error.getMessage().contains("HOSPEDAJE"));
		assertEquals(true, error.getMessage().contains("ACTIVIDAD"));
		verify(itineraryRepository, never()).save(any());
	}

	@Test
	void acceptOnlyChangesProposalStatus() {
		Itinerary proposal = new Itinerary();
		proposal.setId(7L);
		proposal.setProposalStatus(ProposalStatus.PROPOSED);
		proposal.setStartDate(LocalDate.of(2026, 10, 2));
		when(itineraryRepository.findByIdAndUser_Id(7L, 3L)).thenReturn(java.util.Optional.of(proposal));

		ItineraryProposalResponse response = service.accept(tourist(), 7L);

		assertEquals(ProposalStatus.ACCEPTED, response.status());
		assertEquals(ProposalStatus.ACCEPTED, proposal.getProposalStatus());
	}

	@Test
	void providerCannotGenerate() {
		AppUser provider = new AppUser();
		provider.setId(9L);
		provider.setRole(Role.PROVIDER);

		assertThrows(IllegalArgumentException.class, () -> service.generate(
				provider,
				new ItineraryProposalRequest(LocalDate.of(2026, 10, 2), null)));
		verify(providerProfileRepository, never()).findByStatusOrderByIdDesc(any());
	}

	private static AppUser tourist() {
		AppUser user = new AppUser();
		user.setId(3L);
		user.setRole(Role.USER);
		return user;
	}

	private static ProviderProfile profile(long id, String category) {
		ProviderProfile profile = new ProviderProfile();
		profile.setId(id);
		profile.setCategory(category);
		profile.setBusinessName("Lugar " + id);
		profile.setStatus(ServiceStatus.APPROVED);
		return profile;
	}
}
