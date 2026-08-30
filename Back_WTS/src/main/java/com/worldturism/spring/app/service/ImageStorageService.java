package com.worldturism.spring.app.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageStorageService {

	private static final int MAX_PROVIDER_BUSINESS_IMAGES = 10;
	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
			"image/jpeg",
			"image/png",
			"image/webp");

	private final Path uploadRoot;

	public ImageStorageService(@Value("${app.upload-dir:uploads}") String uploadDir) {
		this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
	}

	public List<String> storeProviderBusinessImages(List<MultipartFile> images) {
		validateImages(images);

		return images.stream()
				.map(image -> store(image, "provider-business"))
				.toList();
	}

	public void deleteStoredImages(List<String> imageUrls) {
		if (imageUrls == null) {
			return;
		}

		for (String imageUrl : imageUrls) {
			deleteStoredImage(imageUrl);
		}
	}

	private String store(MultipartFile image, String folder) {
		String extension = getExtension(image.getOriginalFilename());
		String filename = UUID.randomUUID() + extension;
		Path targetDirectory = uploadRoot.resolve(folder).normalize();
		Path targetFile = targetDirectory.resolve(filename).normalize();

		if (!targetFile.startsWith(targetDirectory)) {
			throw new IllegalArgumentException("Nombre de archivo invalido.");
		}

		try {
			Files.createDirectories(targetDirectory);
			try (InputStream inputStream = image.getInputStream()) {
				Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
			}
		} catch (IOException exception) {
			throw new IllegalArgumentException("No se pudo guardar la imagen.");
		}

		return "/uploads/" + folder + "/" + filename;
	}

	private void deleteStoredImage(String imageUrl) {
		if (imageUrl == null || !imageUrl.startsWith("/uploads/")) {
			return;
		}

		Path targetFile = uploadRoot.resolve(imageUrl.substring("/uploads/".length())).normalize();
		if (!targetFile.startsWith(uploadRoot)) {
			return;
		}

		try {
			Files.deleteIfExists(targetFile);
		} catch (IOException exception) {
			// The database delete should not fail only because the local file was already removed.
		}
	}

	private void validateImages(List<MultipartFile> images) {
		if (images == null || images.isEmpty()) {
			throw new IllegalArgumentException("Debes adjuntar al menos una imagen.");
		}
		if (images.size() > MAX_PROVIDER_BUSINESS_IMAGES) {
			throw new IllegalArgumentException("No puedes adjuntar mas de 10 imagenes.");
		}

		for (MultipartFile image : images) {
			if (image == null || image.isEmpty()) {
				throw new IllegalArgumentException("Las imagenes no pueden estar vacias.");
			}
			if (!ALLOWED_CONTENT_TYPES.contains(image.getContentType())) {
				throw new IllegalArgumentException("Solo se permiten imagenes JPG, PNG o WEBP.");
			}
		}
	}

	private String getExtension(String filename) {
		if (filename == null || !filename.contains(".")) {
			return "";
		}

		String extension = filename.substring(filename.lastIndexOf(".")).toLowerCase(Locale.ROOT);
		if (extension.equals(".jpg") || extension.equals(".jpeg") || extension.equals(".png") || extension.equals(".webp")) {
			return extension;
		}
		return "";
	}
}
