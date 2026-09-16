package com.kevin.lunaraspa.feedback.exception;

import com.kevin.lunaraspa.core.exception.BaseErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum FeedbackErrorCode implements BaseErrorCode {
    FEEDBACK_NOT_FOUND("FDB_001", "Feedback not found", HttpStatus.NOT_FOUND),
    BOOKING_NOT_FOUND("FDB_002", "Booking not found", HttpStatus.NOT_FOUND),
    FEEDBACK_ALREADY_EXISTS("FDB_003", "Feedback already exists for this booking", HttpStatus.CONFLICT),
    BOOKING_NOT_COMPLETED("FDB_004", "Feedback can only be created for a completed booking", HttpStatus.CONFLICT),
    INVALID_BOOKING_ID("FDB_005", "Booking id must be a positive number", HttpStatus.BAD_REQUEST),
    INVALID_RATING("FDB_006", "Rating must be between 1 and 5", HttpStatus.BAD_REQUEST),
    BOOKING_ACCESS_DENIED("FDB_007", "You can only create feedback for your own booking", HttpStatus.FORBIDDEN);

    private final String code;
    private final String message;
    private final HttpStatus status;
}
