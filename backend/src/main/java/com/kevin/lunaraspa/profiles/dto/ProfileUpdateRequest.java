package com.kevin.lunaraspa.profiles.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileUpdateRequest {
    private String displayName;
    private String phone;
    private String preferences;
}
