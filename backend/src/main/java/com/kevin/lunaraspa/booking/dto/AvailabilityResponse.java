package com.kevin.lunaraspa.booking.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Builder @AllArgsConstructor
public class AvailabilityResponse {
    private final Integer totalDurationMinutes;
    private final List<AvailableSlot> slots;

    @Getter @Builder @AllArgsConstructor
    public static class AvailableSlot {
        private final Long staffAccountId;
        private final String staffName;
        private final LocalDateTime bookingStart;
        private final LocalDateTime bookingEnd;
    }
}
