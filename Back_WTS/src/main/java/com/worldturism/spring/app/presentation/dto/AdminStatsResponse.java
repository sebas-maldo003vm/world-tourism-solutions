package com.worldturism.spring.app.presentation.dto;

public record AdminStatsResponse(
		long totalUsers,
		long totalServices,
		long pendingServices,
		long totalBusinesses,
		long pendingBusinesses) {
}
