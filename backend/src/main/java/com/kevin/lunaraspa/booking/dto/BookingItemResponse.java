package com.kevin.lunaraspa.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingItemResponse {
    private Long serviceId;
    private String serviceName;
    private Integer durationMinutes;
    private BigDecimal lineAmount;
}
