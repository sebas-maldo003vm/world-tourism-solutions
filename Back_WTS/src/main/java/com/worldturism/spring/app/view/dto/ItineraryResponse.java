package com.worldturism.spring.app.view.dto;

import java.util.List;

public record ItineraryResponse(
        String city,
        List<BookingResponse> bookings) {
}