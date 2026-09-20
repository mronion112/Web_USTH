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
    private final com.kevin.lunaraspa.authentication_account.repository.AccountRepository accountRepository;
    private final com.kevin.lunaraspa.authentication_account.repository.RoleRepository roleRepository;

    @GetMapping
    public ResponseEntity<Object> getAllAccounts() {
        return ResponseBuilder.ok(authService.getAllAccounts());
    }

    @PatchMapping("/{id}/toggle-active")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Object> toggleActive(@PathVariable Long id) {
        var account = accountRepository.findById(id)
                .orElseThrow(() -> new com.kevin.lunaraspa.core.exception.AppException(com.kevin.lunaraspa.core.exception.SystemErrorCode.NOT_FOUND, "Account not found"));
        account.setIsActive(!Boolean.TRUE.equals(account.getIsActive()));
        accountRepository.saveAndFlush(account);
        return ResponseBuilder.ok(java.util.Map.of("id", account.getId(), "isActive", account.getIsActive()), "Toggled account status successfully");
    }

    @PatchMapping("/{id}/role")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Object> updateRole(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        var account = accountRepository.findById(id)
                .orElseThrow(() -> new com.kevin.lunaraspa.core.exception.AppException(com.kevin.lunaraspa.core.exception.SystemErrorCode.NOT_FOUND, "Account not found"));
        String roleCode = body.get("role");
        if (roleCode == null || roleCode.isBlank()) {
            throw new com.kevin.lunaraspa.core.exception.AppException(com.kevin.lunaraspa.core.exception.SystemErrorCode.INVALID_REQUEST, "Role is required");
        }
        var role = roleRepository.findByCodeIgnoreCase(roleCode.trim())
                .orElseThrow(() -> new com.kevin.lunaraspa.core.exception.AppException(com.kevin.lunaraspa.core.exception.SystemErrorCode.NOT_FOUND, "Role not found"));
        String currentRole = account.getRole().getCode().replace("ROLE_", "");
        String targetRole = role.getCode().replace("ROLE_", "");
        if ("THERAPIST".equalsIgnoreCase(currentRole) || "THERAPIST".equalsIgnoreCase(targetRole)) {
            throw new com.kevin.lunaraspa.core.exception.AppException(com.kevin.lunaraspa.core.exception.SystemErrorCode.INVALID_REQUEST,
                    "Use staff onboarding to create therapists; therapist roles cannot be changed here");
        }
        account.setRole(role);
        accountRepository.saveAndFlush(account);
        return ResponseBuilder.ok(java.util.Map.of("id", account.getId(), "role", role.getCode()), "Updated role successfully");
    }

    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Object> createAccount(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        String name = body.get("name");
        String roleCode = body.get("role");
        if (email == null || email.isBlank() || name == null || name.isBlank()) {
            throw new com.kevin.lunaraspa.core.exception.AppException(com.kevin.lunaraspa.core.exception.SystemErrorCode.INVALID_REQUEST, "Email and name are required");
        }
        if (accountRepository.findByEmail(email.trim()).isPresent()) {
            throw new com.kevin.lunaraspa.core.exception.AppException(com.kevin.lunaraspa.core.exception.SystemErrorCode.INVALID_REQUEST, "Email already exists");
        }
        var role = roleRepository.findByCodeIgnoreCase((roleCode != null && !roleCode.isBlank()) ? roleCode.trim() : "RECEPTIONIST")
                .orElseThrow(() -> new com.kevin.lunaraspa.core.exception.AppException(com.kevin.lunaraspa.core.exception.SystemErrorCode.NOT_FOUND, "Role not found"));
        if ("THERAPIST".equalsIgnoreCase(role.getCode().replace("ROLE_", ""))) {
            throw new com.kevin.lunaraspa.core.exception.AppException(com.kevin.lunaraspa.core.exception.SystemErrorCode.INVALID_REQUEST,
                    "Use staff onboarding to create therapists");
        }
        var account = com.kevin.lunaraspa.authentication_account.entity.Account.builder()
                .displayName(name.trim())
                .email(email.trim())
                .role(role)
                .avatarUrl("https://ui-avatars.com/api/?name=" + name.trim().replace(" ", "+"))
                .isActive(true)
                .build();
        accountRepository.saveAndFlush(account);
        return ResponseBuilder.ok(java.util.Map.of(
                "id", account.getId(),
                "displayName", account.getDisplayName(),
                "email", account.getEmail(),
                "role", account.getRole().getCode(),
                "isActive", account.getIsActive()
        ), org.springframework.http.HttpStatus.CREATED, "Account created successfully");
    }
}
