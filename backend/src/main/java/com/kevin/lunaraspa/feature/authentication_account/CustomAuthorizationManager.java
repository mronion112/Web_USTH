package com.kevin.lunaraspa.feature.authentication_account;
import com.kevin.lunaraspa.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;

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
        Authentication auth = authentication.get();
        if (auth == null || !auth.isAuthenticated()) {
            return new AuthorizationDecision(false);
        }

        String requestUri = context.getRequest().getRequestURI();
        HttpMethod method = HttpMethod.valueOf(context.getRequest().getMethod());

        // 1. Find which permission is required for this API endpoint
        Optional<String> requiredPermissionOpt = apiPermissionRegistry.getRequiredPermission(method, requestUri);

        // If the endpoint doesn't require any specific permission, we can either allow it or block it by default.
        // For strict security (fail-closed), we block unmapped routes unless they are public.
        // Assuming public routes are already ignored by SecurityConfig requestMatchers.
        if (requiredPermissionOpt.isEmpty()) {
            log.warn("URI {} {} is not mapped to any permission in registry. Denying access.", method, requestUri);
            return new AuthorizationDecision(false); 
            // In a real app, you might want to return true for unmapped routes, but false is safer.
        }

        String requiredPermission = requiredPermissionOpt.get();

        // 2. Check if the user's role has this permission
        if (auth.getPrincipal() instanceof CustomUserDetails customUser) {
            String role = customUser.getRole();
            boolean hasAccess = rolePermissionService.hasPermission(role, requiredPermission);
            
            if (!hasAccess) {
                log.warn("Access Denied: User {} (Role: {}) missing permission {} for URI {}", 
                        customUser.getEmail(), role, requiredPermission, requestUri);
            }
            return new AuthorizationDecision(hasAccess);
        }

        log.warn("Principal is not CustomUserDetails. Denying access.");
        return new AuthorizationDecision(false);
    }
}
