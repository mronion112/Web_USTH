package com.kevin.lunaraspa.spa_service.security;

import com.kevin.lunaraspa.authentication_account.RolePermissionService;
import com.kevin.lunaraspa.authentication_account.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class SpaServicePermissionAuthorizationManager
        implements AuthorizationManager<RequestAuthorizationContext> {

    private static final String MANAGE_SERVICES_PERMISSION = "ADMIN_SERVICES";

    private final RolePermissionService rolePermissionService;

    @Override
    public AuthorizationDecision authorize(
            Supplier<? extends Authentication> authentication,
            RequestAuthorizationContext context
    ) {
        Authentication currentAuthentication = authentication.get();
        if (currentAuthentication == null
                || !currentAuthentication.isAuthenticated()
                || !(currentAuthentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return new AuthorizationDecision(false);
        }

        return new AuthorizationDecision(rolePermissionService.hasPermission(
                userDetails.getRole(),
                MANAGE_SERVICES_PERMISSION
        ));
    }
}
