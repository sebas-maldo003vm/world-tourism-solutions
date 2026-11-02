package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.Booking;
import com.worldturism.spring.app.domain.model.BookingStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record BookingResponse(
        Long id,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        Integer numPeople,
        BigDecimal totalPrice,
        BookingStatus status,
        Instant createdAt,
        Long businessId,
        String businessName,
        BigDecimal businessPrice,
        String businessCity,
        String businessAddress,
        String businessCategory,
        Long providerUserId,
        /** AppUser.id del cliente que reservó (para contactar desde el panel del proveedor). */
        Long userId,
        String userName,
        String userEmail) {

    public static BookingResponse from(Booking booking) {
        var client = booking.getUser();
        var business = booking.getProviderBusiness();
        return new BookingResponse(
                booking.getId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getNumPeople(),
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getCreatedAt(),
                business.getId(),
                business.getBusinessName(),
                business.getPrice(),
                business.getCity(),
                business.getAddress(),
                business.getCategory(),
                business.getUser() != null ? business.getUser().getId() : null,
                client != null ? client.getId() : null,
                client != null ? client.getName() : null,
                client != null ? client.getEmail() : null);
    }
}