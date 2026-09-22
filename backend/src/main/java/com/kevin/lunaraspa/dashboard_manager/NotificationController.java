package com.kevin.lunaraspa.dashboard_manager;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/manager/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NamedParameterJdbcTemplate jdbc;
    private final AccountRepository accountRepository;

    private static final List<String> RECEPTIONIST_EVENTS = List.of(
            "CREATED", "CHECKED_IN", "SERVICE_STARTED", "COMPLETED", "RESCHEDULED", "STAFF_ASSIGNED", "CANCELLED",
            "PAYMENT_INITIALIZED", "PAYMENT_RECEIVED"
    );

    private static final List<String> ACCOUNTANT_EVENTS = List.of(
            "PAYMENT_RECEIVED", "PAYMENT_REFUNDED", "PAYMENT_INITIALIZED"
    );

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Object> getNotifications(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        String role = "OWNER";
        Long accountId = null;

        try {
            String email = SecurityUtils.getCurrentUserEmail();
            Account account = accountRepository.findByEmail(email).orElse(null);
            if (account != null) {
                if (account.getRole() != null && account.getRole().getCode() != null) {
                    role = account.getRole().getCode();
                }
                accountId = account.getId();
            }
        } catch (Exception ignored) {
        }

        StringBuilder sql = new StringBuilder("""
                SELECT be.id, be.booking_id, b.booking_code, be.event_type, be.message, be.occurred_at
                FROM booking_events be
                LEFT JOIN bookings b ON be.booking_id = b.id
                """);

        Map<String, Object> params = new HashMap<>();
        params.put("limit", Math.max(1, Math.min(100, limit)));
        params.put("offset", Math.max(0, offset));

        if ("RECEPTIONIST".equalsIgnoreCase(role)) {
            sql.append(" WHERE be.event_type IN (:eventTypes) ");
            params.put("eventTypes", RECEPTIONIST_EVENTS);
        } else if ("ACCOUNTANT".equalsIgnoreCase(role)) {
            sql.append(" WHERE be.event_type IN (:eventTypes) ");
            params.put("eventTypes", ACCOUNTANT_EVENTS);
        } else if ("THERAPIST".equalsIgnoreCase(role) && accountId != null) {
            sql.append("""
                     WHERE (b.staff_account_id = :staffAccountId 
                            OR EXISTS (SELECT 1 FROM booking_items bi WHERE bi.booking_id = b.id AND bi.staff_account_id = :staffAccountId)) 
                    """);
            params.put("staffAccountId", accountId);
        } else if ("CUSTOMER".equalsIgnoreCase(role) && accountId != null) {
            sql.append(" WHERE b.customer_account_id = :customerAccountId ");
            params.put("customerAccountId", accountId);
        }

        sql.append("""
                ORDER BY be.occurred_at DESC, be.id DESC
                LIMIT :limit OFFSET :offset
                """);

        List<NotificationRow> list = jdbc.query(sql.toString(), params, (rs, rowNum) -> new NotificationRow(
                rs.getLong("id"),
                rs.getObject("booking_id") != null ? rs.getLong("booking_id") : null,
                rs.getString("booking_code"),
                rs.getString("event_type"),
                rs.getString("message"),
                rs.getObject("occurred_at", LocalDateTime.class)
        ));

        return ResponseBuilder.ok(list, "Get notifications successfully");
    }

    public record NotificationRow(
            Long id,
            Long bookingId,
            String bookingCode,
            String eventType,
            String message,
            LocalDateTime occurredAt
    ) {}
}
