package com.kevin.lunaraspa.booking.dto;

public enum BookingSortField {
    BOOKING_START("bookingStart"),
    CREATED_AT("createdAt");

    private final String property;

    BookingSortField(String property) {
        this.property = property;
    }

    public String property() {
        return property;
    }
}
