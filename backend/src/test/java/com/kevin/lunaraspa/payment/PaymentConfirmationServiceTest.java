package com.kevin.lunaraspa.payment;

import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.entity.BookingStatus;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.PaymentMethod;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import com.kevin.lunaraspa.payment.repository.PaymentRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentConfirmationServiceTest {
    @Test
    void webhookConfirmationUpdatesPaymentBookingEventAndRealtime() {
        PaymentRepository payments = mock(PaymentRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        RealtimeEventPublisher events = mock(RealtimeEventPublisher.class);
        PaymentConfirmationService service = new PaymentConfirmationService(payments, bookings, events);
        Payment payment = Payment.builder().id(4L).bookingId(7L).transactionCode("PAY-20260920-00004")
                .amount(new BigDecimal("450000.00")).method(PaymentMethod.QR).status(PaymentStatus.UNPAID).build();
        Booking booking = Booking.builder().id(7L).bookingCode("LNR-7").status(BookingStatus.PENDING_PAYMENT).build();
        when(payments.findByTransactionCodeForUpdate("PAY-20260920-00004")).thenReturn(Optional.of(payment));
        when(bookings.findByIdForUpdate(7L)).thenReturn(Optional.of(booking));
        when(payments.saveAndFlush(payment)).thenReturn(payment);

        var result = service.confirmFromWebhook("PAY-20260920-00004", new BigDecimal("450000"), "BANK-1");

        assertThat(result.confirmed()).isTrue();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(payment.getPaidAt()).isNotNull();
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(booking.getEvents()).singleElement().satisfies(event -> {
            assertThat(event.getEventType()).isEqualTo("PAYMENT_RECEIVED");
            assertThat(event.getActorAccountId()).isNull();
            assertThat(event.getMessage()).contains("SePay", "BANK-1");
        });
        verify(events).paymentChanged(booking, "PAYMENT_RECEIVED");
    }

    @Test
    void amountMismatchGoesToReviewWithoutMutatingPayment() {
        PaymentRepository payments = mock(PaymentRepository.class);
        Payment payment = Payment.builder().id(4L).bookingId(7L).transactionCode("PAY-20260920-00004")
                .amount(new BigDecimal("450000")).method(PaymentMethod.QR).status(PaymentStatus.UNPAID).build();
        when(payments.findByTransactionCodeForUpdate("PAY-20260920-00004")).thenReturn(Optional.of(payment));
        PaymentConfirmationService service = new PaymentConfirmationService(
                payments, mock(BookingRepository.class), mock(RealtimeEventPublisher.class));

        var result = service.confirmFromWebhook("PAY-20260920-00004", new BigDecimal("1"), "BANK-1");

        assertThat(result.confirmed()).isFalse();
        assertThat(result.reviewReason()).contains("amount");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.UNPAID);
    }

    @Test
    void manualReconciliationCannotOverrideAnAmountMismatch() {
        PaymentRepository payments = mock(PaymentRepository.class);
        Payment payment = Payment.builder().id(4L).bookingId(7L).transactionCode("PAY-20260920-00004")
                .amount(new BigDecimal("450000")).method(PaymentMethod.QR).status(PaymentStatus.UNPAID).build();
        when(payments.findByIdForUpdate(4L)).thenReturn(Optional.of(payment));
        PaymentConfirmationService service = new PaymentConfirmationService(
                payments, mock(BookingRepository.class), mock(RealtimeEventPublisher.class));

        assertThatThrownBy(() -> service.confirmReconciled(4L, new BigDecimal("1"), 2L, "BANK-1"))
                .isInstanceOf(AppException.class)
                .satisfies(error -> assertThat(((AppException) error).getErrorCode())
                        .isEqualTo(com.kevin.lunaraspa.payment.exception.PaymentErrorCode.AMOUNT_MISMATCH));
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.UNPAID);
    }
}
