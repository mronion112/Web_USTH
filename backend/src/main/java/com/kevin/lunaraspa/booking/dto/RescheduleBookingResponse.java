package com.kevin.lunaraspa.booking.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Builder @AllArgsConstructor
public class RescheduleBookingResponse {
    private final Long bookingId;
    private final String bookingCode;
    private final Long staffAccountId;
    private final LocalDateTime bookingStart;
    private final LocalDateTime bookingEnd;
}
