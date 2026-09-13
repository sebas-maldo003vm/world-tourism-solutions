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
 * Añade conversations.assigned_advisor_id y normaliza tickets legacy a UNASSIGNED.
 */
@Component
@Profile("sqlite")
@Order(46)
public class SqliteConversationAssignedAdvisorMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteConversationAssignedAdvisorMigration(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!tableExists("conversations")) {
			return;
		}
		if (!hasColumn("conversations", "assigned_advisor_id")) {
			jdbcTemplate.execute(
					"ALTER TABLE conversations ADD COLUMN assigned_advisor_id INTEGER REFERENCES users(id)");
		}
		// Tickets humanos legacy en OPEN sin asesor → cola UNASSIGNED.
		// Excluye sesiones del asistente (CATALOG_INQUIRY / subject Asistente Virtual).
		jdbcTemplate.update("""
				UPDATE conversations
				SET support_status = 'UNASSIGNED'
				WHERE assigned_advisor_id IS NULL
				  AND support_status = 'OPEN'
				  AND conversation_type IN ('HUMAN_SUPPORT', 'CLIENT_TO_SUPPORT', 'PROVIDER_TO_SUPPORT')
				  AND conversation_type <> 'CATALOG_INQUIRY'
				  AND (subject IS NULL OR subject <> 'Asistente Virtual')
				""");
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
