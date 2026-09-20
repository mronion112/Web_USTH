package com.kevin.lunaraspa.payment.entity;

import com.kevin.lunaraspa.core.data.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter @Setter @Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Payment extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "transaction_code", nullable = false, unique = true, length = 32)
    private String transactionCode;
    @Column(name = "booking_id", nullable = false, unique = true)
    private Long bookingId;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default private PaymentStatus status = PaymentStatus.UNPAID;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private PaymentMethod method;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "qr_payload", columnDefinition = "TEXT")
    private String qrPayload;
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;
}
