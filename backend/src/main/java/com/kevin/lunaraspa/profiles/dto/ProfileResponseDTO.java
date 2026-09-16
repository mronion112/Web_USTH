package com.kevin.lunaraspa.profiles.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileResponseDTO {
    private Long id;
    private String displayName;
    private String email;
    private String phone;
    private String preferences;
    private String role;
}
