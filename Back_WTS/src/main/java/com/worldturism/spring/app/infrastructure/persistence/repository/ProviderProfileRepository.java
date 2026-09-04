package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {

	Optional<ProviderProfile> findFirstByUserIdOrderByIdAsc(Long userId);

	Optional<ProviderProfile> findByIdAndUserId(Long id, Long userId);

	List<ProviderProfile> findByUserIdOrderByIdDesc(Long userId);

	@Query("SELECT p FROM ProviderProfile p JOIN FETCH p.user ORDER BY p.id DESC")
	List<ProviderProfile> findAllByOrderByIdDesc();

	List<ProviderProfile> findByStatusOrderByIdDesc(ServiceStatus status);

	long countByStatus(ServiceStatus status);
}
