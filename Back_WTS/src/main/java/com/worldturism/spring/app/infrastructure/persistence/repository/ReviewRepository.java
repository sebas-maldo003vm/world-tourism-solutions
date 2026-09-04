package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	boolean existsByUserIdAndProviderBusinessId(Long userId, Long businessId);

	List<Review> findByProviderBusinessIdOrderByCreatedAtDesc(Long businessId);

	List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
}
