package com.kevin.lunaraspa.realtime;

import com.kevin.lunaraspa.authentication_account.security.JwtAuthenticationFilter;
import com.kevin.lunaraspa.authentication_account.security.SecurityErrorWriter;
import jakarta.servlet.DispatcherType;
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
public class RealtimeSecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    @Order(0)
    SecurityFilterChain realtimeSecurityFilterChain(HttpSecurity http) throws Exception {
        return http.securityMatcher("/api/events")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // An authenticated SSE request is completed through an ASYNC redispatch. The initial
                        // REQUEST still requires JWT; permitting only its continuation avoids a false 403 after
                        // the response has already been committed.
                        .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/api/events").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                SecurityErrorWriter.write(response, 401, "Unauthorized"))
                        .accessDeniedHandler((request, response, exception) ->
                                SecurityErrorWriter.write(response, 403, "Forbidden")))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
