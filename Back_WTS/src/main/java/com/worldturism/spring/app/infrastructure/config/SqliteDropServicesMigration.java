package com.worldturism.spring.app.infrastructure.config;

import java.util.List;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Elimina services / saved_services y redirige FKs a provider_profiles.id
 * (provider_profile_id) en bookings, reviews, conversations e itinerary_items.
 */
@Component
@Order(100)
public class SqliteDropServicesMigration implements ApplicationRunner {

	private final JdbcTemplate jdbcTemplate;

	public SqliteDropServicesMigration(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!needsMigration()) {
			return;
		}

		jdbcTemplate.execute("PRAGMA foreign_keys=OFF");
		try {
			migrateBookings();
			migrateReviews();
			migrateConversations();
			migrateItineraryItems();
			if (tableExists("saved_services")) {
				jdbcTemplate.execute("DROP TABLE saved_services");
			}
			if (tableExists("services")) {
				jdbcTemplate.execute("DROP TABLE services");
			}
		} finally {
			jdbcTemplate.execute("PRAGMA foreign_keys=ON");
		}
	}

	private boolean needsMigration() {
		return tableExists("services")
				|| tableExists("saved_services")
				|| hasColumn("bookings", "service_id")
				|| hasColumn("reviews", "service_id")
				|| hasColumn("conversations", "service_id")
				|| hasColumn("conversations", "provider_id")
				|| hasColumn("itinerary_items", "service_id");
	}

	private void migrateBookings() {
		if (!tableExists("bookings") || !hasColumn("bookings", "service_id")) {
			return;
		}

		boolean hasStartTime = hasColumn("bookings", "start_time");
		boolean hasEndTime = hasColumn("bookings", "end_time");
		String providerSelection = hasColumn("bookings", "provider_profile_id")
				? "COALESCE(provider_profile_id, (SELECT provider_id FROM services WHERE services.id = bookings.service_id))"
				: "(SELECT provider_id FROM services WHERE services.id = bookings.service_id)";

		String createSql = """
				CREATE TABLE bookings_new (
					id integer primary key autoincrement,
					booking_date date not null,
					%s
					%s
					created_at timestamp not null,
					num_people integer not null,
					status varchar(20) not null,
					total_price numeric(10,2) not null,
					updated_at timestamp not null,
					user_id bigint not null,
					provider_profile_id bigint,
					foreign key(user_id) references users(id),
					foreign key(provider_profile_id) references provider_profiles(id)
				)
				""".formatted(
				hasStartTime ? "start_time time," : "",
				hasEndTime ? "end_time time," : "");

		jdbcTemplate.execute(createSql);

		String insertColumns = "id, booking_date, "
				+ (hasStartTime ? "start_time, " : "")
				+ (hasEndTime ? "end_time, " : "")
				+ "created_at, num_people, status, total_price, updated_at, user_id, provider_profile_id";
		String selectColumns = "id, booking_date, "
				+ (hasStartTime ? "start_time, " : "")
				+ (hasEndTime ? "end_time, " : "")
				+ "created_at, num_people, status, total_price, updated_at, user_id, " + providerSelection;

		jdbcTemplate.execute("""
				INSERT INTO bookings_new (%s)
				SELECT %s FROM bookings
				""".formatted(insertColumns, selectColumns));
		jdbcTemplate.execute("DROP TABLE bookings");
		jdbcTemplate.execute("ALTER TABLE bookings_new RENAME TO bookings");
	}

	private void migrateReviews() {
		if (!tableExists("reviews") || !hasColumn("reviews", "service_id")) {
			return;
		}

		String providerSelection = hasColumn("reviews", "provider_profile_id")
				? "COALESCE(provider_profile_id, (SELECT provider_id FROM services WHERE services.id = reviews.service_id))"
				: "(SELECT provider_id FROM services WHERE services.id = reviews.service_id)";

		jdbcTemplate.execute("""
				CREATE TABLE reviews_new (
					id integer primary key autoincrement,
					rating integer not null,
					comment varchar(1000),
					created_at timestamp not null,
					user_id bigint not null,
					provider_profile_id bigint,
					booking_id bigint,
					foreign key(user_id) references users(id),
					foreign key(provider_profile_id) references provider_profiles(id),
					foreign key(booking_id) references bookings(id)
				)
				""");
		jdbcTemplate.execute("""
				INSERT INTO reviews_new (
					id, rating, comment, created_at, user_id, provider_profile_id, booking_id
				)
				SELECT
					id, rating, comment, created_at, user_id, %s, booking_id
				FROM reviews
				""".formatted(providerSelection));
		jdbcTemplate.execute("DROP TABLE reviews");
		jdbcTemplate.execute("ALTER TABLE reviews_new RENAME TO reviews");
	}

	private void migrateConversations() {
		if (!tableExists("conversations")) {
			return;
		}
		if (!hasColumn("conversations", "service_id")
				&& !hasColumn("conversations", "provider_id")
				&& hasColumn("conversations", "provider_profile_id")) {
			return;
		}

		String providerSelection;
		if (hasColumn("conversations", "provider_profile_id")) {
			providerSelection = "provider_profile_id";
		} else if (hasColumn("conversations", "provider_id")) {
			providerSelection = """
					CASE
						WHEN service_id IS NOT NULL THEN (
							SELECT provider_id FROM services WHERE services.id = conversations.service_id
						)
						ELSE provider_id
					END
					""";
		} else {
			providerSelection = "NULL";
		}

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
					provider_profile_id bigint,
					foreign key(user_id) references users(id),
					foreign key(provider_profile_id) references provider_profiles(id)
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
					provider_profile_id
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
					%s
				FROM conversations
				""".formatted(providerSelection));
		jdbcTemplate.execute("DROP TABLE conversations");
		jdbcTemplate.execute("ALTER TABLE conversations_new RENAME TO conversations");
	}

	private void migrateItineraryItems() {
		if (!tableExists("itinerary_items")) {
			return;
		}
		if (!hasColumn("itinerary_items", "service_id")
				&& hasColumn("itinerary_items", "provider_profile_id")) {
			return;
		}

		String providerSelection;
		if (hasColumn("itinerary_items", "provider_profile_id") && hasColumn("itinerary_items", "service_id")) {
			providerSelection = "COALESCE(provider_profile_id, (SELECT provider_id FROM services WHERE services.id = itinerary_items.service_id))";
		} else if (hasColumn("itinerary_items", "service_id")) {
			providerSelection = "(SELECT provider_id FROM services WHERE services.id = itinerary_items.service_id)";
		} else {
			providerSelection = "provider_profile_id";
		}

		jdbcTemplate.execute("""
				CREATE TABLE itinerary_items_new (
					id integer primary key autoincrement,
					scheduled_date date,
					notes varchar(500),
					sort_order integer not null,
					itinerary_id bigint not null,
					provider_profile_id bigint not null,
					foreign key(itinerary_id) references itineraries(id),
					foreign key(provider_profile_id) references provider_profiles(id)
				)
				""");
		jdbcTemplate.execute("""
				INSERT INTO itinerary_items_new (
					id, scheduled_date, notes, sort_order, itinerary_id, provider_profile_id
				)
				SELECT
					id, scheduled_date, notes, sort_order, itinerary_id, %s
				FROM itinerary_items
				WHERE (%s) IS NOT NULL
				""".formatted(providerSelection, providerSelection));
		jdbcTemplate.execute("DROP TABLE itinerary_items");
		jdbcTemplate.execute("ALTER TABLE itinerary_items_new RENAME TO itinerary_items");
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
