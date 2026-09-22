package com.kevin.lunaraspa.spa_service.exception;

import com.kevin.lunaraspa.core.exception.BaseErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ServiceErrorCode implements BaseErrorCode {
    NOT_FOUND("SVC_001", "Service not found", HttpStatus.NOT_FOUND),
    INVALID_REQUEST("SVC_002", "Invalid service data", HttpStatus.BAD_REQUEST),
    NAME_EXISTS("SVC_003", "Service name already exists", HttpStatus.CONFLICT);
    private final String code;
    private final String message;
    private final HttpStatus status;
}
