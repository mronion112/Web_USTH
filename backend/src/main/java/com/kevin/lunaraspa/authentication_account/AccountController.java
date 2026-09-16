package com.kevin.lunaraspa.authentication_account;

import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.authentication_account.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AuthService authService;

    @GetMapping
    public ResponseEntity<Object> getAllAccounts() {
        return ResponseBuilder.ok(authService.getAllAccounts());
    }
}

