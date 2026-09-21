package com.kevin.lunaraspa.profiles.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO đóng gói thông tin hồ sơ người dùng trả về cho client.
 * Bao gồm thông tin cơ bản của Account cùng trường thông tin tương ứng theo Role (Customer hoặc Staff).
 */
@Data
@Builder
public class ProfileResponseDTO {
    private Long id;
    private Long accountId;
    private String displayName;
    private String email;
    private String phone;
    private String preferences;
    private String role;
    private String employeeCode;
    private String jobTitle;
    private Boolean isBookable;
}
