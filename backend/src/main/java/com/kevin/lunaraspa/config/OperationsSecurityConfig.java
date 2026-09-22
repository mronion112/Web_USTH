package com.kevin.lunaraspa.config;

import com.kevin.lunaraspa.authentication_account.security.JwtAuthenticationFilter;
import com.kevin.lunaraspa.authentication_account.security.SecurityErrorWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class OperationsSecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    @Order(4)
    SecurityFilterChain operationsSecurityFilterChain(HttpSecurity http) throws Exception {
        String[] paths = {"/api/services/**", "/api/staff", "/api/manager/services/**", "/api/manager/staff/**",
                "/api/staff/tasks/**", "/api/payments/**", "/api/manager/dashboard/**", "/api/manager/customers/**",
                "/api/manager/notifications/**", "/api/manager/accounts/**", "/api/attendance/**", "/api/reports/**"};
        return http.securityMatcher(paths).csrf(AbstractHttpConfigurer::disable).cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, paths).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/services/**", "/api/staff").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/sepay/webhook").permitAll()
                        .requestMatchers("/api/manager/services/**", "/api/manager/staff/**",
                                "/api/manager/dashboard/**")
                        .hasAnyAuthority("OWNER", "MANAGER", "ROLE_OWNER", "ROLE_MANAGER")
                        .requestMatchers("/api/manager/customers/**")
                        .hasAnyAuthority("OWNER", "MANAGER", "RECEPTIONIST", "ROLE_OWNER", "ROLE_MANAGER", "ROLE_RECEPTIONIST")
                        .requestMatchers("/api/manager/notifications/**")
                        .hasAnyAuthority("OWNER", "MANAGER", "RECEPTIONIST", "ACCOUNTANT", "THERAPIST",
                                "ROLE_OWNER", "ROLE_MANAGER", "ROLE_RECEPTIONIST", "ROLE_ACCOUNTANT", "ROLE_THERAPIST")
                        .requestMatchers("/api/manager/accounts/**")
                        .hasAnyAuthority("OWNER", "MANAGER", "ROLE_OWNER", "ROLE_MANAGER")
                        .requestMatchers("/api/staff/tasks/**")
                        .hasAnyAuthority("THERAPIST", "ROLE_THERAPIST")
                        .requestMatchers("/api/attendance/**").authenticated()
                        .requestMatchers("/api/payments/**").authenticated()
                        .requestMatchers("/api/reports/**").authenticated()
                        .anyRequest().denyAll())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                SecurityErrorWriter.write(response, 401, "Unauthorized"))
                        .accessDeniedHandler((request, response, exception) ->
                                SecurityErrorWriter.write(response, 403, "Forbidden")))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class).build();
    }
}
