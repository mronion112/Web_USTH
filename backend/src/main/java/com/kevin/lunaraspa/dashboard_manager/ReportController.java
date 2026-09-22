package com.kevin.lunaraspa.dashboard_manager;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.SystemErrorCode;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private static final Set<String> ALLOWED_ROLES = Set.of("OWNER", "MANAGER", "ACCOUNTANT");
    private final NamedParameterJdbcTemplate jdbc;
    private final AccountRepository accountRepository;

    @GetMapping("/summary")
    @Transactional(readOnly = true)
    public ResponseEntity<Object> summary(@RequestParam LocalDate from, @RequestParam LocalDate to,
                                          @RequestParam(defaultValue = "DAY") String groupBy) {
        ensureAccess();
        if (from == null || to == null || from.isAfter(to) || to.isAfter(from.plusDays(366)))
            throw new AppException(SystemErrorCode.INVALID_REQUEST, "Report range must be at most 366 days");
        String grouping = switch (groupBy.toUpperCase(Locale.ROOT)) {
            case "DAY" -> "DATE(b.booking_start)";
            case "WEEK" -> "DATE_FORMAT(b.booking_start, '%x-W%v')";
            case "MONTH" -> "DATE_FORMAT(b.booking_start, '%Y-%m')";
            default -> throw new AppException(SystemErrorCode.INVALID_REQUEST, "groupBy must be DAY, WEEK, or MONTH");
        };
        Map<String, Object> params = Map.of("from", from.atStartOfDay(), "to", to.plusDays(1).atStartOfDay());
        Map<String, Object> totals = jdbc.queryForMap("""
                SELECT COUNT(*) total_bookings,
                       COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END), 0) completed_bookings,
                       COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) paid_revenue
                FROM bookings b LEFT JOIN payments p ON p.booking_id = b.id
                WHERE b.booking_start >= :from AND b.booking_start < :to
                """, params);
        String seriesSql = """
                SELECT %s period, COUNT(*) booking_count,
                       COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END), 0) completed_count,
                       COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) paid_revenue
                FROM bookings b LEFT JOIN payments p ON p.booking_id = b.id
                WHERE b.booking_start >= :from AND b.booking_start < :to
                GROUP BY %s ORDER BY MIN(b.booking_start)
                """.formatted(grouping, grouping);
        List<PeriodSummary> series = jdbc.query(seriesSql, params, (rs, row) -> new PeriodSummary(
                rs.getString("period"), rs.getLong("booking_count"), rs.getLong("completed_count"),
                rs.getBigDecimal("paid_revenue")));
        ReportSummary response = new ReportSummary(from, to, groupBy.toUpperCase(Locale.ROOT),
                ((Number) totals.get("total_bookings")).longValue(),
                ((Number) totals.get("completed_bookings")).longValue(),
                toBigDecimal(totals.get("paid_revenue")), series);
        return ResponseBuilder.ok(response, "Get report summary successfully");
    }

    private void ensureAccess() {
        Account account = accountRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .orElseThrow(() -> new AppException(SystemErrorCode.ACCESS_DENIED));
        String role = account.getRole().getCode().toUpperCase(Locale.ROOT);
        if (role.startsWith("ROLE_")) role = role.substring(5);
        if (!ALLOWED_ROLES.contains(role)) throw new AppException(SystemErrorCode.ACCESS_DENIED);
    }
    private BigDecimal toBigDecimal(Object value) {
        return value instanceof BigDecimal decimal ? decimal : new BigDecimal(value.toString());
    }
    public record PeriodSummary(String period, long bookingCount, long completedCount, BigDecimal paidRevenue) {}
    public record ReportSummary(LocalDate from, LocalDate to, String groupBy, long totalBookings,
                                long completedBookings, BigDecimal paidRevenue, List<PeriodSummary> series) {}
}
