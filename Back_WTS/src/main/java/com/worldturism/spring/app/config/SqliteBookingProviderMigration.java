package com.worldturism.spring.app.config;

import java.util.List;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SqliteBookingProviderMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteBookingProviderMigration(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!needsMigration()) {
			return;
		}

		boolean hasProviderProfileId = hasColumn("bookings", "provider_profile_id");
		String providerProfileSelection = hasProviderProfileId
				? "provider_profile_id"
				: "(SELECT provider_id FROM services WHERE services.id = bookings.service_id)";

		jdbcTemplate.execute("PRAGMA foreign_keys=OFF");
		try {
			jdbcTemplate.execute("""
					CREATE TABLE bookings_new (
						id integer primary key autoincrement,
						booking_date date not null,
						created_at timestamp not null,
						num_people integer not null,
						status varchar(20) not null,
						total_price numeric(10,2) not null,
						updated_at timestamp not null,
						user_id bigint not null,
						service_id bigint,
						provider_profile_id bigint,
						foreign key(user_id) references users(id),
						foreign key(service_id) references services(id),
						foreign key(provider_profile_id) references provider_profiles(id)
					)
					""");
			jdbcTemplate.execute("""
					INSERT INTO bookings_new (
						id,
						booking_date,
						created_at,
						num_people,
						status,
						total_price,
						updated_at,
						user_id,
						service_id,
						provider_profile_id
					)
					SELECT
						id,
						booking_date,
						created_at,
						num_people,
						status,
						total_price,
						updated_at,
						user_id,
						service_id,
						%s
					FROM bookings
					""".formatted(providerProfileSelection));
			jdbcTemplate.execute("DROP TABLE bookings");
			jdbcTemplate.execute("ALTER TABLE bookings_new RENAME TO bookings");
		} finally {
			jdbcTemplate.execute("PRAGMA foreign_keys=ON");
		}
	}

	private boolean needsMigration() {
		if (!tableExists("bookings")) {
			return false;
		}
		return !hasColumn("bookings", "provider_profile_id") || isNotNullColumn("bookings", "service_id");
	}

	private boolean tableExists(String tableName) {
		try {
			List<Map<String, Object>> tables = jdbcTemplate.queryForList(
					"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
					tableName);
			return !tables.isEmpty();
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
