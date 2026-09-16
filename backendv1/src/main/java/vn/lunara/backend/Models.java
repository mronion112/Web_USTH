package vn.lunara.backend;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="roles") class Role {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Byte id;
    @Column(nullable=false,unique=true) String code;
    @Column(nullable=false) String name;
    String description;
}
@Entity @Table(name="permissions") class Permission {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Short id;
    @Column(nullable=false,unique=true) String code;
    @Column(nullable=false) String module;
    String description;
}
@Entity @Table(name="accounts") class Account {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="role_id",nullable=false) Role role;
    @Column(name="google_subject",unique=true) String googleSubject;
    @Column(nullable=false,unique=true) String email;
    @Column(name="display_name",nullable=false) String displayName;
    @Column(name="avatar_url") String avatarUrl;
    @Column(name="is_active",nullable=false) boolean active=true;
    @Column(name="provisioned_by_account_id") Long provisionedByAccountId;
    @Column(name="last_login_at") LocalDateTime lastLoginAt;
    @Column(name="created_at",nullable=false) LocalDateTime createdAt;
    @Column(name="updated_at",nullable=false) LocalDateTime updatedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); updatedAt=createdAt; }
    @PreUpdate void update() { updatedAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
@Entity @Table(name="customer_profiles") class CustomerProfile {
    @Id @Column(name="account_id") Long accountId;
    String phone;
    @Column(columnDefinition="text") String preferences;
    @Column(name="internal_notes",columnDefinition="text") String internalNotes;
    @Column(name="created_at") LocalDateTime createdAt;
    @Column(name="updated_at") LocalDateTime updatedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); updatedAt=createdAt; }
}
@Entity @Table(name="staff_profiles") class StaffProfile {
    @Id @Column(name="account_id") Long accountId;
    @Column(name="employee_code",nullable=false) String employeeCode;
    @Column(name="job_title",nullable=false) String jobTitle;
    @Column(name="is_bookable",nullable=false) boolean bookable=true;
    @Column(name="created_at") LocalDateTime createdAt;
    @Column(name="updated_at") LocalDateTime updatedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); updatedAt=createdAt; }
}
@Entity @Table(name="services") class ServiceItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(nullable=false,unique=true) String name;
    @Column(nullable=false) String category;
    @Column(columnDefinition="text") String description;
    @Column(name="image_url") String imageUrl;
    @Column(name="base_price",nullable=false,precision=12,scale=2) BigDecimal basePrice;
    @Column(name="minimum_duration_minutes",nullable=false) int minimumDurationMinutes;
    @Column(name="is_duration_adjustable",nullable=false) boolean durationAdjustable;
    @Column(name="duration_step_minutes") Integer durationStepMinutes;
    @Column(name="price_per_duration_step",precision=12,scale=2) BigDecimal pricePerDurationStep;
    @Column(name="preparation_buffer_minutes",nullable=false) int preparationBufferMinutes;
    @Column(name="cleanup_buffer_minutes",nullable=false) int cleanupBufferMinutes;
    @Column(name="display_order",nullable=false) int displayOrder;
    @Column(name="is_active",nullable=false) boolean active=true;
    @Column(name="created_at") LocalDateTime createdAt;
    @Column(name="updated_at") LocalDateTime updatedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); updatedAt=createdAt; }
    @PreUpdate void update() { updatedAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
@Entity @Table(name="staff_working_hours") class StaffHours {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="staff_account_id",nullable=false) Long staffAccountId;
    @Column(name="day_of_week",nullable=false) byte dayOfWeek;
    @Column(name="start_time",nullable=false) java.time.LocalTime startTime;
    @Column(name="end_time",nullable=false) java.time.LocalTime endTime;
    @Column(name="is_active",nullable=false) boolean active=true;
    @Column(name="created_at") LocalDateTime createdAt;
    @Column(name="updated_at") LocalDateTime updatedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); updatedAt=createdAt; }
}
@Entity @Table(name="staff_time_off") class StaffTimeOff {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="staff_account_id",nullable=false) Long staffAccountId;
    @Column(name="start_at",nullable=false) LocalDateTime startAt;
    @Column(name="end_at",nullable=false) LocalDateTime endAt;
    String reason;
    @Column(name="created_at") LocalDateTime createdAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
enum BookingStatus { PENDING_PAYMENT, PENDING, CONFIRMED, CHECKED_IN, IN_SERVICE, COMPLETED, EXPIRED }
enum AssignmentSource { SYSTEM, CUSTOMER, ADMIN }
@Entity @Table(name="bookings") class Booking {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="booking_code",nullable=false,unique=true) String bookingCode;
    @Column(name="customer_account_id",nullable=false) Long customerAccountId;
    @Column(name="staff_account_id",nullable=false) Long staffAccountId;
    @Enumerated(EnumType.STRING) @Column(nullable=false) BookingStatus status=BookingStatus.PENDING_PAYMENT;
    @Enumerated(EnumType.STRING) @Column(name="assignment_source",nullable=false) AssignmentSource assignmentSource;
    @Column(name="customer_name_snapshot",nullable=false) String customerNameSnapshot;
    @Column(name="customer_email_snapshot",nullable=false) String customerEmailSnapshot;
    @Column(name="customer_phone_snapshot") String customerPhoneSnapshot;
    @Column(name="booking_start",nullable=false) LocalDateTime bookingStart;
    @Column(name="booking_end",nullable=false) LocalDateTime bookingEnd;
    @Column(name="occupied_start",nullable=false) LocalDateTime occupiedStart;
    @Column(name="occupied_end",nullable=false) LocalDateTime occupiedEnd;
    @Column(name="hold_expires_at") LocalDateTime holdExpiresAt;
    @Column(name="customer_note",columnDefinition="text") String customerNote;
    @Column(name="total_duration_minutes",nullable=false) int totalDurationMinutes;
    @Column(name="total_amount",nullable=false,precision=12,scale=2) BigDecimal totalAmount;
    @Column(name="checked_in_at") LocalDateTime checkedInAt;
    @Column(name="service_started_at") LocalDateTime serviceStartedAt;
    @Column(name="completed_at") LocalDateTime completedAt;
    @Column(name="created_by_account_id",nullable=false) Long createdByAccountId;
    @Column(name="created_at",nullable=false) LocalDateTime createdAt;
    @Column(name="updated_at",nullable=false) LocalDateTime updatedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); updatedAt=createdAt; }
    @PreUpdate void update() { updatedAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
@Entity @Table(name="booking_items") class BookingItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="booking_id",nullable=false) Long bookingId;
    @Column(name="service_id",nullable=false) Long serviceId;
    @Column(name="service_name_snapshot",nullable=false) String serviceNameSnapshot;
    @Column(name="duration_minutes",nullable=false) int durationMinutes;
    @Column(name="base_price_snapshot",nullable=false,precision=12,scale=2) BigDecimal basePriceSnapshot;
    @Column(name="additional_duration_steps",nullable=false) int additionalDurationSteps;
    @Column(name="price_per_step_snapshot",nullable=false,precision=12,scale=2) BigDecimal pricePerStepSnapshot;
    @Column(name="line_amount",nullable=false,precision=12,scale=2) BigDecimal lineAmount;
    @Column(name="created_at") LocalDateTime createdAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
@Entity @Table(name="booking_events") class BookingEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="booking_id",nullable=false) Long bookingId;
    @Column(name="event_type",nullable=false) String eventType;
    @Column(name="actor_account_id") Long actorAccountId;
    @Column(nullable=false) String message;
    @Column(name="occurred_at") LocalDateTime occurredAt;
    @PrePersist void create() { occurredAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
enum PaymentStatus { UNPAID, PAID, FAILED, REFUNDED }
@Entity @Table(name="payments") class Payment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="transaction_code",nullable=false,unique=true) String transactionCode;
    @Column(name="booking_id",nullable=false,unique=true) Long bookingId;
    @Enumerated(EnumType.STRING) @Column(nullable=false) PaymentStatus status=PaymentStatus.UNPAID;
    @Column(nullable=false) String method="QR";
    @Column(nullable=false,precision=12,scale=2) BigDecimal amount;
    @Column(name="qr_payload",columnDefinition="text") String qrPayload;
    @Column(name="paid_at") LocalDateTime paidAt;
    @Column(name="refunded_at") LocalDateTime refundedAt;
    @Column(name="created_at") LocalDateTime createdAt;
    @Column(name="updated_at") LocalDateTime updatedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); updatedAt=createdAt; }
    @PreUpdate void update() { updatedAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
@Entity @Table(name="feedback") class Feedback {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="booking_id",nullable=false,unique=true) Long bookingId;
    @Column(nullable=false) byte rating;
    @Column(columnDefinition="text") String comment;
    @Column(name="created_at") LocalDateTime createdAt;
    @Column(name="updated_at") LocalDateTime updatedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); updatedAt=createdAt; }
}
@Entity @Table(name="reschedule_requests") class RescheduleRequest {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="booking_id",nullable=false) Long bookingId;
    @Column(name="customer_account_id",nullable=false) Long customerAccountId;
    @Column(nullable=false,length=1000) String reason;
    @Column(nullable=false) String status="REQUESTED";
    @Column(name="staff_account_id") Long staffAccountId;
    @Column(name="staff_note",length=1000) String staffNote;
    @Column(name="created_at") LocalDateTime createdAt;
    @Column(name="resolved_at") LocalDateTime resolvedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
@Entity @Table(name="refresh_sessions") class RefreshSession {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="account_id",nullable=false) Long accountId;
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.CHAR) @Column(name="token_hash",nullable=false,unique=true,length=64) String tokenHash;
    @Column(name="expires_at",nullable=false) LocalDateTime expiresAt;
    @Column(name="revoked_at") LocalDateTime revokedAt;
    @Column(name="created_at") LocalDateTime createdAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
@Entity @Table(name="webhook_inbox") class WebhookInbox {
    @Id @Column(name="sepay_id") Long sepayId;
    @Column(name="reference_code") String referenceCode;
    @Column(length=1000) String content;
    @Column(nullable=false,precision=12,scale=2) BigDecimal amount;
    @Column(nullable=false) String outcome;
    @Column(name="booking_id") Long bookingId;
    @Column(name="received_at") LocalDateTime receivedAt;
    @PrePersist void create() { receivedAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
@Entity @Table(name="outbox_events") class OutboxEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(nullable=false) String topic;
    @Column(name="aggregate_key",nullable=false) String aggregateKey;
    @Column(nullable=false,columnDefinition="text") String payload;
    @Column(name="created_at") LocalDateTime createdAt;
    @Column(name="published_at") LocalDateTime publishedAt;
    @PrePersist void create() { createdAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
@Entity @Table(name="audit_log") class AuditLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(name="actor_account_id") Long actorAccountId;
    @Column(nullable=false) String action;
    @Column(name="target_type",nullable=false) String targetType;
    @Column(name="target_id",nullable=false) String targetId;
    @Column(columnDefinition="text") String details;
    @Column(name="occurred_at") LocalDateTime occurredAt;
    @PrePersist void create() { occurredAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
}
