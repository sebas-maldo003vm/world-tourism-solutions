package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.SavedService;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedServiceRepository extends JpaRepository<SavedService, Long> {

	boolean existsByUserIdAndServiceId(Long userId, Long serviceId);

	Optional<SavedService> findByUserIdAndServiceId(Long userId, Long serviceId);

	List<SavedService> findByUserIdOrderBySavedAtDesc(Long userId);
}
