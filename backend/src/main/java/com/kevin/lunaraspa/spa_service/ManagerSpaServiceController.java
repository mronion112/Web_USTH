package com.kevin.lunaraspa.spa_service;

import com.kevin.lunaraspa.spa_service.dto.CreateSpaServiceRequest;
import com.kevin.lunaraspa.spa_service.dto.CreateSpaServiceResponse;
import com.kevin.lunaraspa.spa_service.dto.SpaServiceApiResponse;
import com.kevin.lunaraspa.spa_service.service.SpaServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/services")
@RequiredArgsConstructor
public class ManagerSpaServiceController {

    private final SpaServiceService service;

    @PostMapping
    public ResponseEntity<SpaServiceApiResponse<CreateSpaServiceResponse>> createService(
            @Valid @RequestBody CreateSpaServiceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(SpaServiceApiResponse.success(
                "Create service successfully",
                service.createService(request)
        ));
    }
}
