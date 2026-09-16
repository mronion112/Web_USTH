package com.kevin.lunaraspa.authentication_account.service.impl;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.AuthErrorCode;
import com.kevin.lunaraspa.authentication_account.dto.AccountResponseDTO;
import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.JwtBlacklistService;
import com.kevin.lunaraspa.authentication_account.security.JwtUtils;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.authentication_account.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final JwtUtils jwtUtils;
    private final JwtBlacklistService jwtBlacklistService;
    private final AccountRepository accountRepository;

    @Override
    public AccountResponseDTO getMe() {
        String email = SecurityUtils.getCurrentUserEmail();

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AuthErrorCode.ACCOUNT_NOT_FOUND));

        return AccountResponseDTO.builder()
                .id(account.getId())
                .email(account.getEmail())
                .displayName(account.getDisplayName())
                .avatarUrl(account.getAvatarUrl())
                .role(account.getRole().getCode())
                .isActive(account.getIsActive())
                .build();
    }

    @Override
    public List<AccountResponseDTO> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(account -> AccountResponseDTO.builder()
                        .id(account.getId())
                        .email(account.getEmail())
                        .displayName(account.getDisplayName())
                        .avatarUrl(account.getAvatarUrl())
                        .role(account.getRole().getCode())
                        .isActive(account.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, String> refreshToken(Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || jwtBlacklistService.isBlacklisted(refreshToken)) {
            throw new AppException(AuthErrorCode.INVALID_TOKEN);
        }

        if (jwtUtils.isTokenExpired(refreshToken)) {
            throw new AppException(AuthErrorCode.TOKEN_EXPIRED);
        }
        
        String email = jwtUtils.extractEmail(refreshToken);
        String role = jwtUtils.extractRole(refreshToken);
        String newAccessToken = jwtUtils.generateAccessToken(email, role);
        return Map.of("accessToken", newAccessToken);
    }

    @Override
    public void logout(String authHeader, Map<String, String> request) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String accessToken = authHeader.substring(7);
            jwtBlacklistService.blacklistToken(accessToken);
        }

        if (request != null && request.containsKey("refreshToken")) {
            String refreshToken = request.get("refreshToken");
            jwtBlacklistService.blacklistToken(refreshToken);
        }
    }
}
