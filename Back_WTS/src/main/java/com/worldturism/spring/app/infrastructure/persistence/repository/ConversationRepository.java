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

	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.provider p
			LEFT JOIN FETCH p.user
			LEFT JOIN FETCH c.user
			WHERE c.user.id = :userId
			  AND c.conversationType <> :botType
			  AND (c.subject IS NULL OR c.subject <> :botSubject)
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findHumanByUserIdOrderByLastMessageAtDesc(
			@Param("userId") Long userId,
			@Param("botType") ConversationType botType,
			@Param("botSubject") String botSubject);

	default List<Conversation> findByUserIdOrderByLastMessageAtDesc(Long userId) {
		return findHumanByUserIdOrderByLastMessageAtDesc(
				userId, ConversationType.CATALOG_INQUIRY, Conversation.BOT_SUBJECT);
	}

	List<Conversation> findByProviderIdOrderByLastMessageAtDesc(Long providerId);

	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.provider p
			LEFT JOIN FETCH p.user
			LEFT JOIN FETCH c.user
			WHERE p.user.id = :userId
			  AND c.conversationType <> :botType
			  AND (c.subject IS NULL OR c.subject <> :botSubject)
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findHumanByProviderUserIdOrderByLastMessageAtDesc(
			@Param("userId") Long userId,
			@Param("botType") ConversationType botType,
			@Param("botSubject") String botSubject);

	default List<Conversation> findByProvider_User_IdOrderByLastMessageAtDesc(Long userId) {
		return findHumanByProviderUserIdOrderByLastMessageAtDesc(
				userId, ConversationType.CATALOG_INQUIRY, Conversation.BOT_SUBJECT);
	}

	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.provider p
			LEFT JOIN FETCH p.user
			LEFT JOIN FETCH c.user
			WHERE c.conversationType IN :types
			  AND c.conversationType <> :botType
			  AND (c.subject IS NULL OR c.subject <> :botSubject)
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findHumanByConversationTypeInOrderByLastMessageAtDesc(
			@Param("types") List<ConversationType> types,
			@Param("botType") ConversationType botType,
			@Param("botSubject") String botSubject);

	default List<Conversation> findByConversationTypeInOrderByLastMessageAtDesc(List<ConversationType> types) {
		return findHumanByConversationTypeInOrderByLastMessageAtDesc(
				types, ConversationType.CATALOG_INQUIRY, Conversation.BOT_SUBJECT);
	}

	/** Conversaciones humanas cliente↔negocio para panel ADMIN/SUPPORT (sin bot). */
	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.provider p
			LEFT JOIN FETCH p.user
			LEFT JOIN FETCH c.user
			WHERE c.conversationType = :type
			  AND (c.subject IS NULL OR c.subject <> :botSubject)
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findHumanByConversationTypeOrderByLastMessageAtDesc(
			@Param("type") ConversationType type,
			@Param("botSubject") String botSubject);

	default List<Conversation> findHumanByConversationTypeOrderByLastMessageAtDesc(ConversationType type) {
		return findHumanByConversationTypeOrderByLastMessageAtDesc(type, Conversation.BOT_SUBJECT);
	}

	List<Conversation> findBySupportStatusOrderByLastMessageAtDesc(SupportStatus supportStatus);

	List<Conversation> findBySupportStatusInOrderByLastMessageAtDesc(List<SupportStatus> statuses);

	/**
	 * Inbox de asesores: tickets humanos sin asignar o asignados al staff indicado,
	 * excluyendo RESOLVED/CLOSED y chats del bot.
	 */
	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.user
			LEFT JOIN FETCH c.assignedAdvisor
			WHERE c.conversationType IN :types
			  AND c.conversationType <> :botType
			  AND (c.subject IS NULL OR c.subject <> :botSubject)
			  AND c.supportStatus NOT IN :excludedStatuses
			  AND (c.assignedAdvisor IS NULL OR c.assignedAdvisor.id = :advisorId)
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findSupportInboxForAdvisor(
			@Param("types") List<ConversationType> types,
			@Param("advisorId") Long advisorId,
			@Param("excludedStatuses") List<SupportStatus> excludedStatuses,
			@Param("botType") ConversationType botType,
			@Param("botSubject") String botSubject);

	default List<Conversation> findSupportInboxForAdvisor(
			List<ConversationType> types,
			Long advisorId,
			List<SupportStatus> excludedStatuses) {
		return findSupportInboxForAdvisor(
				types,
				advisorId,
				excludedStatuses,
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
