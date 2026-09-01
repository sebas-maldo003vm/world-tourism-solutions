package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.FavoriteService;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.presentation.dto.FavoriteResponse;
import com.worldturism.spring.app.presentation.dto.FavoriteStatusResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
@Tag(name = "Favoritos", description = "Gestion de sitios y servicios favoritos del usuario.")
public class FavoritesController {

	private final FavoriteService favoriteService;

	public FavoritesController(FavoriteService favoriteService) {
		this.favoriteService = favoriteService;
	}

	@PostMapping("/{businessId}")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Agregar favorito")
	public FavoriteResponse agregarFavorito(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long businessId) {
		return favoriteService.agregarFavorito(user, businessId);
	}

	@DeleteMapping("/{businessId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Quitar favorito")
	public void quitarFavorito(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long businessId) {
		favoriteService.quitarFavorito(user, businessId);
	}

	@GetMapping
	@Operation(summary = "Listar favoritos del usuario")
	public List<FavoriteResponse> obtenerFavoritos(@AuthenticationPrincipal AppUser user) {
		return favoriteService.obtenerFavoritosPorUsuario(user);
	}

	@GetMapping("/{businessId}/status")
	@Operation(summary = "Verificar si un sitio es favorito")
	public FavoriteStatusResponse esFavorito(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long businessId) {
		return favoriteService.esFavorito(user, businessId);
	}
}
