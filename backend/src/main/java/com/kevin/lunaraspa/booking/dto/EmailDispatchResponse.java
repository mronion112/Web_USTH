package com.kevin.lunaraspa.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class EmailDispatchResponse {
    private Long bookingId;
    private String bookingCode;
    private String status;
}
