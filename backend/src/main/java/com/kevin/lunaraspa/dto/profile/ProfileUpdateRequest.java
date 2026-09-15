package com.kevin.lunaraspa.dto.profile;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileUpdateRequest {
    private String displayName;
    private String phone;
    private String preferences;
}
