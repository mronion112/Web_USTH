package com.kevin.lunaraspa.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDetailResponse {
    private Long id;
    private String bookingCode;
    private String status;
    private String customerName;
    private String customerEmail;
    private StaffSummaryResponse staff;
    private List<BookingItemResponse> items;
    private BigDecimal totalAmount;
}
