package com.kevin.lunaraspa.dto.profile;

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
