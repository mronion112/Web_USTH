package com.kevin.lunaraspa.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingSummaryResponse {
    private Long id;
    private String bookingCode;
    private String status;
    private LocalDateTime bookingStart;
    private LocalDateTime bookingEnd;
    private BigDecimal totalAmount;
}
