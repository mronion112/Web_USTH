package com.kevin.lunaraspa.payment;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.entity.Role;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.CustomUserDetails;
import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.payment.dto.PaymentDtos.CreatePaymentRequest;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.PaymentMethod;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import com.kevin.lunaraspa.payment.repository.PaymentRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PaymentControllerQrRefreshTest {
    private final PaymentRepository payments = mock(PaymentRepository.class);
    private final BookingRepository bookings = mock(BookingRepository.class);
    private final AccountRepository accounts = mock(AccountRepository.class);
    private final RealtimeEventPublisher events = mock(RealtimeEventPublisher.class);
    private final VietQrPayloadGenerator qr = new VietQrPayloadGenerator("970422", "0000000001");
    private final PaymentController controller = new PaymentController(
            payments, bookings, accounts, mock(NamedParameterJdbcTemplate.class),
            events, mock(PaymentConfirmationService.class), qr);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void refreshReplacesLegacyQrWithCurrentBankPayload() {
        Payment payment = Payment.builder().id(15L).bookingId(12L).method(PaymentMethod.QR)
                .status(PaymentStatus.UNPAID).amount(new BigDecimal("450000.00"))
                .transactionCode("PAY-20260920-00015")
                .qrPayload("000201010212LUNARAY-00015").build();
        ReflectionTestUtils.setField(controller, "bankAccountName", "LUNARA SPA");
        ReflectionTestUtils.invokeMethod(controller, "refreshUnpaidQr", payment);

        assertThat(payment.getQrPayload()).isEqualTo(
                qr.generate(new BigDecimal("450000.00"), "PAY-20260920-00015"));
        verify(payments).saveAndFlush(payment);
    }

    @Test
    void createPersistsPaymentInitializedEventForNotifications() {
        String email = "customer@example.com";
        CustomUserDetails user = new CustomUserDetails(email, "CUSTOMER",
                Collections.singletonList(new SimpleGrantedAuthority("CUSTOMER")));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        Account customer = Account.builder().id(8L).email(email).displayName("Customer").isActive(true)
                .role(Role.builder().code("CUSTOMER").build()).build();
        Booking booking = Booking.builder().id(12L).bookingCode("LNR-12").customerAccountId(8L)
                .totalAmount(new BigDecimal("450000.00")).build();
        when(accounts.findByEmail(email)).thenReturn(Optional.of(customer));
        when(bookings.findByIdForUpdate(12L)).thenReturn(Optional.of(booking));
        when(payments.findByBookingId(12L)).thenReturn(Optional.empty());
        when(payments.saveAndFlush(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            if (payment.getId() == null) payment.setId(15L);
            return payment;
        });
        ReflectionTestUtils.setField(controller, "bankAccountName", "LUNARA SPA");

        controller.create(new CreatePaymentRequest(12L, "QR"));

        assertThat(booking.getEvents()).anySatisfy(event -> {
            assertThat(event.getEventType()).isEqualTo("PAYMENT_INITIALIZED");
            assertThat(event.getActorAccountId()).isEqualTo(8L);
            assertThat(event.getMessage()).contains("awaiting payment");
        });
        verify(bookings).saveAndFlush(booking);
        verify(events).paymentChanged(booking, "PAYMENT_INITIALIZED");
    }
}
