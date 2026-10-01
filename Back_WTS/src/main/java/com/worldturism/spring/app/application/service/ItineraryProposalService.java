package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.Itinerary;
import com.worldturism.spring.app.domain.model.ItineraryItem;
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
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Genera y actualiza propuestas informativas de un día.
 * No crea filas en {@code bookings}, no cobra y no pide aprobación del proveedor.
 */
@Service
public class ItineraryProposalService {

	private static final DateTimeFormatter TITLE_DATE = DateTimeFormatter.ofPattern(
			"d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es"));

	private final ItineraryRepository itineraryRepository;
	private final ProviderProfileRepository providerProfileRepository;

	public ItineraryProposalService(
			ItineraryRepository itineraryRepository,
			ProviderProfileRepository providerProfileRepository) {
		this.itineraryRepository = itineraryRepository;
		this.providerProfileRepository = providerProfileRepository;
	}

	@Transactional
	public ItineraryProposalResponse generate(AppUser user, ItineraryProposalRequest request) {
		validateTourist(user);
		validateFilters(request.filters());

		List<ProviderProfile> eligible = providerProfileRepository
				.findByStatusOrderByIdDesc(ServiceStatus.APPROVED)
				.stream()
				.filter(profile -> ProposalCatalogFilter.matches(profile, request.filters()))
				.toList();

		List<ProviderProfile> picked = ProposalDraw.draw(eligible, new Random());
		Itinerary itinerary = new Itinerary();
		itinerary.setUser(user);
		itinerary.setTitle("Propuesta del " + TITLE_DATE.format(request.date()));
		itinerary.setStartDate(request.date());
		itinerary.setEndDate(request.date());
		itinerary.setProposalStatus(ProposalStatus.PROPOSED);

		int sortOrder = 0;
		for (ProviderProfile profile : picked) {
			ItineraryItem item = new ItineraryItem();
			item.setItinerary(itinerary);
			item.setProviderProfile(profile);
			item.setScheduledDate(request.date());
			item.setSortOrder(sortOrder++);
			item.setNotes(ProposalCategories.canonical(profile.getCategory()));
			itinerary.getItems().add(item);
		}

		return ItineraryProposalResponse.from(itineraryRepository.save(itinerary));
	}

	@Transactional(readOnly = true)
	public List<ItineraryProposalResponse> list(AppUser user, LocalDate date) {
		validateTourist(user);
		List<Itinerary> proposals = date == null
				? itineraryRepository.findByUser_IdAndProposalStatusIsNotNullOrderByCreatedAtDesc(user.getId())
				: itineraryRepository.findByUser_IdAndProposalStatusIsNotNullAndStartDateOrderByCreatedAtDesc(
						user.getId(), date);
		return proposals.stream().map(ItineraryProposalResponse::from).toList();
	}

	@Transactional
	public ItineraryProposalResponse accept(AppUser user, Long proposalId) {
		Itinerary proposal = requireOwnedProposal(user, proposalId);
		if (proposal.getProposalStatus() != ProposalStatus.PROPOSED) {
			throw new IllegalArgumentException("Solo se puede aceptar una propuesta pendiente.");
		}
		proposal.setProposalStatus(ProposalStatus.ACCEPTED);
		return ItineraryProposalResponse.from(proposal);
	}

	@Transactional
	public ItineraryProposalResponse cancel(AppUser user, Long proposalId) {
		Itinerary proposal = requireOwnedProposal(user, proposalId);
		if (proposal.getProposalStatus() == ProposalStatus.CANCELLED) {
			throw new IllegalArgumentException("La propuesta ya está cancelada.");
		}
		proposal.setProposalStatus(ProposalStatus.CANCELLED);
		return ItineraryProposalResponse.from(proposal);
	}

	private Itinerary requireOwnedProposal(AppUser user, Long proposalId) {
		validateTourist(user);
		Itinerary proposal = itineraryRepository.findByIdAndUser_Id(proposalId, user.getId())
				.orElseThrow(() -> new IllegalArgumentException("La propuesta no existe."));
		if (proposal.getProposalStatus() == null) {
			throw new IllegalArgumentException("La propuesta no existe.");
		}
		return proposal;
	}

	private void validateFilters(ProposalFilterCriteria filters) {
		if (filters == null) {
			return;
		}
		boolean hasOrigin = filters.originLatitude() != null && filters.originLongitude() != null;
		if (filters.radiusKm() != null && !hasOrigin) {
			throw new IllegalArgumentException("El radio requiere una ubicación de origen.");
		}
		if (filters.priceMin() != null && filters.priceMax() != null
				&& filters.priceMin().compareTo(filters.priceMax()) > 0) {
			throw new IllegalArgumentException("El precio mínimo no puede ser mayor que el precio máximo.");
		}
	}

	private void validateTourist(AppUser user) {
		if (user == null || user.getId() == null) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
		if (user.getRole() != Role.USER) {
			throw new IllegalArgumentException("Solo los turistas pueden gestionar propuestas de itinerario.");
		}
	}
}
