package com.worldturism.spring.app.service;

import com.worldturism.spring.app.model.AppUser;
import com.worldturism.spring.app.model.ProviderProfile;
import com.worldturism.spring.app.model.Role;
import com.worldturism.spring.app.repository.ProviderProfileRepository;
import com.worldturism.spring.app.view.dto.ProviderBusinessRequest;
import com.worldturism.spring.app.view.dto.ProviderResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProviderBusinessManager {

	private final ProviderProfileRepository providerProfileRepository;
	private final ImageStorageService imageStorageService;

	public ProviderBusinessManager(
			ProviderProfileRepository providerProfileRepository,
			ImageStorageService imageStorageService) {
		this.providerProfileRepository = providerProfileRepository;
		this.imageStorageService = imageStorageService;
	}

	@Transactional
	public ProviderResponse create(AppUser user, ProviderBusinessRequest request, List<MultipartFile> images) {
		validateProvider(user);

		List<String> imageUrls = imageStorageService.storeProviderBusinessImages(images);

		ProviderProfile profile = new ProviderProfile();
		profile.setBusinessName(request.businessName());
		profile.setTaxId(request.taxId());
		profile.setDescription(request.description());
		profile.setAddress(request.location());
		profile.setCity(request.city());
		profile.setCategory(request.category());
		profile.setPrice(normalizePrice(request.price()));
		profile.setWebsite(request.website());
		profile.setLogoUrl(imageUrls.get(0));
		profile.setImageUrls(imageUrls);
		profile.setUser(user);

		return ProviderResponse.from(providerProfileRepository.save(profile));
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
	public ProviderResponse update(AppUser user, Long businessId, ProviderBusinessRequest request, List<MultipartFile> images) {
		validateProvider(user);

		ProviderProfile profile = providerProfileRepository.findByIdAndUserId(businessId, user.getId())
				.orElseThrow(() -> new IllegalArgumentException("No existe un negocio con ese id para este proveedor."));

		profile.setBusinessName(request.businessName());
		profile.setTaxId(request.taxId());
		profile.setDescription(request.description());
		profile.setAddress(request.location());
		profile.setCity(request.city());
		profile.setCategory(request.category());
		profile.setPrice(normalizePrice(request.price()));
		profile.setWebsite(request.website());

		if (images != null && !images.isEmpty()) {
			List<String> oldImageUrls = List.copyOf(profile.getImageUrls());
			List<String> imageUrls = imageStorageService.storeProviderBusinessImages(images);
			profile.setLogoUrl(imageUrls.get(0));
			profile.setImageUrls(imageUrls);
			imageStorageService.deleteStoredImages(oldImageUrls);
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

	private String normalizePrice(String price) {
		if (price == null || price.isBlank()) {
			throw new IllegalArgumentException("El precio es obligatorio.");
		}

		String normalizedPrice = price.trim();
		if (!normalizedPrice.matches("\\d+(?:[.,]\\d+)*")) {
			throw new IllegalArgumentException("El precio debe tener un formato valido.");
		}
		return normalizedPrice;
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
