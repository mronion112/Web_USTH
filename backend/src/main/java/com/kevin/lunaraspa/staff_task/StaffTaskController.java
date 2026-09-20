package com.kevin.lunaraspa.staff_task;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.booking.entity.*;
import com.kevin.lunaraspa.booking.exception.BookingFeatureErrorCode;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.staff_task.dto.StaffTaskDtos.*;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff/tasks")
@RequiredArgsConstructor
public class StaffTaskController {
    private final BookingRepository bookingRepository;
    private final AccountRepository accountRepository;
    private final RealtimeEventPublisher realtimeEventPublisher;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Object> tasks(@RequestParam(required = false) LocalDate date) {
        Account staff = currentStaff();
        List<TaskResponse> data = bookingRepository.findByStaffAccountIdOrderByBookingStartDesc(staff.getId())
                .stream().filter(booking -> date == null || booking.getBookingStart().toLocalDate().equals(date))
                .map(this::toTask).toList();
        return ResponseBuilder.ok(data, "Get staff tasks successfully");
    }

    @PatchMapping("/{bookingId}/start")
    @Transactional
    public ResponseEntity<Object> start(@PathVariable Long bookingId) {
        Account staff = currentStaff();
        Booking booking = ownedBooking(bookingId, staff.getId());
        if (booking.getStatus() != BookingStatus.CHECKED_IN)
            throw new AppException(BookingFeatureErrorCode.INVALID_STATUS_TRANSITION);
        LocalDateTime now = LocalDateTime.now();
        booking.setStatus(BookingStatus.IN_SERVICE);
        booking.setServiceStartedAt(now);
        booking.addEvent(event("SERVICE_STARTED", staff.getId(), "Staff started the service.", now));
        bookingRepository.saveAndFlush(booking);
        realtimeEventPublisher.bookingChanged(booking, "SERVICE_STARTED");
        return ResponseBuilder.ok(new TransitionResponse(booking.getId(), booking.getStatus().name(), now, null),
                "Service started successfully");
    }

    @PatchMapping("/{bookingId}/complete")
    @Transactional
    public ResponseEntity<Object> complete(@PathVariable Long bookingId) {
        Account staff = currentStaff();
        Booking booking = ownedBooking(bookingId, staff.getId());
        if (booking.getStatus() != BookingStatus.IN_SERVICE)
            throw new AppException(BookingFeatureErrorCode.INVALID_STATUS_TRANSITION);
        LocalDateTime now = LocalDateTime.now();
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(now);
        booking.addEvent(event("COMPLETED", staff.getId(), "Staff completed the service.", now));
        bookingRepository.saveAndFlush(booking);
        realtimeEventPublisher.bookingChanged(booking, "COMPLETED");
        return ResponseBuilder.ok(new TransitionResponse(booking.getId(), booking.getStatus().name(),
                booking.getServiceStartedAt(), now), "Service completed successfully");
    }

    private Account currentStaff() {
        Account account = accountRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.STAFF_ACCOUNT_REQUIRED));
        if (!Boolean.TRUE.equals(account.getIsActive()) || account.getStaffProfile() == null)
            throw new AppException(BookingFeatureErrorCode.STAFF_ACCOUNT_REQUIRED);
        return account;
    }
    private Booking ownedBooking(Long id, Long staffId) {
        if (id == null || id <= 0) throw new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND);
        Booking booking = bookingRepository.findByIdWithItems(id)
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND));
        if (!staffId.equals(booking.getStaffAccountId())) throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        return booking;
    }
    private TaskResponse toTask(Booking b) {
        return new TaskResponse(b.getId(), b.getBookingCode(), b.getStatus().name(), b.getBookingStart(),
                b.getBookingEnd(), b.getCustomerNameSnapshot(), b.getItems().stream()
                .map(i -> new TaskService(i.getServiceNameSnapshot(), i.getDurationMinutes())).toList());
    }
    private BookingEvent event(String type, Long actor, String message, LocalDateTime at) {
        return BookingEvent.builder().eventType(type).actorAccountId(actor).message(message).occurredAt(at).build();
    }
}
