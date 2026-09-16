package com.kevin.lunaraspa.booking.entity;

import com.kevin.lunaraspa.core.data.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_bookings_customer_start", columnList = "customer_account_id, booking_start"),
        @Index(name = "idx_bookings_staff_calendar", columnList = "staff_account_id, booking_start, booking_end"),
        @Index(name = "idx_bookings_status_start", columnList = "status, booking_start")
})
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Booking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_code", nullable = false, unique = true, length = 32)
    private String bookingCode;

    @Column(name = "customer_account_id", nullable = false)
    private Long customerAccountId;

    @Column(name = "staff_account_id")
    private Long staffAccountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING_PAYMENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_source", nullable = false, length = 20)
    @Builder.Default
    private AssignmentSource assignmentSource = AssignmentSource.SYSTEM;

    @Column(name = "customer_name_snapshot", nullable = false, length = 150)
    private String customerNameSnapshot;

    @Column(name = "customer_email_snapshot", nullable = false, length = 255)
    private String customerEmailSnapshot;

    @Column(name = "customer_phone_snapshot", length = 30)
    private String customerPhoneSnapshot;

    @Column(name = "booking_start", nullable = false)
    private LocalDateTime bookingStart;

    @Column(name = "booking_end", nullable = false)
    private LocalDateTime bookingEnd;

    @Column(name = "customer_note", columnDefinition = "TEXT")
    private String customerNote;

    @Column(name = "total_duration_minutes", nullable = false)
    private Integer totalDurationMinutes;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;

    @Column(name = "service_started_at")
    private LocalDateTime serviceStartedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_by_account_id", nullable = false)
    private Long createdByAccountId;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    @Builder.Default
    private List<BookingItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("occurredAt ASC")
    @Builder.Default
    private List<BookingEvent> events = new ArrayList<>();

    public void addItem(BookingItem item) {
        items.add(item);
        item.setBooking(this);
    }

    public void addEvent(BookingEvent event) {
        events.add(event);
        event.setBooking(this);
    }
}
