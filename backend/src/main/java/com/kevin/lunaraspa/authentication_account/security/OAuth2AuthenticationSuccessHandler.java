package com.kevin.lunaraspa.authentication_account.security;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;
    private final AccountRepository accountRepository;

    @org.springframework.beans.factory.annotation.Value("${FRONTEND_URL:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.security.authentication.AuthenticationServiceException("Account not found"));

        String role = account.getRole().getCode();

        String accessToken = jwtUtils.generateAccessToken(email, role);
        String refreshToken = jwtUtils.generateRefreshToken(email, role);

        String redirectUrl = String.format("%s/oauth2/redirect?token=%s&refreshToken=%s", 
                frontendUrl,
                URLEncoder.encode(accessToken, StandardCharsets.UTF_8), 
                URLEncoder.encode(refreshToken, StandardCharsets.UTF_8));

        response.sendRedirect(redirectUrl);
    }
}
