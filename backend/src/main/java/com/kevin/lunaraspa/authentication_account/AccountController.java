package com.kevin.lunaraspa.authentication_account;

import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.authentication_account.service.AuthService;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/accounts")
@Tag(name = "Accounts", description = "Quản lý tài khoản dành cho manager")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class AccountController {

    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả tài khoản")
    public ResponseEntity<Object> getAllAccounts() {
        return ResponseBuilder.ok(authService.getAllAccounts());
    }
}
