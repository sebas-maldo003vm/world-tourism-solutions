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
 * Añade id autoincremental a provider_profile_images (antes PK compuesta).
 */
@Component
@Profile("sqlite")
@Order(55)
public class SqliteProviderProfileImageIdMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteProviderProfileImageIdMigration(JdbcTemplate jdbcTemplate) {
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
					CREATE TABLE provider_profile_images_new (
						id integer primary key autoincrement,
						image_url varchar(300) not null,
						image_order integer not null,
						provider_profile_id bigint not null,
						foreign key(provider_profile_id) references provider_profiles(id)
					)
					""");
			jdbcTemplate.execute("""
					INSERT INTO provider_profile_images_new (
						image_url,
						image_order,
						provider_profile_id
					)
					SELECT
						image_url,
						image_order,
						provider_profile_id
					FROM provider_profile_images
					ORDER BY provider_profile_id, image_order
					""");
			jdbcTemplate.execute("DROP TABLE provider_profile_images");
			jdbcTemplate.execute("ALTER TABLE provider_profile_images_new RENAME TO provider_profile_images");
		} finally {
			jdbcTemplate.execute("PRAGMA foreign_keys=ON");
		}
	}

	private boolean needsMigration() {
		if (!tableExists("provider_profile_images")) {
			return false;
		}
		try {
			String sql = jdbcTemplate.queryForObject(
					"SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'provider_profile_images'",
					String.class);
			if (sql == null) {
				return false;
			}
			String normalized = sql.toLowerCase();
			return normalized.contains("primary key (provider_profile_id, image_order)")
					|| !normalized.contains("primary key autoincrement");
		} catch (RuntimeException exception) {
			return !hasColumn("provider_profile_images", "id");
		}
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
		try {
			return jdbcTemplate.queryForList("PRAGMA table_info(\"" + escapeIdentifier(tableName) + "\")")
					.stream()
					.anyMatch(column -> columnName.equals(column.get("name")));
		} catch (RuntimeException exception) {
			return false;
		}
	}

	private String escapeIdentifier(String identifier) {
		return identifier.replace("\"", "\"\"");
	}
}
