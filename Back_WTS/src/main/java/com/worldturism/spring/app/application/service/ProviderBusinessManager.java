package com.worldturism.spring.app.application.service;

import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.domain.model.ProviderProfile;
import com.worldturism.spring.app.domain.model.Role;
import com.worldturism.spring.app.domain.model.ServiceStatus;
import com.worldturism.spring.app.infrastructure.persistence.repository.ProviderProfileRepository;
import com.worldturism.spring.app.infrastructure.storage.ImageStorageService;
import com.worldturism.spring.app.infrastructure.storage.SupabasePublicUrlValidator;
import com.worldturism.spring.app.presentation.dto.ProviderBusinessRequest;
import com.worldturism.spring.app.presentation.dto.ProviderResponse;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProviderBusinessManager {

	private final ProviderProfileRepository providerProfileRepository;
	private final ImageStorageService imageStorageService;
	private final SupabasePublicUrlValidator supabasePublicUrlValidator;

	public ProviderBusinessManager(
			ProviderProfileRepository providerProfileRepository,
			ImageStorageService imageStorageService,
			SupabasePublicUrlValidator supabasePublicUrlValidator) {
		this.providerProfileRepository = providerProfileRepository;
		this.imageStorageService = imageStorageService;
		this.supabasePublicUrlValidator = supabasePublicUrlValidator;
	}

	@Transactional
	public ProviderResponse create(AppUser user, ProviderBusinessRequest request) {
		validateProvider(user);

		List<String> imageUrls = supabasePublicUrlValidator.requireGalleryUrls(request.imageUrls(), List.of());

		ProviderProfile profile = new ProviderProfile();
		profile.setBusinessName(request.businessName());
		profile.setTaxId(request.taxId());
		profile.setDescription(request.description());
		profile.setAddress(request.location());
		profile.setCity(request.city());
		profile.setCategory(request.category());
		profile.setPrice(parsePrice(request.price()));
		profile.setWebsite(request.website());
		profile.setLatitude(parseCoordinate(request.latitude()));
profile.setLongitude(parseCoordinate(request.longitude()));
		profile.setLogoUrl(imageUrls.get(0));
		profile.setImageUrls(imageUrls);
		profile.setStatus(ServiceStatus.PENDING);
		profile.setUser(user);

		return ProviderResponse.from(providerProfileRepository.save(profile));
	}
	private Double parseCoordinate(String value) {
    if (value == null || value.isBlank()) {
        return null;
    }
    try {
        return Double.parseDouble(value.trim());
    } catch (NumberFormatException exception) {
        throw new IllegalArgumentException("La coordenada debe tener un formato valido.");
    }
}

	@Transactional(readOnly = true)
	public List<ProviderResponse> listMyBusinesses(AppUser user) {
		validateProvider(user);

		return providerProfileRepository.findByUserIdOrderByIdDesc(user.getId())
				.stream()
				.map(ProviderResponse::from)
				.toList();
	}

	@Transactional
	public ProviderResponse update(AppUser user, Long businessId, ProviderBusinessRequest request) {
		validateProvider(user);

		ProviderProfile profile = providerProfileRepository.findByIdAndUserId(businessId, user.getId())
				.orElseThrow(() -> new IllegalArgumentException("No existe un negocio con ese id para este proveedor."));

		profile.setBusinessName(request.businessName());
		profile.setTaxId(request.taxId());
		profile.setDescription(request.description());
		profile.setAddress(request.location());
		profile.setCity(request.city());
		profile.setCategory(request.category());
		profile.setPrice(parsePrice(request.price()));
		profile.setWebsite(request.website());
		profile.setLatitude(parseCoordinate(request.latitude()));
		profile.setLongitude(parseCoordinate(request.longitude()));

		if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
			List<String> oldImageUrls = List.copyOf(profile.getImageUrls());
			List<String> imageUrls = supabasePublicUrlValidator.requireGalleryUrls(
					request.imageUrls(),
					oldImageUrls);
			profile.setLogoUrl(imageUrls.get(0));
			profile.setImageUrls(imageUrls);
			imageStorageService.deleteStoredImages(
					oldImageUrls.stream().filter(url -> !imageUrls.contains(url)).toList());
		}

		return ProviderResponse.from(providerProfileRepository.save(profile));
	}

	@Transactional
	public void delete(AppUser user, Long businessId) {
		validateProvider(user);

		ProviderProfile providerProfile = providerProfileRepository.findByIdAndUserId(businessId, user.getId())
				.orElseThrow(() -> new IllegalArgumentException("No existe un negocio con ese id para este proveedor."));

		imageStorageService.deleteStoredImages(providerProfile.getImageUrls());
		providerProfileRepository.delete(providerProfile);
	}

	private BigDecimal parsePrice(String price) {
		if (price == null || price.isBlank()) {
			throw new IllegalArgumentException("El precio es obligatorio.");
		}

		String normalizedPrice = price.trim().replace(" ", "");
		if (normalizedPrice.contains(",")) {
			normalizedPrice = normalizedPrice.replace(".", "").replace(",", ".");
		}

		try {
			BigDecimal parsedPrice = new BigDecimal(normalizedPrice);
			if (parsedPrice.compareTo(BigDecimal.ZERO) < 0) {
				throw new IllegalArgumentException("El precio no puede ser negativo.");
			}
			return parsedPrice;
		} catch (NumberFormatException exception) {
			throw new IllegalArgumentException("El precio debe tener un formato valido.");
		}
	}

	private void validateProvider(AppUser user) {
		if (user == null) {
			throw new IllegalArgumentException("Usuario no autenticado.");
		}
		if (user.getRole() != Role.PROVIDER) {
			throw new IllegalArgumentException("Solo los proveedores pueden registrar negocios.");
		}
	}
}
