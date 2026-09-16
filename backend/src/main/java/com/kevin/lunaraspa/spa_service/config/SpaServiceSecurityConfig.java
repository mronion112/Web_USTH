package com.kevin.lunaraspa.spa_service.config;

import com.kevin.lunaraspa.authentication_account.security.JwtAuthenticationFilter;
import com.kevin.lunaraspa.spa_service.security.SpaServicePermissionAuthorizationManager;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
public class SpaServiceSecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SpaServicePermissionAuthorizationManager permissionAuthorizationManager;

    @Bean
    @Order(3)
    public SecurityFilterChain spaServiceSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/services/**", "/api/manager/services/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/api/services/**", "/api/manager/services/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/services/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/manager/services")
                        .access(permissionAuthorizationManager)
                        .anyRequest().denyAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
