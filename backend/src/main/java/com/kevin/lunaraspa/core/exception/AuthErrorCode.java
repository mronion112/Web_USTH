package com.kevin.lunaraspa.core.exception;

import com.kevin.lunaraspa.core.exception.BaseErrorCode;
import org.springframework.http.HttpStatus;

public enum AuthErrorCode implements BaseErrorCode {
    ACCOUNT_NOT_FOUND("AUTH_001", "Account not found", HttpStatus.NOT_FOUND),
    UNAUTHORIZED("AUTH_002", "Unauthorized access", HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN("AUTH_003", "Invalid JWT token", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED("AUTH_004", "JWT token has expired", HttpStatus.UNAUTHORIZED),
    ROLE_NOT_FOUND("AUTH_005", "Required role not found", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_CREDENTIALS("AUTH_006", "Invalid login credentials", HttpStatus.UNAUTHORIZED);

    private final String code;
    private final String message;
    private final HttpStatus status;

    AuthErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

    @Override
    public String getCode() {
        return code;
    }

    @Override
    public String getMessage() {
        return message;
    }

    @Override
    public HttpStatus getStatus() {
        return status;
    }
}
