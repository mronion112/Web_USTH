package com.kevin.lunaraspa.spa_service.service;

import com.kevin.lunaraspa.spa_service.dto.CreateSpaServiceRequest;
import com.kevin.lunaraspa.spa_service.dto.CreateSpaServiceResponse;
import com.kevin.lunaraspa.spa_service.dto.SpaServiceDetailResponse;
import com.kevin.lunaraspa.spa_service.dto.SpaServiceListResponse;

import java.util.List;

public interface SpaServiceService {
    List<SpaServiceListResponse> getActiveServices();

    SpaServiceDetailResponse getActiveService(Long id);

    CreateSpaServiceResponse createService(CreateSpaServiceRequest request);
}
