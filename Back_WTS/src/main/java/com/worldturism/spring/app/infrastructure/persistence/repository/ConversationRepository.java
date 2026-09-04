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
			LEFT JOIN FETCH c.provider
			LEFT JOIN FETCH c.user
			WHERE c.user.id = :userId
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findByUserIdOrderByLastMessageAtDesc(@Param("userId") Long userId);

	List<Conversation> findByProviderIdOrderByLastMessageAtDesc(Long providerId);

	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.provider p
			LEFT JOIN FETCH p.user
			LEFT JOIN FETCH c.user
			WHERE p.user.id = :userId
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findByProvider_User_IdOrderByLastMessageAtDesc(@Param("userId") Long userId);

	@Query("""
			SELECT DISTINCT c FROM Conversation c
			LEFT JOIN FETCH c.provider
			LEFT JOIN FETCH c.user
			WHERE c.conversationType IN :types
			ORDER BY c.lastMessageAt DESC
			""")
	List<Conversation> findByConversationTypeInOrderByLastMessageAtDesc(
			@Param("types") List<ConversationType> types);

	List<Conversation> findBySupportStatusOrderByLastMessageAtDesc(SupportStatus supportStatus);

	List<Conversation> findBySupportStatusInOrderByLastMessageAtDesc(List<SupportStatus> statuses);

	Optional<Conversation> findFirstByUserIdAndConversationTypeAndSubjectAndSupportStatusNotInOrderByLastMessageAtDesc(
			Long userId,
			ConversationType conversationType,
			String subject,
			List<SupportStatus> excludedStatuses);

	long countByUserIdAndConversationType(Long userId, ConversationType conversationType);
}
