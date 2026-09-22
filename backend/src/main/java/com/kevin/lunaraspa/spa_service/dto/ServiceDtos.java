package com.kevin.lunaraspa.spa_service.dto;

import java.math.BigDecimal;
import java.util.List;

public final class ServiceDtos {
    private ServiceDtos() {}

    public record StaffResponse(Long accountId, String displayName) {}
    public record ServiceResponse(Long id, String name, String category, String description, String imageUrl,
                                  BigDecimal basePrice, Integer minimumDurationMinutes,
                                  Boolean isDurationAdjustable, Integer durationStepMinutes,
                                  BigDecimal pricePerDurationStep, Integer preparationBufferMinutes,
                                  Integer cleanupBufferMinutes, Boolean isActive, List<StaffResponse> staff) {}
    public record CreateServiceRequest(String name, String category, String description, String imageUrl,
                                       BigDecimal basePrice, Integer minimumDurationMinutes,
                                       Boolean isDurationAdjustable, Integer durationStepMinutes,
                                       BigDecimal pricePerDurationStep, Integer preparationBufferMinutes,
                                       Integer cleanupBufferMinutes) {}
}
