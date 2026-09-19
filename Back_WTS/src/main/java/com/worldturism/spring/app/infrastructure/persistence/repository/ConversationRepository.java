package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import com.worldturism.spring.app.domain.model.SupportStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

	Optional<Conversation> findByUserIdAndProviderIdAndConversationType(
			Long userId, Long providerId, ConversationType conversationType);

	List<Conversation> findByUserIdAndConversationTypeOrderByLastMessageAtDesc(
			Long userId, ConversationType conversationType);

	List<Conversation> findByProviderIdAndConversationTypeOrderByLastMessageAtDesc(
			Long providerId, ConversationType conversationType);

	/**
	 * Chats comerciales del turista emisor. Nunca incluye catálogo/bot ni tickets de soporte.
	 */
	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.provider p
			LEFT JOIN FETCH p.user
			LEFT JOIN FETCH c.user
			WHERE c.user.id = :userId
			  AND c.conversationType = :commercialType
			  AND c.conversationType <> :botType
			  AND (c.subject IS NULL OR c.subject <> :botSubject)
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findCommercialByClientUserId(
			@Param("userId") Long userId,
			@Param("commercialType") ConversationType commercialType,
			@Param("botType") ConversationType botType,
			@Param("botSubject") String botSubject);

	default List<Conversation> findCommercialByClientUserId(Long userId) {
		return findCommercialByClientUserId(
				userId,
				ConversationType.CLIENT_TO_PROVIDER,
				ConversationType.CATALOG_INQUIRY,
				Conversation.BOT_SUBJECT);
	}

	/**
	 * Chats comerciales de los perfiles del proveedor autenticado
	 * ({@code providerProfile.user.id}). No lista conversaciones de otros negocios.
	 */
	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.provider p
			LEFT JOIN FETCH p.user
			LEFT JOIN FETCH c.user
			WHERE p.user.id = :userId
			  AND c.conversationType = :commercialType
			  AND c.conversationType <> :botType
			  AND (c.subject IS NULL OR c.subject <> :botSubject)
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findCommercialByProviderUserId(
			@Param("userId") Long userId,
			@Param("commercialType") ConversationType commercialType,
			@Param("botType") ConversationType botType,
			@Param("botSubject") String botSubject);

	default List<Conversation> findCommercialByProviderUserId(Long userId) {
		return findCommercialByProviderUserId(
				userId,
				ConversationType.CLIENT_TO_PROVIDER,
				ConversationType.CATALOG_INQUIRY,
				Conversation.BOT_SUBJECT);
	}

	/**
	 * Tickets de soporte del cliente que los abrió ({@code user_id}).
	 * Excluye {@code CATALOG_INQUIRY} y sesiones del asistente.
	 */
	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.provider p
			LEFT JOIN FETCH p.user
			LEFT JOIN FETCH c.user
			LEFT JOIN FETCH c.assignedAdvisor
			WHERE c.user.id = :userId
			  AND c.conversationType IN :types
			  AND c.conversationType <> :botType
			  AND (c.subject IS NULL OR c.subject <> :botSubject)
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findSupportTicketsByOwner(
			@Param("userId") Long userId,
			@Param("types") List<ConversationType> types,
			@Param("botType") ConversationType botType,
			@Param("botSubject") String botSubject);

	default List<Conversation> findSupportTicketsByOwner(Long userId, List<ConversationType> types) {
		return findSupportTicketsByOwner(
				userId, types, ConversationType.CATALOG_INQUIRY, Conversation.BOT_SUBJECT);
	}

	/**
	 * Inbox de staff: solo tickets de soporte sin asignar en cola
	 * ({@code assigned_advisor_id IS NULL} y {@code support_status = UNASSIGNED})
	 * o asignados al asesor autenticado. Nunca chats comerciales ni del bot.
	 */
	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.user
			LEFT JOIN FETCH c.assignedAdvisor
			LEFT JOIN FETCH c.provider p
			LEFT JOIN FETCH p.user
			WHERE c.conversationType IN :types
			  AND c.conversationType <> :botType
			  AND (c.subject IS NULL OR c.subject <> :botSubject)
			  AND (
			        (c.assignedAdvisor IS NULL AND c.supportStatus = :unassignedStatus)
			        OR c.assignedAdvisor.id = :advisorId
			      )
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findStaffVisibleSupportTickets(
			@Param("types") List<ConversationType> types,
			@Param("advisorId") Long advisorId,
			@Param("unassignedStatus") SupportStatus unassignedStatus,
			@Param("botType") ConversationType botType,
			@Param("botSubject") String botSubject);

	default List<Conversation> findStaffVisibleSupportTickets(
			List<ConversationType> types, Long advisorId) {
		return findStaffVisibleSupportTickets(
				types,
				advisorId,
				SupportStatus.UNASSIGNED,
				ConversationType.CATALOG_INQUIRY,
				Conversation.BOT_SUBJECT);
	}

	Optional<Conversation> findFirstByUserIdAndConversationTypeAndSubjectAndSupportStatusNotInOrderByLastMessageAtDesc(
			Long userId,
			ConversationType conversationType,
			String subject,
			List<SupportStatus> excludedStatuses);

	Optional<Conversation> findFirstByUserIdAndConversationTypeAndSupportStatusNotInOrderByLastMessageAtDesc(
			Long userId,
			ConversationType conversationType,
			List<SupportStatus> excludedStatuses);

	long countByUserIdAndConversationType(Long userId, ConversationType conversationType);
}
