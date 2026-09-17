package com.kevin.lunaraspa.profiles;

import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.profiles.dto.ProfileUpdateRequest;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.profiles.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<Object> getMyProfile() {
        return ResponseBuilder.ok(profileService.getMyProfile(SecurityUtils.getCurrentUserEmail()), "Get profile successfully");
    }

    @PutMapping("/me")
    public ResponseEntity<Object> updateMyProfile(@RequestBody Map<String, Object> body) {
        return ResponseBuilder.ok(profileService.updateMyProfile(SecurityUtils.getCurrentUserEmail(),
                ProfileUpdateRequest.from(body)), "Update profile successfully");
    }
}
