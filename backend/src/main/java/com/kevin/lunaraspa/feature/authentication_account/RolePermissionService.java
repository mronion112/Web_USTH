package com.kevin.lunaraspa.feature.authentication_account;

import com.kevin.lunaraspa.entity.Permission;
import com.kevin.lunaraspa.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RolePermissionService {

    private final RoleRepository roleRepository;

    /**
     * Checks if a role has the required permission code.
     * Uses Spring Cache to avoid hitting the DB on every request.
     * (Assuming Spring Cache is enabled with Redis or simple in-memory cache).
     */
    @Transactional(readOnly = true)
    // @Cacheable(value = "role_permissions", key = "#roleCode") // Uncomment when Redis cache is fully set up
    public boolean hasPermission(String roleCode, String permissionCode) {
        if (roleCode == null || permissionCode == null) return false;
        
        Set<String> assignedPermissions = roleRepository.findByCodeIgnoreCase(roleCode)
                .map(role -> role.getPermissions().stream()
                        .map(Permission::getCode)
                        .collect(Collectors.toSet()))
                .orElse(Collections.emptySet());

        boolean hasAccess = assignedPermissions.contains(permissionCode);
        log.debug("Role '{}' requesting '{}' -> Granted: {}", roleCode, permissionCode, hasAccess);
        
        return hasAccess;
    }
}
