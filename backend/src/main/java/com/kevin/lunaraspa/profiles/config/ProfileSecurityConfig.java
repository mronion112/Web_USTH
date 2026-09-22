package com.kevin.lunaraspa.profiles.config;

import com.kevin.lunaraspa.authentication_account.security.JwtAuthenticationFilter;
import com.kevin.lunaraspa.authentication_account.security.SecurityErrorWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class ProfileSecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    @Order(3)
    SecurityFilterChain profileSecurityFilterChain(HttpSecurity http,
            @Value("${app.frontend-url}") String frontendUrl) throws Exception {
        var cors = new CorsConfiguration();
        cors.setAllowedOrigins(List.of(frontendUrl));
        cors.setAllowedMethods(List.of("GET", "PUT", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cors.setAllowCredentials(true);
        cors.setMaxAge(3600L);
        return http.securityMatcher("/api/profile/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(config -> config.configurationSource(request -> cors))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/api/profile/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/profile/me").authenticated()
                        // The service checks the current database role, rather than a stale JWT role.
                        .requestMatchers(HttpMethod.PUT, "/api/profile/me").authenticated()
                        .anyRequest().denyAll())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((req, res, ex) ->
                                SecurityErrorWriter.write(res, 401, "Unauthorized"))
                        .accessDeniedHandler((req, res, ex) ->
                                SecurityErrorWriter.write(res, 403, "Forbidden")))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
