package com.kevin.lunaraspa.security;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.AuthErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Optional;

public class SecurityUtils {

    private SecurityUtils() {}

    public static String getCurrentUserEmail() {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getPrincipal)
                .filter(principal -> !"anonymousUser".equals(principal))
                .map(principal -> {
                    if (principal instanceof OAuth2User oAuth2User) {
                        return oAuth2User.getAttribute("email");
                    } else if (principal instanceof CustomUserDetails customUser) {
                        return customUser.getEmail();
                    }
                    return null;
                })
                .map(Object::toString)
                .orElseThrow(() -> new AppException(AuthErrorCode.UNAUTHORIZED));
    }
}
