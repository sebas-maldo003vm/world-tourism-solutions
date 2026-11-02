package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.SupportChatService;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.presentation.dto.CreateSupportTicketRequest;
import com.worldturism.spring.app.presentation.dto.MessageResponse;
import com.worldturism.spring.app.presentation.dto.SendMessageRequest;
import com.worldturism.spring.app.presentation.dto.SupportTicketResponse;
import com.worldturism.spring.app.presentation.dto.UpdateSupportStatusRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Enrutamiento de soporte humano: apertura de tickets, asignación a asesores e inbox de staff.
 */
@RestController
@RequestMapping("/api/support/conversations")
@Tag(name = "Soporte humano", description = "Ticketing y enrutamiento a asesores SUPPORT/ADMIN.")
public class SupportController {

	private final SupportChatService supportChatService;

	public SupportController(SupportChatService supportChatService) {
		this.supportChatService = supportChatService;
	}

	@PostMapping("/open")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Abrir conversación de soporte humano (status UNASSIGNED)")
	public SupportTicketResponse abrirConversacion(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody CreateSupportTicketRequest request) {
		return supportChatService.abrirConversacionSoporte(user, request);
	}

	@PutMapping("/{id}/assign")
	@Operation(summary = "Reclamar/asignar conversación al asesor autenticado (SUPPORT / ADMIN)")
	public SupportTicketResponse asignarConversacion(
			@AuthenticationPrincipal AppUser user,
			@PathVariable("id") Long conversationId) {
		return supportChatService.asignarConversacionSoporte(user, conversationId);
	}

	@GetMapping("/inbox")
	@Operation(summary = "Inbox de soporte: tickets sin asignar o asignados al asesor (SUPPORT / ADMIN)")
	public List<SupportTicketResponse> listarInbox(@AuthenticationPrincipal AppUser user) {
		return supportChatService.listarInboxSoporte(user);
	}

	@PatchMapping("/{id}/status")
	@Operation(summary = "Actualizar estado y/o urgencia del ticket (ADMIN / SUPPORT)")
	public SupportTicketResponse actualizarEstado(
			@AuthenticationPrincipal AppUser user,
			@PathVariable("id") Long conversationId,
			@Valid @RequestBody UpdateSupportStatusRequest request) {
		return supportChatService.actualizarEstadoTicket(user, conversationId, request);
	}

	@PostMapping("/{id}/messages")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Responder ticket de soporte (ADMIN / SUPPORT)")
	public MessageResponse responderTicket(
			@AuthenticationPrincipal AppUser user,
			@PathVariable("id") Long conversationId,
			@Valid @RequestBody SendMessageRequest request) {
		return supportChatService.responderTicketSoporte(user, conversationId, request);
	}
}
