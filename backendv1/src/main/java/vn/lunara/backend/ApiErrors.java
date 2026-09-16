package vn.lunara.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;

@RestControllerAdvice class ApiErrors {
    @ExceptionHandler(ResponseStatusException.class) ResponseEntity<Map<String,Object>> status(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(body(ex.getStatusCode().value(),ex.getReason()==null?"Request rejected":ex.getReason()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<Map<String,Object>> validation(MethodArgumentNotValidException ex) {
        String message=ex.getBindingResult().getFieldErrors().stream().findFirst().map(e -> e.getField()+": "+e.getDefaultMessage()).orElse("Invalid request");
        return ResponseEntity.badRequest().body(body(400,message));
    }
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class) ResponseEntity<Map<String,Object>> denied(Exception ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body(403,"Forbidden"));
    }
    private Map<String,Object> body(int status,String message) { return Map.of("status",status,"message",message,"timestamp",Instant.now().toString()); }
}
