package com.worldturism.spring.app.application.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

    private static final String SYSTEM_INSTRUCTION = 
        "Eres el asistente virtual oficial de World Tourism Solutions (WTS), una plataforma turística integral para Bogotá y Cundinamarca. " +
        "Tu objetivo es guiar a los usuarios (Turistas y Proveedores) respondiendo basándote ESTRICTAMENTE en el siguiente manual oficial de la aplicación:\n\n" +
        
        "--- MÓDULO TURISTA (USER) ---\n" +
        "- Registro: Requiere aceptar términos, Ley 1581 de 2012 y autorización de geolocalización.\n" +
        "- Recuperación de contraseña: A través de correo, redirige a /update-password.\n" +
        "- Catálogo y Mapa: Usa Leaflet, filtro de proximidad por radio (km) y coordenadas GPS.\n" +
        "- Favoritos: Se guardan desde el ícono de corazón en las tarjetas y se consultan en el perfil.\n" +
        "- Reservas: Al solicitar una reserva (fecha, número de personas, comentarios), queda en estado PENDING a la espera de aprobación del proveedor.\n" +
        "- Itinerario: En la sección /itinerary se ven las reservas (Pendientes, Aprobadas, Completadas) agrupadas por ciudad con calendario interactivo.\n\n" +

        "--- MÓDULO PROVEEDOR (PROVIDER) ---\n" +
        "- Gestión de Servicios: Se administran en /dashboard-accesor. Toda publicación nueva o editada entra en estado PENDING hasta que un ADMIN la apruebe.\n" +
        "- Control de Reservas: Los proveedores pueden Aprobar o Rechazar reservas entrantes.\n" +
        "- Analítica: En /analitica se integra un tablero de Looker Studio con métricas de visualizaciones, clics, búsquedas y embudo de conversión.\n\n" +

        "Instrucciones de comportamiento:\n" +
        "1. Responde de manera amable, clara y concisa en español.\n" +
        "2. Menciona las rutas o secciones de la app cuando sea relevante (ej: /itinerary, /analitica, /dashboard-accesor).\n" +
        "3. Si la duda no se resuelve con este manual o es un problema complejo, sugiérele amablemente utilizar el botón 'Hablar con un asesor' para generar un ticket humano.";

    public String generarRespuestaNatural(String mensajeUsuario) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", SYSTEM_INSTRUCTION + "\n\nPregunta del usuario: " + mensajeUsuario)
                    ))
                )
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            // CORREGIDO: Se usa MODEL_URL y se concatena correctamente la apiKey con ?key=
            String requestUrl = MODEL_URL + "?key=" + apiKey;
            ResponseEntity response = restTemplate.postForEntity(requestUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object bodyObj = response.getBody();
                if (bodyObj instanceof Map) {
                    Map<String, Object> responseBody = (Map<String, Object>) bodyObj;
                    Object candidatesObj = responseBody.get("candidates");
                    
                    if (candidatesObj instanceof List) {
                        List<Object> candidates = (List<Object>) candidatesObj;
                        if (!candidates.isEmpty() && candidates.get(0) instanceof Map) {
                            Map<String, Object> candidateMap = (Map<String, Object>) candidates.get(0);
                            Object contentObj = candidateMap.get("content");
                            
                            if (contentObj instanceof Map) {
                                Map<String, Object> contentMap = (Map<String, Object>) contentObj;
                                Object partsObj = contentMap.get("parts");
                                
                                if (partsObj instanceof List) {
                                    List<Object> parts = (List<Object>) partsObj;
                                    if (!parts.isEmpty() && parts.get(0) instanceof Map) {
                                        Map<String, Object> partMap = (Map<String, Object>) parts.get(0);
                                        Object textObj = partMap.get("text");
                                        
                                        if (textObj instanceof String) {
                                            return (String) textObj;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error al comunicarse con la API de Gemini: " + e.getMessage());
        }
        
        return "Disculpa, en este momento tengo problemas de conexión con el servicio cognitivo, pero puedo conectarte con un asesor humano si lo deseas.";
    }
}