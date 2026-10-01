package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.Itinerary;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {

	List<Itinerary> findByUser_IdAndProposalStatusIsNotNullOrderByCreatedAtDesc(Long userId);

	List<Itinerary> findByUser_IdAndProposalStatusIsNotNullAndStartDateOrderByCreatedAtDesc(
			Long userId,
			LocalDate startDate);

	Optional<Itinerary> findByIdAndUser_Id(Long id, Long userId);
}
