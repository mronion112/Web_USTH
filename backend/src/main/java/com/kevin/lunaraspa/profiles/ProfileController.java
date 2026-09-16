package com.kevin.lunaraspa.profiles;

import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.profiles.dto.ProfileUpdateRequest;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.profiles.service.ProfileService;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "Profiles", description = "Xem và cập nhật hồ sơ người dùng hiện tại")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    @Operation(summary = "Lấy hồ sơ người dùng hiện tại")
    public ResponseEntity<Object> getMyProfile() {
        return ResponseBuilder.ok(profileService.getMyProfile(SecurityUtils.getCurrentUserEmail()));
    }

    @PutMapping("/me")
    @Operation(summary = "Cập nhật hồ sơ người dùng hiện tại")
    public ResponseEntity<Object> updateMyProfile(@RequestBody ProfileUpdateRequest request) {
        return ResponseBuilder.ok(profileService.updateMyProfile(SecurityUtils.getCurrentUserEmail(), request));
    }
}
