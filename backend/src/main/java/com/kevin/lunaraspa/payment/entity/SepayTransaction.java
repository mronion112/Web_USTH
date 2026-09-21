package com.kevin.lunaraspa.payment.entity;

import com.kevin.lunaraspa.core.data.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sepay_transactions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_sepay_transactions_sepay_id", columnNames = "sepay_id"),
        @UniqueConstraint(name = "uq_sepay_transactions_payment", columnNames = "matched_payment_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SepayTransaction extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sepay_id", nullable = false)
    private Long sepayId;

    @Column(nullable = false, length = 50)
    private String gateway;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate;

    @Column(name = "account_number", length = 100)
    private String accountNumber;

    @Column(name = "sub_account", length = 100)
    private String subAccount;

    @Column(name = "payment_code", length = 100)
    private String paymentCode;

    @Column(length = 500)
    private String content;

    @Column(name = "transfer_type", nullable = false, length = 10)
    private String transferType;

    @Column(name = "transfer_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal transferAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal accumulated;

    @Column(name = "reference_code", length = 150)
    private String referenceCode;

    @Column(name = "raw_payload", nullable = false, columnDefinition = "LONGTEXT")
    private String rawPayload;

    @Column(name = "matched_payment_id", unique = true)
    private Long matchedPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SepayTransactionStatus status;

    @Column(name = "review_reason", length = 500)
    private String reviewReason;
}
