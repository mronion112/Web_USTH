package com.kevin.lunaraspa.booking.repository;

import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.entity.BookingStatus;
import com.kevin.lunaraspa.core.data.BaseRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends BaseRepository<Booking, Long> {

    List<Booking> findByCustomerAccountIdOrderByBookingStartDesc(Long customerAccountId);

    @EntityGraph(attributePaths = "items")
    List<Booking> findByStaffAccountIdOrderByBookingStartDesc(Long staffAccountId);

    @EntityGraph(attributePaths = "items")
    List<Booking> findByStaffAccountIdAndBookingStartLessThanAndBookingEndGreaterThanOrderByBookingStartAsc(
            Long staffAccountId, LocalDateTime end, LocalDateTime start);

    long countByStatus(BookingStatus status);

    long countByBookingStartGreaterThanEqualAndBookingStartLessThan(LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = "items")
    Optional<Booking> findByBookingCode(String bookingCode);

    @EntityGraph(attributePaths = "items")
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdWithItems(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "items")
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdateWithItems(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "items")
    @Query("SELECT b FROM Booking b WHERE b.bookingCode = :bookingCode")
    Optional<Booking> findByBookingCodeForUpdateWithItems(@Param("bookingCode") String bookingCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    @Query(value = """
            SELECT
                s.id AS id,
                s.name AS name,
                s.base_price AS basePrice,
                s.minimum_duration_minutes AS minimumDurationMinutes,
                s.is_duration_adjustable AS durationAdjustable,
                s.duration_step_minutes AS durationStepMinutes,
                s.price_per_duration_step AS pricePerDurationStep,
                s.preparation_buffer_minutes AS preparationBufferMinutes,
                s.cleanup_buffer_minutes AS cleanupBufferMinutes
            FROM services s
            WHERE s.id IN (:serviceIds)
              AND s.is_active = TRUE
            """, nativeQuery = true)
    List<ServiceSnapshotProjection> findActiveServicesByIds(
            @Param("serviceIds") Collection<Long> serviceIds
    );

    @Query(value = """
            SELECT sp.account_id
            FROM staff_profiles sp
            JOIN accounts a ON a.id = sp.account_id
            WHERE sp.is_bookable = TRUE
              AND a.is_active = TRUE
            ORDER BY sp.account_id
            """, nativeQuery = true)
    List<Long> findBookableStaffIds();

    @Query(value = """
            SELECT COUNT(DISTINCT ss.service_id)
            FROM staff_services ss
            WHERE ss.staff_account_id = :staffAccountId
              AND ss.service_id IN (:serviceIds)
            """, nativeQuery = true)
    long countSupportedServices(
            @Param("staffAccountId") Long staffAccountId,
            @Param("serviceIds") Collection<Long> serviceIds
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM staff_working_hours wh
            WHERE wh.staff_account_id = :staffAccountId
              AND wh.day_of_week = :dayOfWeek
              AND wh.is_active = TRUE
              AND wh.start_time <= :startTime
              AND wh.end_time >= :endTime
            """, nativeQuery = true)
    long countCoveringWorkingHours(
            @Param("staffAccountId") Long staffAccountId,
            @Param("dayOfWeek") int dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM staff_time_off sto
            WHERE sto.staff_account_id = :staffAccountId
              AND sto.start_at < :endAt
              AND sto.end_at > :startAt
            """, nativeQuery = true)
    long countOverlappingTimeOff(
            @Param("staffAccountId") Long staffAccountId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM bookings b
            WHERE b.staff_account_id = :staffAccountId
              AND b.id <> COALESCE(:excludedBookingId, -1)
              AND b.status <> 'CANCELLED'
              AND b.booking_start < :endAt
              AND b.booking_end > :startAt
            """, nativeQuery = true)
    long countOverlappingBookings(
            @Param("staffAccountId") Long staffAccountId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt,
            @Param("excludedBookingId") Long excludedBookingId
    );

    @Query(value = "SELECT account_id FROM staff_profiles WHERE account_id = :staffAccountId FOR UPDATE", nativeQuery = true)
    Optional<Long> lockStaff(@Param("staffAccountId") Long staffAccountId);

    @Query(value = "SELECT display_name FROM accounts WHERE id = :accountId", nativeQuery = true)
    Optional<String> findAccountDisplayName(@Param("accountId") Long accountId);
}
