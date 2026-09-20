package com.kevin.lunaraspa.payment.exception;

import com.kevin.lunaraspa.core.exception.BaseErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter @RequiredArgsConstructor
public enum PaymentErrorCode implements BaseErrorCode {
    NOT_FOUND("PAY_001", "Payment not found", HttpStatus.NOT_FOUND),
    BOOKING_NOT_FOUND("PAY_002", "Booking not found", HttpStatus.NOT_FOUND),
    ALREADY_EXISTS("PAY_003", "Payment already exists for this booking", HttpStatus.CONFLICT),
    INVALID_METHOD("PAY_004", "Payment method must be QR, CARD, or AT_SPA", HttpStatus.BAD_REQUEST),
    INVALID_STATUS("PAY_005", "Payment status transition is not allowed", HttpStatus.CONFLICT),
    TRANSACTION_MISMATCH("PAY_006", "Transaction code does not match", HttpStatus.BAD_REQUEST),
    ACCESS_DENIED("PAY_007", "You do not have access to this payment", HttpStatus.FORBIDDEN);
    private final String code; private final String message; private final HttpStatus status;
}
