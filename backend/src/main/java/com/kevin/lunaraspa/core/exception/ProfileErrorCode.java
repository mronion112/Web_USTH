package com.kevin.lunaraspa.core.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ProfileErrorCode implements BaseErrorCode {
    PROFILE_NOT_FOUND("PROF_404", "Profile not found", HttpStatus.NOT_FOUND),
    INVALID_PROFILE_DATA("PROF_400", "Invalid profile data", HttpStatus.BAD_REQUEST),
    PROFILE_FORBIDDEN("PROF_403", "Only active customers can update their profile", HttpStatus.FORBIDDEN),
    ACCOUNT_INACTIVE("PROF_403_INACTIVE", "Account is inactive", HttpStatus.FORBIDDEN);

    private final String code;
    private final String message;
    private final HttpStatus status;
}
