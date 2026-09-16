package com.kevin.lunaraspa.feedback.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.feedback.entity.Feedback;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeedbackRepository extends BaseRepository<Feedback, Long> {

    Optional<Feedback> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);

    @Query(value = "SELECT b.status FROM bookings b WHERE b.id = :bookingId", nativeQuery = true)
    Optional<String> findBookingStatusById(@Param("bookingId") Long bookingId);

    @Query(value = """
            SELECT COUNT(*)
            FROM bookings b
            JOIN accounts a ON a.id = b.customer_account_id
            WHERE b.id = :bookingId
              AND LOWER(a.email) = LOWER(:email)
              AND a.is_active = TRUE
            """, nativeQuery = true)
    long countActiveBookingOwner(
            @Param("bookingId") Long bookingId,
            @Param("email") String email
    );
}
