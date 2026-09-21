package com.kevin.lunaraspa.payment;

import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.entity.BookingEvent;
import com.kevin.lunaraspa.booking.entity.BookingStatus;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import com.kevin.lunaraspa.payment.exception.PaymentErrorCode;
import com.kevin.lunaraspa.payment.repository.PaymentRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentConfirmationService {
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final RealtimeEventPublisher realtimeEventPublisher;

    @Transactional
    public Payment confirmManually(Long paymentId, String submittedCode, Long actorAccountId) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new AppException(PaymentErrorCode.NOT_FOUND));
        if (submittedCode == null || !payment.getTransactionCode().equalsIgnoreCase(submittedCode.trim())) {
            throw new AppException(PaymentErrorCode.TRANSACTION_MISMATCH);
        }
        if (payment.getStatus() != PaymentStatus.UNPAID) {
            throw new AppException(PaymentErrorCode.INVALID_STATUS);
        }
        return confirm(payment, actorAccountId,
                "Payment " + payment.getTransactionCode() + " was confirmed manually.");
    }

    @Transactional
    public WebhookConfirmation confirmFromWebhook(String paymentCode, BigDecimal receivedAmount,
                                                   String bankReference) {
        if (paymentCode == null || paymentCode.isBlank()) {
            return WebhookConfirmation.review("Payment code was not found in the bank transaction");
        }
        Payment payment = paymentRepository.findByTransactionCodeForUpdate(paymentCode.trim())
                .orElse(null);
        if (payment == null) {
            return WebhookConfirmation.review("No payment matches code " + paymentCode.trim());
        }
        if (payment.getStatus() != PaymentStatus.UNPAID) {
            return WebhookConfirmation.review("Payment is already " + payment.getStatus(), payment);
        }
        if (receivedAmount == null || payment.getAmount().compareTo(receivedAmount) != 0) {
            return WebhookConfirmation.review("Received amount does not equal payment amount", payment);
        }
        Payment confirmed = confirm(payment, null,
                "Payment " + payment.getTransactionCode() + " was confirmed by SePay"
                        + (bankReference == null ? "." : " (reference " + bankReference + ")."));
        return WebhookConfirmation.confirmed(confirmed);
    }

    @Transactional
    public Payment confirmReconciled(Long paymentId, BigDecimal receivedAmount, Long actorAccountId,
                                     String bankReference) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new AppException(PaymentErrorCode.NOT_FOUND));
        if (payment.getStatus() != PaymentStatus.UNPAID) {
            throw new AppException(PaymentErrorCode.INVALID_STATUS);
        }
        if (receivedAmount == null || payment.getAmount().compareTo(receivedAmount) != 0) {
            throw new AppException(PaymentErrorCode.AMOUNT_MISMATCH);
        }
        return confirm(payment, actorAccountId,
                "Payment " + payment.getTransactionCode() + " was reconciled from SePay transaction"
                        + (bankReference == null ? "." : " " + bankReference + "."));
    }

    private Payment confirm(Payment payment, Long actorAccountId, String message) {
        LocalDateTime now = LocalDateTime.now();
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(now);
        Booking booking = bookingRepository.findByIdForUpdate(payment.getBookingId())
                .orElseThrow(() -> new AppException(PaymentErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.CONFIRMED);
        }
        booking.addEvent(BookingEvent.builder().eventType("PAYMENT_RECEIVED")
                .actorAccountId(actorAccountId).message(message).occurredAt(now).build());
        bookingRepository.saveAndFlush(booking);
        Payment saved = paymentRepository.saveAndFlush(payment);
        realtimeEventPublisher.paymentChanged(booking, "PAYMENT_RECEIVED");
        return saved;
    }

    public record WebhookConfirmation(boolean confirmed, String reviewReason, Payment payment) {
        static WebhookConfirmation confirmed(Payment payment) {
            return new WebhookConfirmation(true, null, payment);
        }

        static WebhookConfirmation review(String reason) {
            return new WebhookConfirmation(false, reason, null);
        }

        static WebhookConfirmation review(String reason, Payment payment) {
            return new WebhookConfirmation(false, reason, payment);
        }
    }
}
