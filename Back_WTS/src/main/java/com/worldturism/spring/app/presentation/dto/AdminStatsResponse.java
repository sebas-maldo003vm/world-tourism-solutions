package com.worldturism.spring.app.presentation.dto;

public record AdminStatsResponse(
		long totalUsers,
		long totalBusinesses,
		long pendingBusinesses) {
}
