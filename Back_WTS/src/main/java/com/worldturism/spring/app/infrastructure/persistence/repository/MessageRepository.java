package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.Message;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {

	List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);

	java.util.Optional<Message> findTopByConversationIdOrderBySentAtDesc(Long conversationId);

	long countByConversationIdAndIsReadFalseAndSenderIdNot(Long conversationId, Long senderId);

	@Modifying
	@Query("UPDATE Message m SET m.isRead = true WHERE m.conversation.id = :conversationId AND m.sender.id <> :readerId AND m.isRead = false")
	int markAsReadForConversation(@Param("conversationId") Long conversationId, @Param("readerId") Long readerId);
}
