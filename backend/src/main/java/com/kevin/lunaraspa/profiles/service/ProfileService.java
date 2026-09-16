package com.kevin.lunaraspa.profiles.service;

import com.kevin.lunaraspa.profiles.dto.ProfileResponseDTO;
import com.kevin.lunaraspa.profiles.dto.ProfileUpdateRequest;

public interface ProfileService {
    ProfileResponseDTO getMyProfile(String email);
    ProfileResponseDTO updateMyProfile(String email, ProfileUpdateRequest request);
}
