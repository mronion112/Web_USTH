package vn.edu.usth.lunara.spaservice.controller;

import jakarta.validation.constraints.Positive;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.usth.lunara.common.api.ApiResponse;
import vn.edu.usth.lunara.spaservice.dto.SpaServiceDetailResponse;
import vn.edu.usth.lunara.spaservice.dto.SpaServiceListResponse;
import vn.edu.usth.lunara.spaservice.service.SpaServiceService;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/services")
public class SpaServiceController {

    private final SpaServiceService service;

    public SpaServiceController(SpaServiceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SpaServiceListResponse>>> getServices() {
        return ResponseEntity.ok(ApiResponse.success(
                "Get services successfully",
                service.getActiveServices()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SpaServiceDetailResponse>> getService(
            @PathVariable @Positive(message = "must be greater than 0") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Get service successfully",
                service.getActiveService(id)
        ));
    }
}
