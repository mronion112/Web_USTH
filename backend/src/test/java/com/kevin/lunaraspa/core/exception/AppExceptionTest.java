package com.kevin.lunaraspa.core.exception;

import com.kevin.lunaraspa.core.http.ApiResponse;
import com.kevin.lunaraspa.core.http.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class AppExceptionTest {

    private enum SampleErrorCode implements BaseErrorCode {
        RESOURCE_NOT_FOUND("RES_404", "Resource not found", HttpStatus.NOT_FOUND),
        BAD_REQUEST("REQ_400", "Invalid request parameter", HttpStatus.BAD_REQUEST);

        private final String code;
        private final String message;
        private final HttpStatus status;

        SampleErrorCode(String code, String message, HttpStatus status) {
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

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void testBaseErrorCodeInterface() {
        BaseErrorCode errorCode = SampleErrorCode.RESOURCE_NOT_FOUND;
        assertEquals("RES_404", errorCode.getCode());
        assertEquals("Resource not found", errorCode.getMessage());
        assertEquals(HttpStatus.NOT_FOUND, errorCode.getStatus());
        assertEquals(HttpStatus.NOT_FOUND, errorCode.getHttpStatus());
    }

    @Test
    void testAppExceptionWithErrorCode() {
        AppException ex = new AppException(SampleErrorCode.BAD_REQUEST);
        assertEquals(SampleErrorCode.BAD_REQUEST, ex.getErrorCode());
        assertEquals("Invalid request parameter", ex.getMessage());
    }

    @Test
    void testAppExceptionWithCustomMessageAndCause() {
        Throwable cause = new RuntimeException("Underlying root cause");
        AppException ex = new AppException(SampleErrorCode.RESOURCE_NOT_FOUND, "Custom not found message", cause);
        assertEquals(SampleErrorCode.RESOURCE_NOT_FOUND, ex.getErrorCode());
        assertEquals("Custom not found message", ex.getMessage());
        assertEquals(cause, ex.getCause());
    }

    @Test
    void testGlobalExceptionHandlerTranslatesAppException() {
        AppException ex = new AppException(SampleErrorCode.RESOURCE_NOT_FOUND);
        ResponseEntity<Object> responseEntity = exceptionHandler.handleAppException(ex);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.NOT_FOUND, responseEntity.getStatusCode());

        ApiResponse<Object> body = (ApiResponse<Object>) responseEntity.getBody();
        assertNotNull(body);
        assertEquals(Boolean.FALSE, body.getSuccess());
        assertEquals(404, body.getStatus());
        assertEquals("Resource not found", body.getMessage());
        assertEquals("RES_404", body.getError());
    }
}
