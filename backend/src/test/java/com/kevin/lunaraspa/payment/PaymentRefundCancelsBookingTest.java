package com.kevin.lunaraspa.payment;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.entity.Role;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.entity.BookingStatus;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.PaymentMethod;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import com.kevin.lunaraspa.payment.repository.PaymentRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PaymentRefundCancelsBookingTest {
    private final PaymentRepository payments = mock(PaymentRepository.class);
    private final BookingRepository bookings = mock(BookingRepository.class);
    private final AccountRepository accounts = mock(AccountRepository.class);
    private final RealtimeEventPublisher events = mock(RealtimeEventPublisher.class);
    private final PaymentController controller = new PaymentController(
            payments, bookings, accounts, mock(NamedParameterJdbcTemplate.class),
            events, mock(PaymentConfirmationService.class),
            new VietQrPayloadGenerator("970422", "0000000001"));

    @BeforeEach
    void authenticateOwner() {
        OAuth2User principal = mock(OAuth2User.class);
        when(principal.getAttribute("email")).thenReturn("owner@lunara.test");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of()));
        when(accounts.findByEmail("owner@lunara.test")).thenReturn(Optional.of(
                Account.builder().id(1L).email("owner@lunara.test").isActive(true)
                        .role(Role.builder().code("OWNER").build()).build()));
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private Booking refundBookingInStatus(BookingStatus status) {
        Payment payment = Payment.builder().id(9L).bookingId(4L).method(PaymentMethod.QR)
                .status(PaymentStatus.PAID).amount(new BigDecimal("350000.00"))
                .transactionCode("PAY-20260922-00009").build();
        Booking booking = Booking.builder().id(4L).bookingCode("LNR-20260922-00004").status(status).build();
        when(payments.findById(9L)).thenReturn(Optional.of(payment));
        when(payments.saveAndFlush(any(Payment.class))).thenReturn(payment);
        when(bookings.findById(4L)).thenReturn(Optional.of(booking));
        controller.refund(9L);
        return booking;
    }

    @Test
    void refundBeforeServiceCancelsBookingSoTheSlotIsReleased() {
        Booking booking = refundBookingInStatus(BookingStatus.CONFIRMED);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(booking.getEvents()).extracting(event -> event.getEventType())
                .contains("PAYMENT_REFUNDED", "CANCELLED");
        verify(events).bookingChanged(booking, "CANCELLED");
    }

    @Test
    void refundAfterServiceKeepsBookingStatus() {
        Booking booking = refundBookingInStatus(BookingStatus.COMPLETED);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.COMPLETED);
        verify(events, never()).bookingChanged(any(Booking.class), eq("CANCELLED"));
    }
}
