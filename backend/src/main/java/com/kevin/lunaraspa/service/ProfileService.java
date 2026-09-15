package com.kevin.lunaraspa.service;

import com.kevin.lunaraspa.dto.profile.ProfileResponseDTO;
import com.kevin.lunaraspa.dto.profile.ProfileUpdateRequest;

public interface ProfileService {
    ProfileResponseDTO getMyProfile(String email);
    ProfileResponseDTO updateMyProfile(String email, ProfileUpdateRequest request);
}
