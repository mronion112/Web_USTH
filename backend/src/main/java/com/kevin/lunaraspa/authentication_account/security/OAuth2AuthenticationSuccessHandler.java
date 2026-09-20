package com.kevin.lunaraspa.authentication_account.security;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;
    private final AccountRepository accountRepository;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.security.authentication.AuthenticationServiceException("Account not found"));

        String role = account.getRole().getCode();

        String accessToken = jwtUtils.generateAccessToken(email, role);
        String refreshToken = jwtUtils.generateRefreshToken(email, role);

        // Chuẩn Doanh nghiệp: Sinh một Authorization Code ngắn hạn
        String authCode = UUID.randomUUID().toString();
        
        // Lưu tạm Access Token & Refresh Token vào Redis trong vòng 60 giây
        String redisKeyAccess = "oauth2:authCode:" + authCode + ":access";
        String redisKeyRefresh = "oauth2:authCode:" + authCode + ":refresh";
        
        redisTemplate.opsForValue().set(redisKeyAccess, accessToken, 60, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKeyRefresh, refreshToken, 60, TimeUnit.SECONDS);

        // Set cookies on response so the browser immediately retains session
        Cookie accessCookie = new Cookie("lunara_access_token", accessToken);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(7 * 24 * 60 * 60);
        accessCookie.setHttpOnly(false);
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("lunara_refresh_token", refreshToken);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(30 * 24 * 60 * 60);
        refreshCookie.setHttpOnly(false);
        response.addCookie(refreshCookie);

        // Chỉ trả về đúng cái mã code vô thưởng vô phạt trên URL
        response.sendRedirect(frontendUrl + "/oauth2/redirect?code=" + authCode);
    }
}
