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
        // --- CUSTOMER & PUBLIC (AUTHENTICATED ONLY) ---
        // Endpoints that do not require specific RBAC permissions, just a valid login token
        routes.add(new RoutePermission(HttpMethod.GET, "/api/profile/me", "AUTHENTICATED"));
        routes.add(new RoutePermission(HttpMethod.PUT, "/api/profile/me", "AUTHENTICATED"));
        routes.add(new RoutePermission(HttpMethod.GET, "/api/services", "AUTHENTICATED"));
        routes.add(new RoutePermission(HttpMethod.GET, "/api/services/**", "AUTHENTICATED"));
        routes.add(new RoutePermission(HttpMethod.GET, "/api/staff", "AUTHENTICATED"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/availability", "AUTHENTICATED"));
        routes.add(new RoutePermission(HttpMethod.GET, "/api/bookings/my", "AUTHENTICATED"));
        routes.add(new RoutePermission(HttpMethod.GET, "/api/bookings/*", "AUTHENTICATED"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/bookings", "AUTHENTICATED"));

        // --- ADMINISTRATION ---
        routes.add(new RoutePermission(HttpMethod.GET, "/api/manager/accounts", "ADMIN_ACCOUNTS_VIEW"));
        
        // --- SERVICES (ADMIN) ---
        routes.add(new RoutePermission(HttpMethod.POST, "/api/manager/services", "ADMIN_SERVICES"));
        routes.add(new RoutePermission(HttpMethod.PUT, "/api/manager/services/**", "ADMIN_SERVICES"));
        routes.add(new RoutePermission(HttpMethod.DELETE, "/api/manager/services/**", "ADMIN_SERVICES"));

        // --- BOOKINGS (ADMIN/STAFF) ---
        routes.add(new RoutePermission(HttpMethod.GET, "/api/manager/bookings", "BOOKINGS_VIEW"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/manager/bookings", "BOOKINGS_CREATE"));
        routes.add(new RoutePermission(HttpMethod.PATCH, "/api/manager/bookings/*/assign", "BOOKINGS_ASSIGN"));
        routes.add(new RoutePermission(HttpMethod.PATCH, "/api/manager/bookings/*/check-in", "BOOKINGS_CHECKIN"));
        routes.add(new RoutePermission(HttpMethod.PATCH, "/api/manager/bookings/*/reschedule", "BOOKINGS_EDIT"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/manager/bookings/*/email/resend", "BOOKINGS_EDIT"));

        // --- CUSTOMERS ---
        routes.add(new RoutePermission(HttpMethod.GET, "/api/manager/customers", "CUSTOMERS_VIEW"));
        routes.add(new RoutePermission(HttpMethod.PUT, "/api/manager/customers/*/notes", "CUSTOMERS_EDIT"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/manager/customers", "CUSTOMERS_EDIT"));

        // --- PAYMENTS ---
        routes.add(new RoutePermission(HttpMethod.GET, "/api/payments", "PAYMENTS_VIEW"));
        routes.add(new RoutePermission(HttpMethod.GET, "/api/payments/booking/*", "PAYMENTS_VIEW"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/payments", "PAYMENTS_PROCESS"));
        routes.add(new RoutePermission(HttpMethod.PATCH, "/api/payments/*/paid", "PAYMENTS_PROCESS"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/payments/*/refund", "PAYMENTS_REFUND"));
        
        // --- SEPAY ---
        routes.add(new RoutePermission(HttpMethod.GET, "/api/payments/sepay/transactions", "PAYMENTS_VIEW"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/payments/sepay/transactions/*/reconcile", "PAYMENTS_PROCESS"));

        // --- DASHBOARD & REPORTS ---
        routes.add(new RoutePermission(HttpMethod.GET, "/api/manager/dashboard", "REPORTS_VIEW"));
        routes.add(new RoutePermission(HttpMethod.GET, "/api/reports/summary", "REPORTS_VIEW"));

        // --- STAFF SCHEDULE ---
        routes.add(new RoutePermission(HttpMethod.GET, "/api/manager/staff/*/schedule", "ADMIN_STAFF_SCHEDULE"));
        routes.add(new RoutePermission(HttpMethod.PUT, "/api/manager/staff/*/working-hours", "ADMIN_STAFF_SCHEDULE"));
        routes.add(new RoutePermission(HttpMethod.POST, "/api/manager/staff/*/time-off", "ADMIN_STAFF_SCHEDULE"));
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
