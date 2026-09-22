package com.kevin.lunaraspa.payment.sepay;

import java.math.BigDecimal;

public record SepayWebhookPayload(
        Long id,
        String gateway,
        String transactionDate,
        String accountNumber,
        String subAccount,
        String code,
        String content,
        String transferType,
        BigDecimal transferAmount,
        BigDecimal accumulated,
        String referenceCode,
        String description
) {
}
