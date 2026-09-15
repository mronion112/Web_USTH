package com.kevin.lunaraspa.core.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
    private final BaseErrorCode errorCode;

    public AppException(BaseErrorCode errorCode) {
        super(errorCode != null ? errorCode.getMessage() : null);
        this.errorCode = errorCode;
    }

    public AppException(BaseErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public AppException(BaseErrorCode errorCode, Throwable cause) {
        super(errorCode != null ? errorCode.getMessage() : null, cause);
        this.errorCode = errorCode;
    }

    public AppException(BaseErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
}
