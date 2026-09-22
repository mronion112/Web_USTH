package com.kevin.lunaraspa.payment.sepay;

import com.kevin.lunaraspa.payment.PaymentConfirmationService;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.PaymentMethod;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import com.kevin.lunaraspa.payment.entity.SepayTransaction;
import com.kevin.lunaraspa.payment.entity.SepayTransactionStatus;
import com.kevin.lunaraspa.payment.repository.SepayTransactionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SepayWebhookServiceTest {
    @Test
    void matchingIncomingTransactionConfirmsAndLinksPayment() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        SepayTransactionRepository transactions = mock(SepayTransactionRepository.class);
        PaymentConfirmationService confirmations = mock(PaymentConfirmationService.class);
        SepayWebhookService service = service(jdbc, transactions, confirmations);
        SepayTransaction transaction = SepayTransaction.builder().id(1L).sepayId(99L)
                .gateway("SePay").status(SepayTransactionStatus.RECEIVED).build();
        Payment payment = Payment.builder().id(4L).bookingId(7L).transactionCode("PAY-20260920-00004")
                .amount(new BigDecimal("450000")).method(PaymentMethod.QR).status(PaymentStatus.PAID).build();
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
        when(transactions.findBySepayId(99L)).thenReturn(Optional.of(transaction));
        when(confirmations.confirmFromWebhook("PAY-20260920-00004", new BigDecimal("450000"), "BANK-1"))
                .thenReturn(new PaymentConfirmationService.WebhookConfirmation(true, null, payment));

        var response = service.process(payload());

        assertThat(response).containsEntry("success", true).containsEntry("status", "CONFIRMED");
        assertThat(transaction.getStatus()).isEqualTo(SepayTransactionStatus.CONFIRMED);
        assertThat(transaction.getMatchedPaymentId()).isEqualTo(4L);
        verify(transactions).saveAndFlush(transaction);
    }

    @Test
    void duplicateDeliveryReturnsSuccessWithoutConfirmingAgain() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        SepayTransactionRepository transactions = mock(SepayTransactionRepository.class);
        PaymentConfirmationService confirmations = mock(PaymentConfirmationService.class);
        SepayWebhookService service = service(jdbc, transactions, confirmations);
        SepayTransaction transaction = SepayTransaction.builder().id(1L).sepayId(99L)
                .gateway("SePay").status(SepayTransactionStatus.CONFIRMED).build();
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(0);
        when(transactions.findBySepayId(99L)).thenReturn(Optional.of(transaction));

        var response = service.process(payload());

        assertThat(response).containsEntry("success", true).containsEntry("duplicate", true)
                .containsEntry("status", "CONFIRMED");
        verify(confirmations, never()).confirmFromWebhook(any(), any(), any());
    }

    @Test
    void canonicalizesPaymentCodeWhenBankRemovesSeparators() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        SepayTransactionRepository transactions = mock(SepayTransactionRepository.class);
        PaymentConfirmationService confirmations = mock(PaymentConfirmationService.class);
        SepayWebhookService service = service(jdbc, transactions, confirmations);
        SepayTransaction transaction = SepayTransaction.builder().id(1L).sepayId(100L)
                .gateway("SePay").status(SepayTransactionStatus.RECEIVED).build();
        Payment payment = Payment.builder().id(4L).bookingId(7L).transactionCode("PAY-20260920-00004")
                .amount(new BigDecimal("450000")).method(PaymentMethod.QR).status(PaymentStatus.PAID).build();
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
        when(transactions.findBySepayId(100L)).thenReturn(Optional.of(transaction));
        when(confirmations.confirmFromWebhook("PAY-20260920-00004", new BigDecimal("450000"), "BANK-2"))
                .thenReturn(new PaymentConfirmationService.WebhookConfirmation(true, null, payment));
        byte[] raw = """
                {"id":100,"gateway":"SePay","transactionDate":"2026-09-20 12:00:00",
                 "accountNumber":"0000000001","subAccount":"SBSEPAYB9J6MQALS3PC",
                 "code":"PAY2026092000004","content":"PAY2026092000004",
                 "transferType":"in","transferAmount":450000,"accumulated":450000,
                 "referenceCode":"BANK-2","description":"payment"}
                """.getBytes(StandardCharsets.UTF_8);

        var response = service.process(raw);

        assertThat(response).containsEntry("status", "CONFIRMED");
        assertThat(transaction.getPaymentCode()).isEqualTo("PAY-20260920-00004");
    }

    private SepayWebhookService service(JdbcTemplate jdbc, SepayTransactionRepository transactions,
                                        PaymentConfirmationService confirmations) {
        SepayWebhookService service = new SepayWebhookService(new ObjectMapper(), jdbc, transactions, confirmations);
        ReflectionTestUtils.setField(service, "expectedAccount", "0000000001");
        ReflectionTestUtils.setField(service, "expectedSubAccount", "SBSEPAYB9J6MQALS3PC");
        return service;
    }

    private byte[] payload() {
        return """
                {"id":99,"gateway":"SePay","transactionDate":"2026-09-20 12:00:00",
                 "accountNumber":"0000000001","subAccount":"SBSEPAYB9J6MQALS3PC",
                 "code":"PAY-20260920-00004","content":"PAY-20260920-00004",
                 "transferType":"in","transferAmount":450000,"accumulated":450000,
                 "referenceCode":"BANK-1","description":"payment"}
                """.getBytes(StandardCharsets.UTF_8);
    }
}
