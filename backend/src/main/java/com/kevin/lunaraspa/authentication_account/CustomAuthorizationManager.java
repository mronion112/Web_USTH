package com.kevin.lunaraspa.authentication_account;
import com.kevin.lunaraspa.authentication_account.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.Optional;
import java.util.function.Supplier;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private final ApiPermissionRegistry apiPermissionRegistry;
    private final RolePermissionService rolePermissionService;

    @Override
    public AuthorizationDecision authorize(Supplier<? extends Authentication> authentication, RequestAuthorizationContext context) {
        boolean allowed = false;
        try {
            allowed = decide(authentication, context);
        } catch (Exception ex) {
            log.error("Authorization error during URI access check: {}", ex.getMessage(), ex);
            allowed = false;
        }
        return new AuthorizationDecision(allowed);
    }

    private boolean decide(Supplier<? extends Authentication> authentication, RequestAuthorizationContext context) {
        Authentication auth = authentication.get();
        if (auth == null || !auth.isAuthenticated()) {
            log.trace("Authorization skipped: authentication is null or unauthenticated.");
            return false;
        }

        String rawUri = context.getRequest().getRequestURI();
        // Normalize URI to prevent path traversal attacks (e.g., /api/my/../manager/accounts)
        String requestUri = URI.create(rawUri).normalize().getPath();
        
        HttpMethod method = HttpMethod.valueOf(context.getRequest().getMethod());
        
        log.trace("Checking access for principal={} on URI={} (Normalized: {})", auth.getName(), rawUri, requestUri);

        // 1. Find which permission is required for this API endpoint
        Optional<String> requiredPermissionOpt = apiPermissionRegistry.getRequiredPermission(method, requestUri);

        // For strict security (fail-closed), we block unmapped routes unless they are public.
        if (requiredPermissionOpt.isEmpty()) {
            log.warn("URI {} {} is not mapped to any permission in registry. Denying access.", method, requestUri);
            return false;
        }

        String requiredPermission = requiredPermissionOpt.get();

        if ("AUTHENTICATED".equals(requiredPermission)) {
            log.trace("URI {} {} only requires AUTHENTICATED. Granted.", method, requestUri);
            return true;
        }

        // 2. Check if the user's role has this permission
        if (auth.getPrincipal() instanceof CustomUserDetails customUser) {
            String role = customUser.getRole();
            if (!StringUtils.hasText(role)) {
                log.trace("Authorization failed: could not resolve role for principal={}", auth.getName());
                return false;
            }

            boolean hasAccess = rolePermissionService.hasPermission(role, requiredPermission);
            
            if (!hasAccess) {
                log.warn("Access Denied: User {} (Role: {}) missing permission {} for URI {}", 
                        customUser.getEmail(), role, requiredPermission, requestUri);
            } else {
                log.trace("Authorization decision from rolePermissionService: user={} role={} uri={} allowed=true", 
                        customUser.getEmail(), role, requestUri);
            }
            return hasAccess;
        }

        log.warn("Principal is not CustomUserDetails. Denying access.");
        return false;
    }
}
