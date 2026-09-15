package com.kevin.lunaraspa.feature.authentication_account;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class ApiPermissionRegistry {

    private final AntPathMatcher pathMatcher = new AntPathMatcher();
    private final List<RoutePermission> routes = new ArrayList<>();

    public ApiPermissionRegistry() {
        // Register API routes to Permission Codes here
        // Example:
        // routes.add(new RoutePermission(HttpMethod.POST, "/api/v1/spa-services", "CREATE_SERVICE"));
        // routes.add(new RoutePermission(HttpMethod.PUT, "/api/v1/spa-services/**", "UPDATE_SERVICE"));
        // routes.add(new RoutePermission(HttpMethod.DELETE, "/api/v1/spa-services/**", "DELETE_SERVICE"));
        
        // Let's add a dummy one for testing
        routes.add(new RoutePermission(HttpMethod.GET, "/api/v1/dummy-secure-endpoint", "DUMMY_VIEW"));
    }

    public Optional<String> getRequiredPermission(HttpMethod method, String uri) {
        return routes.stream()
                .filter(route -> (route.method == null || route.method.equals(method))
                        && pathMatcher.match(route.pattern, uri))
                .map(route -> route.permissionCode)
                .findFirst();
    }

    private record RoutePermission(HttpMethod method, String pattern, String permissionCode) {}
}
