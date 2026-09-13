package com.worldturism.spring.app.infrastructure.config;

import java.util.List;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Normaliza sesiones del asistente virtual al esquema actual (sin columna is_bot_chat):
 * conversation_type = CATALOG_INQUIRY y subject = Asistente Virtual.
 */
@Component
@Profile("sqlite")
@Order(45)
public class SqliteConversationBotChatMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteConversationBotChatMigration(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!tableExists("conversations")) {
			return;
		}

		boolean hasBotChatColumn = hasColumn("conversations", "is_bot_chat");

		if (hasBotChatColumn) {
			jdbcTemplate.update("""
					UPDATE conversations
					SET conversation_type = 'CATALOG_INQUIRY',
					    subject = COALESCE(NULLIF(TRIM(subject), ''), 'Asistente Virtual')
					WHERE is_bot_chat = 1
					   OR subject = 'Asistente Virtual'
					   OR subject LIKE '%Asistente Virtual%'
					""");
		} else {
			jdbcTemplate.update("""
					UPDATE conversations
					SET conversation_type = 'CATALOG_INQUIRY'
					WHERE subject = 'Asistente Virtual'
					   OR subject LIKE '%Asistente Virtual%'
					""");
		}
	}

	private boolean hasColumn(String table, String column) {
		List<Map<String, Object>> columns = jdbcTemplate.queryForList("PRAGMA table_info(" + table + ")");
		return columns.stream().anyMatch(row -> column.equalsIgnoreCase(String.valueOf(row.get("name"))));
	}

	private boolean tableExists(String table) {
		Integer count = jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?",
				Integer.class,
				table);
		return count != null && count > 0;
	}
}
