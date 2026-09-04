package com.worldturism.spring.app.infrastructure.config;

import java.util.List;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * SCRUM-21: favorites.business_id → provider_profile_id (FK a provider_profiles).
 */
@Component
@Order(40)
public class SqliteFavoriteProviderProfileMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteFavoriteProviderProfileMigration(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!needsMigration()) {
			return;
		}

		jdbcTemplate.execute("PRAGMA foreign_keys=OFF");
		try {
			jdbcTemplate.execute("""
					CREATE TABLE favorites_new (
						id integer primary key autoincrement,
						saved_at timestamp not null,
						user_id bigint not null,
						provider_profile_id bigint not null,
						foreign key(user_id) references users(id),
						foreign key(provider_profile_id) references provider_profiles(id),
						unique(user_id, provider_profile_id)
					)
					""");

			String providerSelection = hasColumn("favorites", "provider_profile_id")
					? "provider_profile_id"
					: "business_id";

			jdbcTemplate.execute("""
					INSERT INTO favorites_new (id, saved_at, user_id, provider_profile_id)
					SELECT id, saved_at, user_id, %s
					FROM favorites
					WHERE %s IS NOT NULL
					""".formatted(providerSelection, providerSelection));

			jdbcTemplate.execute("DROP TABLE favorites");
			jdbcTemplate.execute("ALTER TABLE favorites_new RENAME TO favorites");
		} finally {
			jdbcTemplate.execute("PRAGMA foreign_keys=ON");
		}
	}

	private boolean needsMigration() {
		if (!tableExists("favorites")) {
			return false;
		}
		return hasColumn("favorites", "business_id") || !hasColumn("favorites", "provider_profile_id");
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
				.anyMatch(column -> columnName.equals(String.valueOf(column.get("name"))));
	}

	private List<Map<String, Object>> columnInfo(String tableName) {
		return jdbcTemplate.queryForList("PRAGMA table_info(" + tableName + ")");
	}
}
