package com.kevin.lunaraspa.spa_service.dto;

import java.math.BigDecimal;

public record SpaServiceListResponse(
        Long id,
        String name,
        String category,
        String description,
        String imageUrl,
        BigDecimal basePrice,
        Integer minimumDurationMinutes,
        boolean isDurationAdjustable,
        Integer durationStepMinutes,
        BigDecimal pricePerDurationStep,
        boolean isActive
) {
}
