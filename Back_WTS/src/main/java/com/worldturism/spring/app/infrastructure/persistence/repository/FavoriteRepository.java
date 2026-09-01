package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.Favorite;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

	boolean existsByUserIdAndBusinessId(Long userId, Long businessId);

	Optional<Favorite> findByUserIdAndBusinessId(Long userId, Long businessId);

	List<Favorite> findByUserIdOrderBySavedAtDesc(Long userId);

	void deleteByUserIdAndBusinessId(Long userId, Long businessId);
}
