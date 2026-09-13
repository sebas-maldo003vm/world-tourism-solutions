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
 * Alinea conversations.provider_id con provider_profiles.id (antes apuntaba a users.id)
 * y permite valores nulos para chatbot / soporte.
 */
@Component
@Profile("sqlite")
@Order(40)
public class SqliteConversationProviderNullableMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteConversationProviderNullableMigration(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!needsMigration()) {
			return;
		}

		String remappedProviderId = """
				CASE
					WHEN provider_id IS NULL THEN NULL
					WHEN service_id IS NOT NULL THEN (
						SELECT provider_id FROM services WHERE services.id = conversations.service_id
					)
					ELSE (
						SELECT id FROM provider_profiles
						WHERE provider_profiles.user_id = conversations.provider_id
						ORDER BY id ASC
						LIMIT 1
					)
				END
				""";

		if (!referencesUsers(providerFkTable())) {
			remappedProviderId = "provider_id";
		}

		jdbcTemplate.execute("PRAGMA foreign_keys=OFF");
		try {
			jdbcTemplate.execute("""
					CREATE TABLE conversations_new (
						id integer primary key autoincrement,
						created_at timestamp not null,
						last_message_at timestamp not null,
						conversation_type varchar(30) not null,
						support_status varchar(30),
						urgency varchar(10),
						subject varchar(200),
						user_id bigint not null,
						provider_id bigint,
						service_id bigint,
						foreign key(user_id) references users(id),
						foreign key(provider_id) references provider_profiles(id),
						foreign key(service_id) references services(id)
					)
					""");
			jdbcTemplate.execute("""
					INSERT INTO conversations_new (
						id,
						created_at,
						last_message_at,
						conversation_type,
						support_status,
						urgency,
						subject,
						user_id,
						provider_id,
						service_id
					)
					SELECT
						id,
						created_at,
						last_message_at,
						conversation_type,
						support_status,
						urgency,
						subject,
						user_id,
						%s,
						service_id
					FROM conversations
					""".formatted(remappedProviderId));
			jdbcTemplate.execute("DROP TABLE conversations");
			jdbcTemplate.execute("ALTER TABLE conversations_new RENAME TO conversations");
		} finally {
			jdbcTemplate.execute("PRAGMA foreign_keys=ON");
		}
	}

	private boolean needsMigration() {
		if (!tableExists("conversations") || !hasColumn("conversations", "provider_id")) {
			return false;
		}
		return isNotNullColumn("conversations", "provider_id") || referencesUsers(providerFkTable());
	}

	private String providerFkTable() {
		try {
			List<Map<String, Object>> fks = jdbcTemplate.queryForList("PRAGMA foreign_key_list(conversations)");
			for (Map<String, Object> fk : fks) {
				if ("provider_id".equals(String.valueOf(fk.get("from")))) {
					return String.valueOf(fk.get("table"));
				}
			}
		} catch (RuntimeException ignored) {
			// ignore
		}
		return "";
	}

	private boolean referencesUsers(String table) {
		return "users".equalsIgnoreCase(table);
	}

	private boolean tableExists(String tableName) {
		try {
			return !jdbcTemplate.queryForList(
					"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
					tableName).isEmpty();
		} catch (RuntimeException exception) {
			return false;
		}
	}

	private boolean hasColumn(String tableName, String columnName) {
		return columnInfo(tableName).stream()
				.anyMatch(column -> columnName.equals(column.get("name")));
	}

	private boolean isNotNullColumn(String tableName, String columnName) {
		return columnInfo(tableName).stream()
				.filter(column -> columnName.equals(column.get("name")))
				.findFirst()
				.map(column -> column.get("notnull"))
				.filter(Number.class::isInstance)
				.map(Number.class::cast)
				.map(Number::intValue)
				.orElse(0) == 1;
	}

	private List<Map<String, Object>> columnInfo(String tableName) {
		try {
			return jdbcTemplate.queryForList("PRAGMA table_info(\"" + escapeIdentifier(tableName) + "\")");
		} catch (RuntimeException exception) {
			return List.of();
		}
	}

	private String escapeIdentifier(String identifier) {
		return identifier.replace("\"", "\"\"");
	}
}
