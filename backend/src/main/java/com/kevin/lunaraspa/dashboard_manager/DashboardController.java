package com.kevin.lunaraspa.dashboard_manager;

import com.kevin.lunaraspa.booking.entity.BookingStatus;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.feedback.repository.FeedbackRepository;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import com.kevin.lunaraspa.payment.repository.PaymentRepository;
import com.kevin.lunaraspa.profiles.repository.CustomerProfileRepository;
import com.kevin.lunaraspa.profiles.repository.StaffProfileRepository;
import com.kevin.lunaraspa.spa_service.repository.SpaServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.*;

@RestController
@RequestMapping("/api/manager/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final CustomerProfileRepository customerRepository;
    private final StaffProfileRepository staffRepository;
    private final SpaServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final FeedbackRepository feedbackRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Object> dashboard() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        DashboardResponse data = new DashboardResponse(customerRepository.count(), staffRepository.count(),
                serviceRepository.countByActiveTrue(), bookingRepository.count(),
                bookingRepository.countByBookingStartGreaterThanEqualAndBookingStartLessThan(start, end),
                bookingRepository.countByStatus(BookingStatus.COMPLETED),
                paymentRepository.countByStatus(PaymentStatus.UNPAID), paymentRepository.sumPaidBetween(start, end),
                feedbackRepository.averageRating());
        return ResponseBuilder.ok(data, "Get dashboard successfully");
    }

    public record DashboardResponse(long totalCustomers, long totalStaff, long totalServices,
                                    long totalBookings, long todayBookings, long completedBookings,
                                    long pendingPayments, BigDecimal todayRevenue, BigDecimal averageRating) {}
}
