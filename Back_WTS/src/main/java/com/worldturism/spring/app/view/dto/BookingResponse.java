package com.worldturism.spring.app.view.dto;

import com.worldturism.spring.app.model.Booking;
import com.worldturism.spring.app.model.BookingStatus;
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
        String businessPrice,
        String businessCity,
        String businessAddress,
        String businessCategory,
        Long providerUserId) {

    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getNumPeople(),
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getCreatedAt(),
                booking.getProviderBusiness().getId(),
                booking.getProviderBusiness().getBusinessName(),
                booking.getProviderBusiness().getPrice(),
                booking.getProviderBusiness().getCity(),
                booking.getProviderBusiness().getAddress(),
                booking.getProviderBusiness().getCategory(),
                booking.getProviderBusiness().getUser().getId());
    }
}