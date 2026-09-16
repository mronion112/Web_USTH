package com.kevin.lunaraspa.spa_service;

import com.kevin.lunaraspa.spa_service.dto.SpaServiceApiResponse;
import com.kevin.lunaraspa.spa_service.dto.SpaServiceDetailResponse;
import com.kevin.lunaraspa.spa_service.dto.SpaServiceListResponse;
import com.kevin.lunaraspa.spa_service.service.SpaServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class SpaServiceController {

    private final SpaServiceService service;

    @GetMapping
    public ResponseEntity<SpaServiceApiResponse<List<SpaServiceListResponse>>> getServices() {
        return ResponseEntity.ok(SpaServiceApiResponse.success(
                "Get services successfully",
                service.getActiveServices()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpaServiceApiResponse<SpaServiceDetailResponse>> getService(@PathVariable Long id) {
        return ResponseEntity.ok(SpaServiceApiResponse.success(
                "Get service successfully",
                service.getActiveService(id)
        ));
    }
}
