package com.worldturism.spring.app.repository;

import com.worldturism.spring.app.model.ProviderProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {

	Optional<ProviderProfile> findFirstByUserIdOrderByIdAsc(Long userId);

	Optional<ProviderProfile> findByIdAndUserId(Long id, Long userId);

	List<ProviderProfile> findByUserIdOrderByIdDesc(Long userId);

	List<ProviderProfile> findAllByOrderByIdDesc();
}
