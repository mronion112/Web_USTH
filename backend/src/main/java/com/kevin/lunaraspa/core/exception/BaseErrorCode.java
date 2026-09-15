package com.kevin.lunaraspa.core.exception;

import org.springframework.http.HttpStatus;

public interface BaseErrorCode {
    String getCode();
    String getMessage();
    HttpStatus getStatus();

    default HttpStatus getHttpStatus() {
        return getStatus();
    }
}
