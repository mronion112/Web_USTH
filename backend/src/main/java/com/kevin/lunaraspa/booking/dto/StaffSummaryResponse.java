package com.kevin.lunaraspa.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffSummaryResponse {
    private Long accountId;
    private String displayName;
}
