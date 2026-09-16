package com.kevin.lunaraspa.authentication_account;

import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.authentication_account.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<Object> getMe() {
        return ResponseBuilder.ok(authService.getMe());
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<Object> refreshToken(@RequestBody Map<String, String> request) {
        return ResponseBuilder.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Object> logout(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                         @RequestBody(required = false) Map<String, String> request) {
        authService.logout(authHeader, request);
        return ResponseBuilder.ok(Map.of("message", "Logged out successfully"));
    }
}
