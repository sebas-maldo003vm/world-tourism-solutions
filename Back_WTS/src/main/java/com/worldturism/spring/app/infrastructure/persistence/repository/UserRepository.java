package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.AppUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, Long> {

	Optional<AppUser> findByEmail(String email);

	boolean existsByEmail(String email);

	java.util.List<AppUser> findAllByOrderByCreatedAtDesc();
}
