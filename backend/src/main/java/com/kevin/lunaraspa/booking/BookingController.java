package com.kevin.lunaraspa.booking;

import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.booking.dto.AssignStaffRequest;
import com.kevin.lunaraspa.booking.dto.AvailabilityRequest;
import com.kevin.lunaraspa.booking.dto.AvailabilityResponse;
import com.kevin.lunaraspa.booking.dto.AssignStaffResponse;
import com.kevin.lunaraspa.booking.dto.BookingApiResponse;
import com.kevin.lunaraspa.booking.dto.BookingDetailResponse;
import com.kevin.lunaraspa.booking.dto.BookingSummaryResponse;
import com.kevin.lunaraspa.booking.dto.BookingSearchResponse;
import com.kevin.lunaraspa.booking.dto.BookingSortField;
import com.kevin.lunaraspa.booking.dto.CheckInResponse;
import com.kevin.lunaraspa.booking.dto.RescheduleBookingRequest;
import com.kevin.lunaraspa.booking.dto.RescheduleBookingResponse;
import com.kevin.lunaraspa.booking.dto.ManagerCreateBookingRequest;
import com.kevin.lunaraspa.booking.dto.EmailDispatchResponse;
import com.kevin.lunaraspa.booking.entity.BookingStatus;
import com.kevin.lunaraspa.core.common.model.response.PageableResponse;
import com.kevin.lunaraspa.booking.dto.CreateBookingRequest;
import com.kevin.lunaraspa.booking.dto.CreateBookingResponse;
import com.kevin.lunaraspa.booking.service.BookingService;
import com.kevin.lunaraspa.booking.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${app.frontend-url}")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final AvailabilityService availabilityService;

    @PostMapping("/availability")
    public ResponseEntity<BookingApiResponse<AvailabilityResponse>> availability(
            @RequestBody AvailabilityRequest request
    ) {
        return ResponseEntity.ok(BookingApiResponse.success("Get availability successfully",
                availabilityService.findAvailability(request)));
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingApiResponse<CreateBookingResponse>> createBooking(
            @RequestBody CreateBookingRequest request
    ) {
        CreateBookingResponse booking = bookingService.createBooking(
                request,
                SecurityUtils.getCurrentUserEmail()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BookingApiResponse.success("Booking created successfully", booking, HttpStatus.CREATED));
    }

    @GetMapping("/bookings/my")
    public ResponseEntity<BookingApiResponse<List<BookingSummaryResponse>>> getMyBookings() {
        List<BookingSummaryResponse> bookings = bookingService.getMyBookings(
                SecurityUtils.getCurrentUserEmail()
        );
        return ResponseEntity.ok(
                BookingApiResponse.success("Get bookings successfully", bookings)
        );
    }

    @GetMapping("/bookings/{bookingCode}")
    public ResponseEntity<BookingApiResponse<BookingDetailResponse>> getBooking(
            @PathVariable String bookingCode
    ) {
        BookingDetailResponse booking = bookingService.getBookingByCode(
                bookingCode,
                SecurityUtils.getCurrentUserEmail()
        );
        return ResponseEntity.ok(
                BookingApiResponse.success("Get booking successfully", booking)
        );
    }

    @PatchMapping("/bookings/{bookingCode}/reschedule")
    public ResponseEntity<BookingApiResponse<RescheduleBookingResponse>> reschedule(
            @PathVariable String bookingCode, @RequestBody RescheduleBookingRequest request) {
        return ResponseEntity.ok(BookingApiResponse.success("Reschedule booking successfully",
                bookingService.reschedule(bookingCode, request, SecurityUtils.getCurrentUserEmail())));
    }

    @PatchMapping("/manager/bookings/{bookingId}/assign")
    public ResponseEntity<BookingApiResponse<AssignStaffResponse>> assignStaff(
            @PathVariable Long bookingId,
            @RequestBody AssignStaffRequest request
    ) {
        AssignStaffResponse booking = bookingService.assignStaff(
                bookingId,
                request,
                SecurityUtils.getCurrentUserEmail()
        );
        return ResponseEntity.ok(
                BookingApiResponse.success("Assign staff successfully", booking)
        );
    }

    @GetMapping("/manager/bookings")
    public ResponseEntity<BookingApiResponse<PageableResponse<BookingSearchResponse>>> searchBookings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long staffId,
            @RequestParam(required = false) Boolean unassigned,
            @RequestParam(required = false) String code,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "BOOKING_START") BookingSortField sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ResponseEntity.ok(BookingApiResponse.success("Search bookings successfully",
                bookingService.searchBookings(from, to, status, staffId, unassigned, code, page, size,
                        sortBy, sortDirection, SecurityUtils.getCurrentUserEmail())));
    }

    @PostMapping("/manager/bookings")
    public ResponseEntity<BookingApiResponse<CreateBookingResponse>> createManagerBooking(
            @RequestBody ManagerCreateBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(BookingApiResponse.success(
                "Booking created successfully",
                bookingService.createManagerBooking(request, SecurityUtils.getCurrentUserEmail()), HttpStatus.CREATED));
    }

    @PatchMapping("/manager/bookings/{bookingId}/check-in")
    public ResponseEntity<BookingApiResponse<CheckInResponse>> checkIn(@PathVariable Long bookingId) {
        return ResponseEntity.ok(BookingApiResponse.success("Check-in successfully",
                bookingService.checkIn(bookingId, SecurityUtils.getCurrentUserEmail())));
    }

    @PatchMapping("/manager/bookings/{bookingId}/reschedule")
    public ResponseEntity<BookingApiResponse<RescheduleBookingResponse>> rescheduleByManager(
            @PathVariable Long bookingId, @RequestBody RescheduleBookingRequest request) {
        return ResponseEntity.ok(BookingApiResponse.success("Reschedule booking successfully",
                bookingService.rescheduleByManager(bookingId, request, SecurityUtils.getCurrentUserEmail())));
    }

    @PostMapping("/manager/bookings/{bookingId}/email/resend")
    public ResponseEntity<BookingApiResponse<EmailDispatchResponse>> resendBookingEmail(
            @PathVariable Long bookingId) {
        return ResponseEntity.accepted().body(BookingApiResponse.success("Booking email queued",
                bookingService.resendBookingEmail(bookingId, SecurityUtils.getCurrentUserEmail()),
                HttpStatus.ACCEPTED));
    }
}
