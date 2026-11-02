package com.worldturism.spring.app.infrastructure.storage;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SupabasePublicUrlValidator {

	static final int MAX_GALLERY_IMAGES = 10;
	private static final int MAX_GALLERY_URL_LENGTH = 300;
	private static final int MAX_PROFILE_URL_LENGTH = 255;
	private static final String USER_AVATARS = "user-avatars";
	private static final String SERVICE_GALLERY = "service-gallery";

	private final String supabaseUrl;

	public SupabasePublicUrlValidator(@Value("${app.supabase.url}") String supabaseUrl) {
		this.supabaseUrl = stripTrailingSlash(supabaseUrl);
	}

	public String requireProfilePictureUrl(String profilePictureUrl) {
		return requirePublicObjectUrl(profilePictureUrl, USER_AVATARS, MAX_PROFILE_URL_LENGTH);
	}

	public List<String> requireGalleryUrls(List<String> imageUrls, List<String> alreadyStored) {
		if (imageUrls == null || imageUrls.isEmpty()) {
			throw new IllegalArgumentException("Debes adjuntar al menos una imagen.");
		}
		if (imageUrls.size() > MAX_GALLERY_IMAGES) {
			throw new IllegalArgumentException("No puedes adjuntar mas de 10 imagenes.");
		}

		Set<String> stored = alreadyStored == null ? Set.of() : new HashSet<>(alreadyStored);
		List<String> normalized = new ArrayList<>();

		for (String imageUrl : imageUrls) {
			String value = imageUrl == null ? "" : imageUrl.trim();
			if (stored.contains(value)) {
				normalized.add(value);
				continue;
			}
			normalized.add(requirePublicObjectUrl(value, SERVICE_GALLERY, MAX_GALLERY_URL_LENGTH));
		}

		return List.copyOf(normalized);
	}

	private String requirePublicObjectUrl(String url, String bucket, int maxLength) {
		if (url == null || url.isBlank()) {
			throw new IllegalArgumentException("La URL de la imagen es obligatoria.");
		}

		String normalized = url.trim();
		if (normalized.length() > maxLength) {
			throw new IllegalArgumentException("La URL de la imagen es demasiado larga.");
		}

		String prefix = supabaseUrl + "/storage/v1/object/public/" + bucket + "/";
		if (!normalized.startsWith(prefix)
				|| normalized.contains("..")
				|| normalized.contains("?")
				|| normalized.contains("#")
				|| normalized.contains("\\")) {
			throw new IllegalArgumentException("La URL no pertenece al almacenamiento de imagenes permitido.");
		}

		String objectName = normalized.substring(prefix.length());
		if (objectName.isBlank() || !objectName.matches("[A-Za-z0-9._-]+")) {
			throw new IllegalArgumentException("El nombre del archivo almacenado no es valido.");
		}

		return normalized;
	}

	private String stripTrailingSlash(String value) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException("app.supabase.url no esta configurada.");
		}

		String normalized = value.trim();
		while (normalized.endsWith("/")) {
			normalized = normalized.substring(0, normalized.length() - 1);
		}
		return normalized;
	}
}
