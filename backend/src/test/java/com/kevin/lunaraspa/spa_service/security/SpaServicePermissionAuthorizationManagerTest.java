package com.kevin.lunaraspa.spa_service.security;

import com.kevin.lunaraspa.authentication_account.RolePermissionService;
import com.kevin.lunaraspa.authentication_account.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpaServicePermissionAuthorizationManagerTest {

    @Mock
    private RolePermissionService rolePermissionService;

    private SpaServicePermissionAuthorizationManager authorizationManager;
    private RequestAuthorizationContext context;

    @BeforeEach
    void setUp() {
        authorizationManager = new SpaServicePermissionAuthorizationManager(rolePermissionService);
        context = new RequestAuthorizationContext(new MockHttpServletRequest());
    }

    @Test
    void grantsAccessWhenRoleHasServiceManagementPermission() {
        Authentication authentication = authenticatedUser("MANAGER");
        when(rolePermissionService.hasPermission("MANAGER", "ADMIN_SERVICES")).thenReturn(true);

        AuthorizationDecision decision = authorizationManager.authorize(() -> authentication, context);

        assertTrue(decision.isGranted());
        verify(rolePermissionService).hasPermission("MANAGER", "ADMIN_SERVICES");
    }

    @Test
    void deniesAccessWhenRoleDoesNotHavePermission() {
        Authentication authentication = authenticatedUser("TECHNICIAN");
        when(rolePermissionService.hasPermission("TECHNICIAN", "ADMIN_SERVICES")).thenReturn(false);

        AuthorizationDecision decision = authorizationManager.authorize(() -> authentication, context);

        assertFalse(decision.isGranted());
    }

    @Test
    void deniesAnonymousAccess() {
        AuthorizationDecision decision = authorizationManager.authorize(() -> null, context);

        assertFalse(decision.isGranted());
    }

    private Authentication authenticatedUser(String role) {
        CustomUserDetails principal = CustomUserDetails.builder()
                .email("manager@example.com")
                .role(role)
                .authorities(List.of())
                .build();
        return new UsernamePasswordAuthenticationToken(principal, null, List.of());
    }
}
