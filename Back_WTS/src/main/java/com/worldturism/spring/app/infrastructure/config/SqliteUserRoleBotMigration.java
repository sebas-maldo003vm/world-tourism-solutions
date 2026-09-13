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
 * Amplía el CHECK de users.role para incluir BOT y SUPPORT.
 */
@Component
@Profile("sqlite")
@Order(20)
public class SqliteUserRoleBotMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteUserRoleBotMigration(JdbcTemplate jdbcTemplate) {
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
					CREATE TABLE users_new (
						id integer primary key autoincrement,
						created_at timestamp not null,
						email varchar(160) not null unique,
						is_active boolean default true not null,
						name varchar(120) not null,
						password varchar(255) not null,
						phone_number varchar(30) not null,
						role varchar(20) not null check ((role in ('ADMIN','USER','PROVIDER','BOT','SUPPORT'))),
						updated_at timestamp not null,
						profile_picture_url varchar(255)
					)
					""");
			jdbcTemplate.execute("""
					INSERT INTO users_new (
						id,
						created_at,
						email,
						is_active,
						name,
						password,
						phone_number,
						role,
						updated_at,
						profile_picture_url
					)
					SELECT
						id,
						created_at,
						email,
						is_active,
						name,
						password,
						phone_number,
						role,
						updated_at,
						profile_picture_url
					FROM users
					""");
			jdbcTemplate.execute("DROP TABLE users");
			jdbcTemplate.execute("ALTER TABLE users_new RENAME TO users");
		} finally {
			jdbcTemplate.execute("PRAGMA foreign_keys=ON");
		}
	}

	private boolean needsMigration() {
		if (!tableExists("users")) {
			return false;
		}
		try {
			String sql = jdbcTemplate.queryForObject(
					"SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'",
					String.class);
			if (sql == null) {
				return false;
			}
			return !sql.contains("'BOT'");
		} catch (RuntimeException exception) {
			return false;
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
}
