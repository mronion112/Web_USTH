package com.kevin.lunaraspa.payment.sepay;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.payment.entity.SepayTransaction;
import com.kevin.lunaraspa.payment.entity.SepayTransactionStatus;
import com.kevin.lunaraspa.payment.exception.PaymentErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/payments/sepay")
@RequiredArgsConstructor
public class SepayController {
    private static final Set<String> RECONCILIATION_ROLES = Set.of("OWNER", "MANAGER", "ACCOUNTANT");
    private final SepaySignatureVerifier signatureVerifier;
    private final SepayWebhookService webhookService;
    private final AccountRepository accountRepository;

    @PostMapping("/webhook")
    @Operation(summary = "Receive a signed SePay bank transaction webhook", security = {})
    public Map<String, Object> webhook(@RequestBody byte[] rawBody,
                                      @Parameter(description = "Unix timestamp included in the HMAC input")
                                      @RequestHeader(value = "X-SePay-Timestamp", required = false) String timestamp,
                                      @Parameter(description = "HMAC-SHA256 signature in sha256={hex} format")
                                      @RequestHeader(value = "X-SePay-Signature", required = false) String signature) {
        signatureVerifier.verify(rawBody, timestamp, signature);
        webhookService.process(rawBody);
        return Map.of("success", true);
    }

    @GetMapping("/transactions")
    public ResponseEntity<Object> transactions(@RequestParam(required = false) SepayTransactionStatus status) {
        requireReconciliationAccount();
        return ResponseBuilder.ok(webhookService.list(status).stream().map(TransactionResponse::from).toList(),
                "Get SePay transactions successfully");
    }

    @PostMapping("/transactions/{sepayId}/reconcile")
    public ResponseEntity<Object> reconcile(@PathVariable Long sepayId,
                                            @RequestBody ReconcileRequest request) {
        Account actor = requireReconciliationAccount();
        SepayTransaction transaction = webhookService.reconcile(sepayId,
                request == null ? null : request.paymentId(), request == null ? null : request.action(), actor.getId());
        return ResponseBuilder.ok(TransactionResponse.from(transaction), "SePay transaction reconciled successfully");
    }

    private Account requireReconciliationAccount() {
        Account account = accountRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .filter(item -> Boolean.TRUE.equals(item.getIsActive()))
                .orElseThrow(() -> new AppException(PaymentErrorCode.ACCESS_DENIED));
        String role = account.getRole().getCode().toUpperCase(Locale.ROOT).replaceFirst("^ROLE_", "");
        if (!RECONCILIATION_ROLES.contains(role)) throw new AppException(PaymentErrorCode.ACCESS_DENIED);
        return account;
    }

    public record ReconcileRequest(Long paymentId, String action) {
    }

    public record TransactionResponse(Long id, Long sepayId, String gateway, LocalDateTime transactionDate,
                                      String accountNumber, String subAccount, String paymentCode, String content,
                                      String transferType, BigDecimal transferAmount, BigDecimal accumulated,
                                      String referenceCode, Long matchedPaymentId, SepayTransactionStatus status,
                                      String reviewReason, LocalDateTime createdAt, LocalDateTime updatedAt) {
        static TransactionResponse from(SepayTransaction transaction) {
            return new TransactionResponse(transaction.getId(), transaction.getSepayId(), transaction.getGateway(),
                    transaction.getTransactionDate(), transaction.getAccountNumber(), transaction.getSubAccount(),
                    transaction.getPaymentCode(), transaction.getContent(), transaction.getTransferType(),
                    transaction.getTransferAmount(), transaction.getAccumulated(), transaction.getReferenceCode(),
                    transaction.getMatchedPaymentId(), transaction.getStatus(), transaction.getReviewReason(),
                    transaction.getCreatedAt(), transaction.getUpdatedAt());
        }
    }
}
