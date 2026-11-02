package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.AppUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, Long> {

	Optional<AppUser> findByEmail(String email);

	Optional<AppUser> findByAuthUserId(UUID authUserId);

	boolean existsByEmail(String email);

	java.util.List<AppUser> findAllByOrderByCreatedAtDesc();
}
