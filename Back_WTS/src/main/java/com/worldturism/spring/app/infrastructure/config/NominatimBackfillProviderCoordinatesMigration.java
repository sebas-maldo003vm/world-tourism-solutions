package com.worldturism.spring.app.infrastructure.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Backfill de coordenadas para provider_profiles creados ANTES de la Fase 3
 * (cuando todavía no existía el LocationPicker). Usa geocoding por ciudad
 * contra Nominatim (OpenStreetMap), una sola vez por negocio.
 *
 * Es idempotente: solo procesa negocios con latitude IS NULL, así que en
 * arranques posteriores (una vez completado el backfill) no hace nada.
 *
 * El proveedor siempre puede ajustar la ubicación exacta después,
 * editando su servicio con el LocationPicker (marker arrastrable).
 */
@Component
@Order(60)
public class NominatimBackfillProviderCoordinatesMigration implements ApplicationRunner {

	// IMPORTANTE: Nominatim exige un User-Agent identificable con contacto real.
	// Reemplaza el email antes de correr esto en un entorno que no sea tu máquina de desarrollo.
	private static final String USER_AGENT =
			"WorldTourismSolutions/1.0 (johansebastian224@gmail.com)";

	private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

	private final JdbcTemplate jdbcTemplate;
	private final HttpClient httpClient = HttpClient.newHttpClient();
	private final ObjectMapper objectMapper = new ObjectMapper();

	public NominatimBackfillProviderCoordinatesMigration(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		List<Map<String, Object>> pending = jdbcTemplate.queryForList("""
				SELECT id, city FROM provider_profiles
				WHERE latitude IS NULL
				  AND city IS NOT NULL
				  AND trim(city) <> ''
				""");

		if (pending.isEmpty()) {
			return;
		}

		System.out.println("[BackfillCoordinates] " + pending.size()
				+ " negocio(s) sin coordenadas. Iniciando geocoding por ciudad...");

		for (Map<String, Object> row : pending) {
			Long id = ((Number) row.get("id")).longValue();
			String city = String.valueOf(row.get("city"));

			double[] coords = geocodeCity(city);

			if (coords != null) {
				jdbcTemplate.update(
						"UPDATE provider_profiles SET latitude = ?, longitude = ? WHERE id = ?",
						coords[0], coords[1], id);
				System.out.println("[BackfillCoordinates] id=" + id + " (" + city + ") -> "
						+ coords[0] + ", " + coords[1]);
			} else {
				System.out.println("[BackfillCoordinates] id=" + id + " (" + city
						+ ") -> sin resultado de Nominatim, se deja NULL");
			}

			// Respeta el límite de 1 petición/segundo de la política de uso de Nominatim.
			Thread.sleep(1100);
		}

		System.out.println("[BackfillCoordinates] Backfill completado.");
	}

	private double[] geocodeCity(String city) {
		try {
			String query = city + ", Colombia";
			String url = NOMINATIM_URL
					+ "?format=json&limit=1&countrycodes=co&q="
					+ URLEncoder.encode(query, StandardCharsets.UTF_8);

			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(url))
					.header("User-Agent", USER_AGENT)
					.GET()
					.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

			JsonNode results = objectMapper.readTree(response.body());
			if (!results.isArray() || results.isEmpty()) {
				return null;
			}

			JsonNode first = results.get(0);
			double lat = Double.parseDouble(first.get("lat").asText());
			double lon = Double.parseDouble(first.get("lon").asText());
			return new double[] { lat, lon };
		} catch (Exception exception) {
			System.err.println("[BackfillCoordinates] Error geocodificando '" + city + "': "
					+ exception.getMessage());
			return null;
		}
	}
}
