package com.kevin.lunaraspa.service;

import com.kevin.lunaraspa.dto.auth.AccountResponseDTO;

import java.util.Map;

public interface AuthService {
    AccountResponseDTO getMe();
    Map<String, String> refreshToken(Map<String, String> request);
    void logout(String authHeader, Map<String, String> request);
}
