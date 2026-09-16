package com.kevin.lunaraspa.booking;

import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.booking.dto.AssignStaffRequest;
import com.kevin.lunaraspa.booking.dto.AssignStaffResponse;
import com.kevin.lunaraspa.booking.dto.BookingApiResponse;
import com.kevin.lunaraspa.booking.dto.BookingDetailResponse;
import com.kevin.lunaraspa.booking.dto.BookingSummaryResponse;
import com.kevin.lunaraspa.booking.dto.CreateBookingRequest;
import com.kevin.lunaraspa.booking.dto.CreateBookingResponse;
import com.kevin.lunaraspa.booking.service.BookingService;
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

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${app.frontend-url}")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/bookings")
    public ResponseEntity<BookingApiResponse<CreateBookingResponse>> createBooking(
            @RequestBody CreateBookingRequest request
    ) {
        CreateBookingResponse booking = bookingService.createBooking(
                request,
                SecurityUtils.getCurrentUserEmail()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BookingApiResponse.success("Booking created successfully", booking));
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
}
