package com.kevin.lunaraspa.payment.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

public interface PaymentRepository extends BaseRepository<Payment, Long> {
    Optional<Payment> findByBookingId(Long bookingId);
    boolean existsByBookingId(Long bookingId);
    long countByStatus(PaymentStatus status);
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PAID' AND p.paidAt >= :start AND p.paidAt < :end")
    BigDecimal sumPaidBetween(LocalDateTime start, LocalDateTime end);
}
