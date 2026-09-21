package com.kevin.lunaraspa.authentication_account;

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
        
        // Authentication Account
        routes.add(new RoutePermission(HttpMethod.GET, "/api/manager/accounts", "ADMIN_ACCOUNTS_VIEW"));

        // Booking operations used by the manager/reception desk.
        routes.add(new RoutePermission(HttpMethod.GET, "/api/manager/bookings", "BOOKINGS_VIEW"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/manager/bookings", "BOOKINGS_CREATE"));
        routes.add(new RoutePermission(HttpMethod.PATCH, "/api/manager/bookings/*/assign", "BOOKINGS_ASSIGN"));
        routes.add(new RoutePermission(HttpMethod.PATCH, "/api/manager/bookings/*/check-in", "BOOKINGS_CHECKIN"));
        routes.add(new RoutePermission(HttpMethod.PATCH, "/api/manager/bookings/*/reschedule", "BOOKINGS_EDIT"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/manager/bookings/*/email/resend", "BOOKINGS_EDIT"));
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
