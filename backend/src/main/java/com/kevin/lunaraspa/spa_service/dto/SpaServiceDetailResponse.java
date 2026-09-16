package com.kevin.lunaraspa.spa_service.dto;

import java.math.BigDecimal;
import java.util.List;

public record SpaServiceDetailResponse(
        Long id,
        String name,
        String category,
        BigDecimal basePrice,
        Integer minimumDurationMinutes,
        Integer preparationBufferMinutes,
        Integer cleanupBufferMinutes,
        List<StaffSummaryResponse> staff
) {
}
