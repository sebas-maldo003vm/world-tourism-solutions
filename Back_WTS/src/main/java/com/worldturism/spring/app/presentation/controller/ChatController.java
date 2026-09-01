package com.worldturism.spring.app.presentation.controller;

import com.worldturism.spring.app.application.service.SupportChatService;
import com.worldturism.spring.app.domain.model.AppUser;
import com.worldturism.spring.app.presentation.dto.ConversationResponse;
import com.worldturism.spring.app.presentation.dto.CreateSupportTicketRequest;
import com.worldturism.spring.app.presentation.dto.MessageResponse;
import com.worldturism.spring.app.presentation.dto.SendMessageRequest;
import com.worldturism.spring.app.presentation.dto.StartConversationRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@Tag(name = "Chat y Soporte", description = "Comunicación entre clientes, proveedores y soporte.")
public class ChatController {

	private final SupportChatService supportChatService;

	public ChatController(SupportChatService supportChatService) {
		this.supportChatService = supportChatService;
	}

	@GetMapping("/conversations")
	@Operation(summary = "Listar conversaciones del usuario autenticado")
	public List<ConversationResponse> listarConversaciones(@AuthenticationPrincipal AppUser user) {
		return supportChatService.listarConversaciones(user);
	}

	@PostMapping("/conversations")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Iniciar conversación con un proveedor")
	public ConversationResponse iniciarConversacion(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody StartConversationRequest request) {
		return supportChatService.iniciarConversacionConProveedor(user, request);
	}

	@GetMapping("/conversations/{conversationId}/messages")
	@Operation(summary = "Obtener historial de mensajes de una conversación")
	public List<MessageResponse> obtenerMensajes(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long conversationId) {
		return supportChatService.obtenerMensajes(user, conversationId);
	}

	@PostMapping("/conversations/{conversationId}/messages")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Enviar mensaje en una conversación")
	public MessageResponse enviarMensaje(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long conversationId,
			@Valid @RequestBody SendMessageRequest request) {
		return supportChatService.enviarMensaje(user, conversationId, request);
	}

	@PatchMapping("/conversations/{conversationId}/read")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Marcar mensajes como leídos")
	public void marcarComoLeido(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long conversationId) {
		supportChatService.marcarComoLeido(user, conversationId);
	}

	@PostMapping("/support")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Crear ticket de soporte")
	public SupportTicketResponse crearTicketSoporte(
			@AuthenticationPrincipal AppUser user,
			@Valid @RequestBody CreateSupportTicketRequest request) {
		return supportChatService.crearTicketSoporte(user, request);
	}

	@GetMapping("/support")
	@Operation(summary = "Listar tickets de soporte (solo ADMIN)")
	public List<SupportTicketResponse> listarTicketsSoporte(@AuthenticationPrincipal AppUser user) {
		return supportChatService.listarTicketsSoporte(user);
	}

	@PatchMapping("/support/{conversationId}/status")
	@Operation(summary = "Actualizar estado de ticket de soporte (solo ADMIN)")
	public SupportTicketResponse actualizarEstadoTicket(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long conversationId,
			@Valid @RequestBody UpdateSupportStatusRequest request) {
		return supportChatService.actualizarEstadoTicket(user, conversationId, request);
	}

	@PostMapping("/support/{conversationId}/messages")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Responder ticket de soporte (solo ADMIN)")
	public MessageResponse responderTicketSoporte(
			@AuthenticationPrincipal AppUser user,
			@PathVariable Long conversationId,
			@Valid @RequestBody SendMessageRequest request) {
		return supportChatService.responderTicketSoporte(user, conversationId, request);
	}
}
