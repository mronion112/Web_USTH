package com.kevin.lunaraspa.core.http;

import com.kevin.lunaraspa.core.constant.ResponseMessage;
import com.kevin.lunaraspa.core.http.ApiResponse;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ResponseBuilder {
    
    public static ResponseEntity<Object> okMessage(String message) {
        return ok(null, message);
    }
    
    public static ResponseEntity<Object> ok() {
        return ok(null);
    }
    
    public static <T> ResponseEntity<Object> ok(T data) {
        return ok(data, ResponseMessage.SUCCESS);
    }
    
    public static <T> ResponseEntity<Object> ok(T data, String message) {
        return ok(data, HttpStatus.OK, message);
    }
    
    public static <T> ResponseEntity<Object> ok(T data, HttpStatus status, String message) {
        return buildResponseEntityOk(data, status, message);
    }
    
    public static ResponseEntity<Object> badRequestMessage(String message) {
        return badRequest(null, message);
    }
    
    public static ResponseEntity<Object> badRequest() {
        return badRequest(null);
    }
    
    public static <T> ResponseEntity<Object> badRequest(T data) {
        return badRequest(data, ResponseMessage.BAD_REQUEST);
    }
    
    public static <T> ResponseEntity<Object> badRequest(T data, String message) {
        return buildResponseEntity(data, HttpStatus.BAD_REQUEST, message);
    }
    
    public static ResponseEntity<Object> noContent() {
        return ResponseEntity.noContent().build();
    }
    
    public static ResponseEntity<Object> notFound() {
        return notFound(null);
    }
    
    public static <T> ResponseEntity<Object> notFound(T data) {
        return notFound(data, ResponseMessage.NOT_FOUND);
    }
    
    public static <T> ResponseEntity<Object> notFound(T data, String message) {
        return buildResponseEntity(data, HttpStatus.NOT_FOUND, message);
    }
    
    public static ResponseEntity<Object> error(Throwable throwable) {
        String message = throwable != null ? throwable.getMessage() : ResponseMessage.ERROR;
        return create(null, HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
    
    public static ResponseEntity<Object> error(HttpStatus status, String message, Object error) {
        return ResponseEntity.status(status)
                .body(buildErrorResponse(status, message, error));
    }
    
    public static ApiResponse<Object> buildErrorResponse(HttpStatus status, String message, Object error) {
        return ApiResponse.builder()
                .status(status.value())
                .message(message)
                .error(error)
                .build();
    }
    
    public static <T> ResponseEntity<Object> create(T data, HttpStatus status, String message) {
        return buildResponseEntity(data, status, message);
    }
    
    
    private static <T> ResponseEntity<Object> buildResponseEntity(T data, HttpStatus status, String message) {
        return ResponseEntity.status(status).body(buildApiResponse(data, status, message));
    }
    
    private static <T> ResponseEntity<Object> buildResponseEntityOk(T data, HttpStatus status, String message) {
        return ResponseEntity.ok().body(buildApiResponse(data, status, message));
    }
    
    private static <T> ApiResponse<T> buildApiResponse(T data, HttpStatus status, String message) {
        return ApiResponse.<T>builder()
                .status(status.value())
                .message(message)
                .data(data)
                .build();
    }
    
}
