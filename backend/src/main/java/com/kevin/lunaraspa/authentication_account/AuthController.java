package com.kevin.lunaraspa.authentication_account;

import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.authentication_account.service.AuthService;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Đăng nhập, refresh token, logout và thông tin tài khoản hiện tại")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin người dùng hiện tại",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Object> getMe() {
        return ResponseBuilder.ok(authService.getMe());
    }

    @PostMapping({"/refresh", "/refresh-token"})
    @Operation(summary = "Cấp access token mới từ refresh token")
    public ResponseEntity<Object> refreshToken(@RequestBody Map<String, String> request) {
        return ResponseBuilder.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất và vô hiệu hóa token")
    public ResponseEntity<Object> logout(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                         @RequestBody(required = false) Map<String, String> request) {
        authService.logout(authHeader, request);
        return ResponseBuilder.ok(Map.of("message", "Logged out successfully"));
    }

    /** CSRF protection is disabled for this stateless JWT API; this is a frontend-compatible no-op. */
    @GetMapping("/csrf")
    @Operation(summary = "Khởi tạo CSRF cho frontend", description = "No-op khi CSRF protection đang tắt.")
    public ResponseEntity<Void> csrf() {
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/exchange")
    @Operation(summary = "Đổi thông tin xác thực OAuth2 thành token ứng dụng")
    public ResponseEntity<Object> exchangeToken(@RequestBody Map<String, String> request) {
        return ResponseBuilder.ok(authService.exchangeToken(request));
    }
}
