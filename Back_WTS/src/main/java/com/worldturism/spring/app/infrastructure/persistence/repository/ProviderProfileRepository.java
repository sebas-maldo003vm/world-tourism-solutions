package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {

	Optional<ProviderProfile> findFirstByUserIdOrderByIdAsc(Long userId);

	Optional<ProviderProfile> findByIdAndUserId(Long id, Long userId);

	List<ProviderProfile> findByUserIdOrderByIdDesc(Long userId);

	List<ProviderProfile> findAllByOrderByIdDesc();

	List<ProviderProfile> findByStatusOrderByIdDesc(ServiceStatus status);

	long countByStatus(ServiceStatus status);
}
