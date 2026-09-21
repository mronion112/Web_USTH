package com.kevin.lunaraspa.payment.sepay;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.payment.PaymentConfirmationService;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.SepayTransaction;
import com.kevin.lunaraspa.payment.entity.SepayTransactionStatus;
import com.kevin.lunaraspa.payment.exception.PaymentErrorCode;
import com.kevin.lunaraspa.payment.repository.SepayTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SepayWebhookService {
    private static final Pattern PAYMENT_CODE = Pattern.compile(
            "(?i)(?<![A-Z0-9])PAY[- _]?(\\d{8})[- _]?(\\d{5})(?![A-Z0-9])");
    private static final DateTimeFormatter SEPAY_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final SepayTransactionRepository transactionRepository;
    private final PaymentConfirmationService confirmationService;

    @Value("${app.sepay.account-number:}")
    private String expectedAccount;

    @Value("${app.sepay.sub-account:}")
    private String expectedSubAccount;

    @Transactional
    public Map<String, Object> process(byte[] rawBody) {
        SepayWebhookPayload payload = parse(rawBody);
        int inserted = jdbcTemplate.update("""
                INSERT IGNORE INTO sepay_transactions
                    (sepay_id, gateway, transaction_date, account_number, sub_account, payment_code,
                     content, transfer_type, transfer_amount, accumulated, reference_code, raw_payload,
                     status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, payload.id(), text(payload.gateway(), "SePay"), parseDate(payload.transactionDate()),
                clean(payload.accountNumber()), clean(payload.subAccount()), clean(payload.code()),
                limit(clean(payload.content()), 500), clean(payload.transferType()), payload.transferAmount(),
                payload.accumulated(), clean(payload.referenceCode()), new String(rawBody, StandardCharsets.UTF_8));
        SepayTransaction transaction = transactionRepository.findBySepayId(payload.id())
                .orElseThrow(() -> new IllegalStateException("SePay transaction insert was not visible"));
        if (inserted == 0) {
            return Map.of("success", true, "duplicate", true, "status", transaction.getStatus().name());
        }

        String validationFailure = validateDestination(payload);
        if (validationFailure != null) {
            return review(transaction, validationFailure);
        }
        String paymentCode = resolvePaymentCode(payload);
        transaction.setPaymentCode(paymentCode);
        PaymentConfirmationService.WebhookConfirmation result = confirmationService.confirmFromWebhook(
                paymentCode, payload.transferAmount(), payload.referenceCode());
        if (!result.confirmed()) {
            return review(transaction, result.reviewReason());
        }
        Payment payment = result.payment();
        transaction.setMatchedPaymentId(payment.getId());
        transaction.setStatus(SepayTransactionStatus.CONFIRMED);
        transaction.setReviewReason(null);
        transactionRepository.saveAndFlush(transaction);
        return Map.of("success", true, "status", "CONFIRMED", "paymentCode", payment.getTransactionCode());
    }

    @Transactional(readOnly = true)
    public List<SepayTransaction> list(SepayTransactionStatus status) {
        return status == null ? transactionRepository.findTop100ByOrderByCreatedAtDesc()
                : transactionRepository.findTop100ByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional
    public SepayTransaction reconcile(Long sepayId, Long paymentId, String action, Long actorAccountId) {
        SepayTransaction transaction = transactionRepository.findBySepayId(sepayId)
                .orElseThrow(() -> new AppException(PaymentErrorCode.NOT_FOUND));
        if (transaction.getStatus() != SepayTransactionStatus.MANUAL_REVIEW) {
            throw new AppException(PaymentErrorCode.TRANSACTION_NOT_RECONCILABLE);
        }
        if ("IGNORE".equalsIgnoreCase(action)) {
            transaction.setStatus(SepayTransactionStatus.IGNORED);
            transaction.setReviewReason("Ignored by account #" + actorAccountId);
            return transactionRepository.saveAndFlush(transaction);
        }
        if (!"CONFIRM".equalsIgnoreCase(action) || paymentId == null || paymentId <= 0) {
            throw new AppException(PaymentErrorCode.TRANSACTION_NOT_RECONCILABLE);
        }
        Payment payment = confirmationService.confirmReconciled(paymentId, transaction.getTransferAmount(),
                actorAccountId, transaction.getReferenceCode());
        transaction.setMatchedPaymentId(payment.getId());
        transaction.setPaymentCode(payment.getTransactionCode());
        transaction.setStatus(SepayTransactionStatus.CONFIRMED);
        transaction.setReviewReason("Manually reconciled by account #" + actorAccountId);
        return transactionRepository.saveAndFlush(transaction);
    }

    private SepayWebhookPayload parse(byte[] rawBody) {
        try {
            SepayWebhookPayload payload = objectMapper.readValue(rawBody, SepayWebhookPayload.class);
            if (payload.id() == null || payload.id() <= 0 || payload.transferAmount() == null
                    || payload.transferAmount().signum() <= 0 || clean(payload.transferType()) == null) {
                throw new AppException(PaymentErrorCode.INVALID_WEBHOOK_PAYLOAD);
            }
            return payload;
        } catch (AppException error) {
            throw error;
        } catch (Exception error) {
            throw new AppException(PaymentErrorCode.INVALID_WEBHOOK_PAYLOAD, error);
        }
    }

    private String validateDestination(SepayWebhookPayload payload) {
        if (!"in".equalsIgnoreCase(payload.transferType())) return "Transaction is not incoming";
        if (expectedAccount != null && !expectedAccount.isBlank()
                && !expectedAccount.equals(payload.accountNumber())) return "Destination account does not match";
        if (expectedSubAccount != null && !expectedSubAccount.isBlank()
                && !expectedSubAccount.equals(payload.subAccount())) return "Destination sub-account does not match";
        return null;
    }

    private String resolvePaymentCode(SepayWebhookPayload payload) {
        String direct = clean(payload.code());
        String directMatch = canonicalPaymentCode(direct);
        if (directMatch != null) return directMatch;
        String searchable = text(payload.content(), "") + " " + text(payload.description(), "");
        return canonicalPaymentCode(searchable);
    }

    private String canonicalPaymentCode(String value) {
        if (value == null) return null;
        var matcher = PAYMENT_CODE.matcher(value);
        return matcher.find()
                ? ("PAY-" + matcher.group(1) + "-" + matcher.group(2)).toUpperCase(Locale.ROOT)
                : null;
    }

    private Map<String, Object> review(SepayTransaction transaction, String reason) {
        transaction.setStatus(SepayTransactionStatus.MANUAL_REVIEW);
        transaction.setReviewReason(limit(reason, 500));
        transactionRepository.saveAndFlush(transaction);
        return Map.of("success", true, "status", "MANUAL_REVIEW");
    }

    private LocalDateTime parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value, SEPAY_TIME);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String text(String value, String fallback) {
        String cleaned = clean(value);
        return cleaned == null ? fallback : cleaned;
    }

    private String limit(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
