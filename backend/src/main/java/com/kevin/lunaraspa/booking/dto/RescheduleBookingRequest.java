package com.kevin.lunaraspa.booking.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RescheduleBookingRequest {
    private LocalDateTime bookingStart;
    private Long staffAccountId;
}
