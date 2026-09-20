package com.kevin.lunaraspa.booking.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Builder @AllArgsConstructor
public class CheckInResponse {
    private final Long bookingId;
    private final String status;
    private final LocalDateTime checkedInAt;
}
