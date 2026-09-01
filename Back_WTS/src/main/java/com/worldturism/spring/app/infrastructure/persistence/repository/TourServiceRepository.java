package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.ServiceStatus;
import com.worldturism.spring.app.domain.model.TourService;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TourServiceRepository extends JpaRepository<TourService, Long> {

	List<TourService> findByProviderIdOrderByCreatedAtDesc(Long providerId);

	List<TourService> findByStatus(ServiceStatus status);

	List<TourService> findAllByOrderByCreatedAtDesc();

	long countByStatus(ServiceStatus status);
}
