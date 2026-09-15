package com.kevin.lunaraspa.core.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum SystemErrorCode implements BaseErrorCode {
    INTERNAL_SERVER_ERROR("SYS_500", "Internal server error occurred", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST("SYS_400", "Invalid request parameters", HttpStatus.BAD_REQUEST),
    NOT_FOUND("SYS_404", "Resource not found", HttpStatus.NOT_FOUND),
    ACCESS_DENIED("SYS_403", "Access denied", HttpStatus.FORBIDDEN);

    private final String code;
    private final String message;
    private final HttpStatus status;
}
