package com.kevin.lunaraspa.dto.auth;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AccountResponseDTO {
    private Long id;
    private String email;
    private String displayName;
    private String role;
}
