package com.kevin.lunaraspa.booking.service;

import com.kevin.lunaraspa.booking.dto.AssignStaffRequest;
import com.kevin.lunaraspa.booking.dto.AssignStaffResponse;
import com.kevin.lunaraspa.booking.dto.BookingDetailResponse;
import com.kevin.lunaraspa.booking.dto.BookingSummaryResponse;
import com.kevin.lunaraspa.booking.dto.CreateBookingRequest;
import com.kevin.lunaraspa.booking.dto.CreateBookingResponse;

import java.util.List;

public interface BookingService {
    CreateBookingResponse createBooking(CreateBookingRequest request, String currentUserEmail);

    List<BookingSummaryResponse> getMyBookings(String currentUserEmail);

    BookingDetailResponse getBookingByCode(String bookingCode, String currentUserEmail);

    AssignStaffResponse assignStaff(
            Long bookingId,
            AssignStaffRequest request,
            String currentUserEmail
    );
}
