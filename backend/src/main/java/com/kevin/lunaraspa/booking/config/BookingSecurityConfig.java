package com.kevin.lunaraspa.booking.config;

import com.kevin.lunaraspa.authentication_account.security.JwtAuthenticationFilter;
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
public class BookingSecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    @Order(2)
    public SecurityFilterChain bookingSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/bookings/**", "/api/manager/bookings/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/api/bookings/**", "/api/manager/bookings/**")
                        .permitAll()
                        .requestMatchers("/api/manager/bookings/**")
                        .hasAnyAuthority(
                                "OWNER", "MANAGER", "RECEPTIONIST",
                                "ROLE_OWNER", "ROLE_MANAGER", "ROLE_RECEPTIONIST"
                        )
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
