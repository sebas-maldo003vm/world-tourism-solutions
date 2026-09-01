package com.worldturism.spring.app.presentation.dto;

import java.util.List;

public record ItineraryResponse(
        String city,
        List<BookingResponse> bookings) {
}