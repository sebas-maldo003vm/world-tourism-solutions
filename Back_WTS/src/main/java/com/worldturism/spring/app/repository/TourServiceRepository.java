package com.worldturism.spring.app.repository;

import com.worldturism.spring.app.model.ServiceStatus;
import com.worldturism.spring.app.model.TourService;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TourServiceRepository extends JpaRepository<TourService, Long> {

	List<TourService> findByProviderIdOrderByCreatedAtDesc(Long providerId);
	List<TourService> findByStatus(ServiceStatus status);
}
