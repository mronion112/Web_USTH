package com.kevin.lunaraspa.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerCreateBookingRequest {
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String customerNote;
    private LocalDateTime bookingStart;
    private Long staffAccountId;
    private List<BookingItemRequest> items;
}
