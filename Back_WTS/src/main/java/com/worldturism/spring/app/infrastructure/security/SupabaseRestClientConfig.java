package com.worldturism.spring.app.infrastructure.security;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class SupabaseRestClientConfig {

	@Bean
	public RestClient supabaseRestClient(@Value("${app.supabase.url}") String supabaseUrl) {
		// El HttpClient del JDK negocia HTTP/2 con Cloudflare. En Windows ese socket
		// se corta contra Supabase (connection reset). HTTP/1.1 lo evita.
		HttpClient httpClient = HttpClient.newBuilder()
				.version(HttpClient.Version.HTTP_1_1)
				.connectTimeout(Duration.ofSeconds(10))
				.followRedirects(HttpClient.Redirect.NORMAL)
				.build();

		JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
		requestFactory.setReadTimeout(Duration.ofSeconds(20));

		return RestClient.builder()
				.baseUrl(normalizeBaseUrl(supabaseUrl))
				.requestFactory(requestFactory)
				.build();
	}

	private static String normalizeBaseUrl(String supabaseUrl) {
		String baseUrl = supabaseUrl == null ? "" : supabaseUrl.trim();
		if (baseUrl.endsWith("/")) {
			return baseUrl.substring(0, baseUrl.length() - 1);
		}
		return baseUrl;
	}
}
