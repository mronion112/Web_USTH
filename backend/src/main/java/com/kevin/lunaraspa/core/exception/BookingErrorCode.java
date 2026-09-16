package com.kevin.lunaraspa.core.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum BookingErrorCode implements BaseErrorCode {
    BOOKING_NOT_FOUND("BKG_001", "Booking not found", HttpStatus.NOT_FOUND),
    INVALID_BOOKING_STATE("BKG_002", "Invalid booking state transition", HttpStatus.BAD_REQUEST),
    STAFF_UNAVAILABLE("BKG_003", "Staff member is unavailable for the selected time", HttpStatus.CONFLICT),
    TIME_SLOT_UNAVAILABLE("BKG_004", "The requested time slot is no longer available", HttpStatus.CONFLICT);

    private final String code;
    private final String message;
    private final HttpStatus status;
}
