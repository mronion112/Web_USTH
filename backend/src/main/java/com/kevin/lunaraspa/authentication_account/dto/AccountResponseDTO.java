package com.kevin.lunaraspa.authentication_account.dto;

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
    private String avatarUrl;
    private String role;
    private Boolean isActive;
}
