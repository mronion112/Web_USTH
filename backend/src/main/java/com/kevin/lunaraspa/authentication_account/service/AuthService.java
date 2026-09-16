package com.kevin.lunaraspa.authentication_account.service;

import com.kevin.lunaraspa.authentication_account.dto.AccountResponseDTO;

import java.util.Map;

public interface AuthService {
    AccountResponseDTO getMe();
    Map<String, String> refreshToken(Map<String, String> request);
    void logout(String authHeader, Map<String, String> request);
}
