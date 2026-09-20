package com.kevin.lunaraspa.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class PaymentDtos {
    private PaymentDtos() {}
    public record CreatePaymentRequest(Long bookingId, String method) {}
    public record PaidRequest(String transactionCode) {}
    public record PaymentResponse(Long id, String transactionCode, Long bookingId, String status,
                                  String method, BigDecimal amount, String qrPayload,
                                  LocalDateTime paidAt, LocalDateTime refundedAt) {}
}
