package com.worldturism.spring.app.repository;

import com.worldturism.spring.app.model.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	boolean existsByUserIdAndServiceId(Long userId, Long serviceId);

	boolean existsByUserIdAndProviderBusinessId(Long userId, Long businessId);

	List<Review> findByServiceIdOrderByCreatedAtDesc(Long serviceId);

	List<Review> findByProviderBusinessIdOrderByCreatedAtDesc(Long businessId);

	List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
}
