package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.Favorite;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

	@Query("""
			SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END
			FROM Favorite f
			WHERE f.user.id = :userId AND f.providerProfile.id = :providerProfileId
			""")
	boolean existsByUserIdAndProviderProfileId(
			@Param("userId") Long userId,
			@Param("providerProfileId") Long providerProfileId);

	@Query("""
			SELECT f FROM Favorite f
			JOIN FETCH f.providerProfile
			WHERE f.user.id = :userId AND f.providerProfile.id = :providerProfileId
			""")
	Optional<Favorite> findByUserIdAndProviderProfileId(
			@Param("userId") Long userId,
			@Param("providerProfileId") Long providerProfileId);

	@Query("""
			SELECT f FROM Favorite f
			JOIN FETCH f.providerProfile
			WHERE f.user.id = :userId
			ORDER BY f.savedAt DESC
			""")
	List<Favorite> findByUserId(@Param("userId") Long userId);

	void deleteByUserIdAndProviderProfileId(Long userId, Long providerProfileId);
}
