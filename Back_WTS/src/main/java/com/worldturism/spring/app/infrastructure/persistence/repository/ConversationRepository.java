package com.worldturism.spring.app.infrastructure.persistence.repository;

import com.worldturism.spring.app.domain.model.Conversation;
import com.worldturism.spring.app.domain.model.ConversationType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

	Optional<Conversation> findByUserIdAndProviderIdAndServiceIdAndConversationType(
			Long userId, Long providerId, Long serviceId, ConversationType conversationType);

	List<Conversation> findByUserIdAndConversationTypeOrderByLastMessageAtDesc(
			Long userId, ConversationType conversationType);

	List<Conversation> findByProviderIdAndConversationTypeOrderByLastMessageAtDesc(
			Long providerId, ConversationType conversationType);

	List<Conversation> findByUserIdOrderByLastMessageAtDesc(Long userId);

	List<Conversation> findByProviderIdOrderByLastMessageAtDesc(Long providerId);

	List<Conversation> findByConversationTypeInOrderByLastMessageAtDesc(List<ConversationType> types);

	long countByUserIdAndConversationType(Long userId, ConversationType conversationType);
}
