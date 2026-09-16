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
public class CreateBookingRequest {
    private Long staffAccountId;
    private LocalDateTime bookingStart;
    private String customerNote;
    private List<BookingItemRequest> items;
}
