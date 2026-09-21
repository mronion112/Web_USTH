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
    ACCESS_DENIED("PAY_007", "You do not have access to this payment", HttpStatus.FORBIDDEN),
    INVALID_WEBHOOK_SIGNATURE("PAY_008", "Invalid SePay webhook signature", HttpStatus.UNAUTHORIZED),
    INVALID_WEBHOOK_PAYLOAD("PAY_009", "Invalid SePay webhook payload", HttpStatus.BAD_REQUEST),
    WEBHOOK_NOT_CONFIGURED("PAY_010", "SePay webhook is not configured", HttpStatus.SERVICE_UNAVAILABLE),
    TRANSACTION_NOT_RECONCILABLE("PAY_011", "SePay transaction cannot be reconciled", HttpStatus.CONFLICT),
    AMOUNT_MISMATCH("PAY_012", "Bank transfer amount does not match the payment amount", HttpStatus.CONFLICT);
    private final String code; private final String message; private final HttpStatus status;
}
