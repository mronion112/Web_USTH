package com.kevin.lunaraspa.controller;

import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.dto.profile.ProfileUpdateRequest;
import com.kevin.lunaraspa.security.SecurityUtils;
import com.kevin.lunaraspa.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<Object> getMyProfile() {
        return ResponseBuilder.ok(profileService.getMyProfile(SecurityUtils.getCurrentUserEmail()));
    }

    @PutMapping("/me")
    public ResponseEntity<Object> updateMyProfile(@RequestBody ProfileUpdateRequest request) {
        return ResponseBuilder.ok(profileService.updateMyProfile(SecurityUtils.getCurrentUserEmail(), request));
    }
}
