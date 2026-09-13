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
 * Convierte provider_profiles.price de texto a NUMERIC(10,2).
 */
@Component
@Profile("sqlite")
@Order(50)
public class SqliteProviderProfilePriceNumericMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteProviderProfilePriceNumericMigration(JdbcTemplate jdbcTemplate) {
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
					CREATE TABLE provider_profiles_new (
						id integer primary key autoincrement,
						address varchar(200),
						avg_rating float,
						business_name varchar(150) not null,
						category varchar(80),
						city varchar(100),
						description varchar(1000),
						logo_url varchar(300),
						price numeric(10,2),
						status varchar(20) not null default 'PENDING',
						tax_id varchar(60),
						total_reviews integer,
						user_id bigint not null,
						website varchar(200),
						foreign key(user_id) references users(id)
					)
					""");
			jdbcTemplate.execute("""
					INSERT INTO provider_profiles_new (
						id,
						address,
						avg_rating,
						business_name,
						category,
						city,
						description,
						logo_url,
						price,
						status,
						tax_id,
						total_reviews,
						user_id,
						website
					)
					SELECT
						id,
						address,
						avg_rating,
						business_name,
						category,
						city,
						description,
						logo_url,
						CASE
							WHEN price IS NULL OR trim(CAST(price AS text)) = '' THEN NULL
							ELSE CAST(replace(replace(trim(CAST(price AS text)), ',', '.'), ' ', '') AS numeric)
						END,
						coalesce(status, 'PENDING'),
						tax_id,
						total_reviews,
						user_id,
						website
					FROM provider_profiles
					""");
			jdbcTemplate.execute("DROP TABLE provider_profiles");
			jdbcTemplate.execute("ALTER TABLE provider_profiles_new RENAME TO provider_profiles");
		} finally {
			jdbcTemplate.execute("PRAGMA foreign_keys=ON");
		}
	}

	private boolean needsMigration() {
		if (!tableExists("provider_profiles") || !hasColumn("provider_profiles", "price")) {
			return false;
		}
		String type = columnType("provider_profiles", "price");
		return type != null && !type.toUpperCase().contains("NUMERIC") && !type.toUpperCase().contains("DECIMAL");
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
		return columnType(tableName, columnName) != null;
	}

	private String columnType(String tableName, String columnName) {
		return columnInfo(tableName).stream()
				.filter(column -> columnName.equals(column.get("name")))
				.findFirst()
				.map(column -> String.valueOf(column.get("type")))
				.orElse(null);
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
