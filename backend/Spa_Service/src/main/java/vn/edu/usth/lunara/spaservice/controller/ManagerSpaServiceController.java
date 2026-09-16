package vn.edu.usth.lunara.spaservice.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.usth.lunara.common.api.ApiResponse;
import vn.edu.usth.lunara.spaservice.dto.CreateSpaServiceRequest;
import vn.edu.usth.lunara.spaservice.dto.CreateSpaServiceResponse;
import vn.edu.usth.lunara.spaservice.service.SpaServiceService;

@RestController
@RequestMapping("/api/manager/services")
public class ManagerSpaServiceController {

    private final SpaServiceService service;

    public ManagerSpaServiceController(SpaServiceService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CreateSpaServiceResponse>> createService(
            @Valid @RequestBody CreateSpaServiceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Create service successfully",
                service.createService(request)
        ));
    }
}
