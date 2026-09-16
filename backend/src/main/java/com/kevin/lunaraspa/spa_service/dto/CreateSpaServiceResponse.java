package com.kevin.lunaraspa.spa_service.dto;

public record CreateSpaServiceResponse(
        Long id,
        String name,
        boolean isActive
) {
}
