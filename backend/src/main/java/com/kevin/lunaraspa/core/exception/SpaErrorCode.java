package com.kevin.lunaraspa.core.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum SpaErrorCode implements BaseErrorCode {
    SERVICE_NOT_FOUND("SPA_001", "Spa service not found", HttpStatus.NOT_FOUND),
    SERVICE_ALREADY_EXISTS("SPA_002", "Spa service with this code already exists", HttpStatus.CONFLICT),
    CATEGORY_NOT_FOUND("SPA_003", "Service category not found", HttpStatus.NOT_FOUND);

    private final String code;
    private final String message;
    private final HttpStatus status;
}
