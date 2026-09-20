package com.kevin.lunaraspa.booking.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AvailabilityRequest {
    private List<BookingItemRequest> items;
    private LocalDateTime from;
    private LocalDateTime to;
    private Long staffAccountId;
    private Integer slotIntervalMinutes;
}
