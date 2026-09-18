package com.kevin.lunaraspa.core.http;

import com.kevin.lunaraspa.chatbot.ChatbotException;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.BaseErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.stream.Collectors;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ChatbotException.class)
    public ResponseEntity<ApiResponse<Object>> handleChatbotException(ChatbotException ex) {
        log.error("Chatbot exception: {}", ex.getMessage(), ex);
        ApiResponse<Object> response = ApiResponse.<Object>builder()
                .success(false)
                .status(HttpStatus.BAD_GATEWAY.value())
                .message(ex.getMessage())
                .error("CHATBOT_ERROR")
                .build();
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(response);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<Object> handleAppException(AppException ex) {
        BaseErrorCode errorCode = ex.getErrorCode();
        HttpStatus status = (errorCode != null && errorCode.getStatus() != null)
                ? errorCode.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        String message = (errorCode != null && errorCode.getMessage() != null)
                ? errorCode.getMessage()
                : ex.getMessage();
        String code = errorCode != null ? errorCode.getCode() : "INTERNAL_ERROR";

        log.error("App exception: code={}, message={}", code, message, ex);

        return ResponseBuilder.error(status, message, code);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  @NonNull HttpHeaders headers,
                                                                  @NonNull HttpStatusCode status,
                                                                  @NonNull WebRequest request) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing
                ));

        return ResponseBuilder.error(HttpStatus.BAD_REQUEST, "Validation Failed", errors);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("Illegal argument: ", ex);
        return ResponseBuilder.error(HttpStatus.BAD_REQUEST, ex.getMessage(), "BAD_REQUEST");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex) {
        log.error("Unhandled exception: ", ex);
        return ResponseBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", ex.getMessage());
    }
}
