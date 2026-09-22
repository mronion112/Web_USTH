package com.kevin.lunaraspa.booking.exception;

import com.kevin.lunaraspa.core.exception.BaseErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum BookingFeatureErrorCode implements BaseErrorCode {
    BOOKING_NOT_FOUND("BKG_001", "Booking not found", HttpStatus.NOT_FOUND),
    CUSTOMER_ACCOUNT_REQUIRED("BKG_002", "An active customer account with a profile is required", HttpStatus.FORBIDDEN),
    INVALID_BOOKING_START("BKG_003", "Booking start must be in the future", HttpStatus.BAD_REQUEST),
    ITEMS_REQUIRED("BKG_004", "At least one booking item is required", HttpStatus.BAD_REQUEST),
    DUPLICATE_SERVICE("BKG_005", "A service can only appear once in a booking", HttpStatus.BAD_REQUEST),
    SERVICE_NOT_FOUND("BKG_006", "One or more active services were not found", HttpStatus.NOT_FOUND),
    INVALID_SERVICE_DURATION("BKG_007", "Invalid duration for one or more services", HttpStatus.BAD_REQUEST),
    STAFF_NOT_QUALIFIED("BKG_008", "Staff cannot perform all selected services", HttpStatus.CONFLICT),
    STAFF_UNAVAILABLE("BKG_009", "No qualified staff is available for the selected time", HttpStatus.CONFLICT),
    ACCESS_DENIED("BKG_010", "You do not have access to this booking", HttpStatus.FORBIDDEN),
    INVALID_STAFF_ID("BKG_011", "Staff account id must be a positive number", HttpStatus.BAD_REQUEST),
    BOOKING_NOT_ASSIGNABLE("BKG_012", "Staff cannot be assigned after service has started", HttpStatus.CONFLICT),
    BOOKING_CODE_GENERATION_FAILED("BKG_013", "Could not generate booking code", HttpStatus.INTERNAL_SERVER_ERROR),
    STAFF_ACCOUNT_REQUIRED("BKG_014", "An active staff account is required", HttpStatus.FORBIDDEN),
    INVALID_STATUS_TRANSITION("BKG_015", "Booking status transition is not allowed", HttpStatus.CONFLICT),
    BOOKING_EMAIL_UNAVAILABLE("BKG_016", "Booking does not have a deliverable customer email", HttpStatus.CONFLICT);

    private final String code;
    private final String message;
    private final HttpStatus status;
}
