package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.FavoriteService;
import com.worldturism.spring.app.presentation.dto.FavoriteResponse;
import com.worldturism.spring.app.presentation.dto.FavoriteStatusResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Favoritos", description = "Favoritos aislados por usuario JWT (ProviderProfile).")
public class FavoritesController {

	private final FavoriteService favoriteService;

	public FavoritesController(FavoriteService favoriteService) {
		this.favoriteService = favoriteService;
	}

	@PostMapping("/{providerProfileId}")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Agregar favorito del usuario autenticado")
	public FavoriteResponse agregarFavorito(@PathVariable Long providerProfileId) {
		return favoriteService.agregarFavorito(providerProfileId);
	}

	@DeleteMapping("/{providerProfileId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Quitar favorito del usuario autenticado")
	public void quitarFavorito(@PathVariable Long providerProfileId) {
		favoriteService.quitarFavorito(providerProfileId);
	}

	@GetMapping
	@Operation(summary = "Listar solo los ProviderProfile favoritos del caller JWT")
	public List<FavoriteResponse> obtenerFavoritos() {
		return favoriteService.obtenerFavoritosDelUsuarioAutenticado();
	}

	@GetMapping("/{providerProfileId}/status")
	@Operation(summary = "Verificar favorito del usuario autenticado")
	public FavoriteStatusResponse esFavorito(@PathVariable Long providerProfileId) {
		return favoriteService.esFavorito(providerProfileId);
	}
}
