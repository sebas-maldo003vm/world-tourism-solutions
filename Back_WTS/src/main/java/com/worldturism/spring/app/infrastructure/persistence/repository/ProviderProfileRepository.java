package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {

	Optional<ProviderProfile> findFirstByUserIdOrderByIdAsc(Long userId);

	Optional<ProviderProfile> findByIdAndUserId(Long id, Long userId);

	List<ProviderProfile> findByUserIdOrderByIdDesc(Long userId);

	@Query("SELECT p FROM ProviderProfile p JOIN FETCH p.user ORDER BY p.id DESC")
	List<ProviderProfile> findAllByOrderByIdDesc();

	List<ProviderProfile> findByStatusOrderByIdDesc(ServiceStatus status);

@Query(value = """
			SELECT p.*
			FROM provider_profiles p
			WHERE p.status = 'APPROVED'
			  AND p.location IS NOT NULL
			  AND ST_DWithin(
			        p.location,
			        CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography),
			        :radiusMeters)
			ORDER BY p.id DESC
			""", nativeQuery = true)
	List<ProviderProfile> findApprovedWithinRadius(
			@Param("lat") double lat,
			@Param("lng") double lng,
			@Param("radiusMeters") double radiusMeters);


	long countByStatus(ServiceStatus status);
}
