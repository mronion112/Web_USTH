package com.kevin.lunaraspa.booking.service;

import com.kevin.lunaraspa.booking.dto.AssignStaffRequest;
import com.kevin.lunaraspa.booking.dto.AssignStaffResponse;
import com.kevin.lunaraspa.booking.dto.BookingDetailResponse;
import com.kevin.lunaraspa.booking.dto.BookingSummaryResponse;
import com.kevin.lunaraspa.booking.dto.CreateBookingRequest;
import com.kevin.lunaraspa.booking.dto.CreateBookingResponse;
import com.kevin.lunaraspa.booking.dto.BookingSearchResponse;
import com.kevin.lunaraspa.booking.dto.CheckInResponse;
import com.kevin.lunaraspa.booking.dto.RescheduleBookingRequest;
import com.kevin.lunaraspa.booking.dto.RescheduleBookingResponse;
import com.kevin.lunaraspa.booking.dto.ManagerCreateBookingRequest;
import com.kevin.lunaraspa.booking.entity.BookingStatus;
import com.kevin.lunaraspa.core.common.model.response.PageableResponse;

import java.time.LocalDateTime;

import java.util.List;

public interface BookingService {
    CreateBookingResponse createBooking(CreateBookingRequest request, String currentUserEmail);

    CreateBookingResponse createManagerBooking(ManagerCreateBookingRequest request, String currentUserEmail);

    List<BookingSummaryResponse> getMyBookings(String currentUserEmail);

    BookingDetailResponse getBookingByCode(String bookingCode, String currentUserEmail);

    AssignStaffResponse assignStaff(
            Long bookingId,
            AssignStaffRequest request,
            String currentUserEmail
    );

    PageableResponse<BookingSearchResponse> searchBookings(LocalDateTime from, LocalDateTime to,
            BookingStatus status, Long staffId, Boolean unassigned, String code, int page, int size,
            String currentUserEmail);

    CheckInResponse checkIn(Long bookingId, String currentUserEmail);

    RescheduleBookingResponse reschedule(String bookingCode, RescheduleBookingRequest request,
                                         String currentUserEmail);
}
