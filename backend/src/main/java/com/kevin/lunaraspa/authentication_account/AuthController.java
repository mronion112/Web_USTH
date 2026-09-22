package com.kevin.lunaraspa.authentication_account;

import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.authentication_account.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public ResponseEntity<Object> logout(HttpServletRequest request,
                                         HttpServletResponse response,
                                         @RequestHeader(value = "Authorization", required = false) String authHeader,
                                         @RequestBody(required = false) Map<String, String> requestBody) {
        authService.logout(authHeader, requestBody);

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();

        Cookie accessCookie = new Cookie("lunara_access_token", "");
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("lunara_refresh_token", "");
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);

        Cookie sessionCookie = new Cookie("JSESSIONID", "");
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(0);
        response.addCookie(sessionCookie);

        return ResponseBuilder.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/exchange")
    public ResponseEntity<Object> exchangeToken(@RequestBody Map<String, String> request) {
        return ResponseBuilder.ok(authService.exchangeToken(request));
    }

}
