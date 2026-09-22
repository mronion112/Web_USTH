package com.kevin.lunaraspa.booking.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Builder @AllArgsConstructor
public class BookingSearchResponse {
    private final Long id;
    private final String bookingCode;
    private final String status;
    private final Long customerAccountId;
    private final String customerName;
    private final String customerPhone;
    private final Long staffAccountId;
    private final String staffName;
    private final List<String> serviceNames;
    private final LocalDateTime bookingStart;
    private final LocalDateTime bookingEnd;
    private final BigDecimal totalAmount;
}
