package com.worldturism.spring.app.config;

import java.util.List;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SqliteReviewBusinessMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteReviewBusinessMigration(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!needsMigration()) {
			return;
		}

		boolean hasProviderProfileId = hasColumn("reviews", "provider_profile_id");
		String providerProfileSelection = hasProviderProfileId
				? "provider_profile_id"
				: "(SELECT provider_id FROM services WHERE services.id = reviews.service_id)";

		jdbcTemplate.execute("PRAGMA foreign_keys=OFF");
		try {
			jdbcTemplate.execute("""
					CREATE TABLE reviews_new (
						id integer primary key autoincrement,
						comment varchar(1000),
						created_at timestamp not null,
						rating integer not null,
						booking_id bigint unique,
						service_id bigint,
						provider_profile_id bigint,
						user_id bigint not null,
						foreign key(booking_id) references bookings(id),
						foreign key(service_id) references services(id),
						foreign key(provider_profile_id) references provider_profiles(id),
						foreign key(user_id) references users(id)
					)
					""");
			jdbcTemplate.execute("""
					INSERT INTO reviews_new (
						id,
						comment,
						created_at,
						rating,
						booking_id,
						service_id,
						provider_profile_id,
						user_id
					)
					SELECT
						id,
						comment,
						created_at,
						rating,
						booking_id,
						service_id,
						%s,
						user_id
					FROM reviews
					""".formatted(providerProfileSelection));
			jdbcTemplate.execute("DROP TABLE reviews");
			jdbcTemplate.execute("ALTER TABLE reviews_new RENAME TO reviews");
		} finally {
			jdbcTemplate.execute("PRAGMA foreign_keys=ON");
		}
	}

	private boolean needsMigration() {
		if (!tableExists("reviews")) {
			return false;
		}
		return !hasColumn("reviews", "provider_profile_id") || isNotNullColumn("reviews", "service_id");
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
