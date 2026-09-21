package com.kevin.lunaraspa.payment;

import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.PaymentMethod;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import com.kevin.lunaraspa.payment.repository.PaymentRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PaymentControllerQrRefreshTest {
    private final PaymentRepository payments = mock(PaymentRepository.class);
    private final BookingRepository bookings = mock(BookingRepository.class);
    private final AccountRepository accounts = mock(AccountRepository.class);
    private final VietQrPayloadGenerator qr = new VietQrPayloadGenerator("970422", "0000000001");
    private final PaymentController controller = new PaymentController(
            payments, bookings, accounts, mock(NamedParameterJdbcTemplate.class),
            mock(RealtimeEventPublisher.class), mock(PaymentConfirmationService.class), qr);

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
}
