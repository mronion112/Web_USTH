package com.kevin.lunaraspa.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingResponse {
    private Long id;
    private String bookingCode;
    private String status;
    private String assignmentSource;
    private Long staffAccountId;
    private LocalDateTime bookingStart;
    private LocalDateTime bookingEnd;
    private Integer totalDurationMinutes;
    private BigDecimal totalAmount;
    private List<BookingItemResponse> items;
}
