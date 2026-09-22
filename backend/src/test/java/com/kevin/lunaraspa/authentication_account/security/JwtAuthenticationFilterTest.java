package com.kevin.lunaraspa.authentication_account.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private JwtBlacklistService jwtBlacklistService;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        filter = new JwtAuthenticationFilter(jwtUtils, jwtBlacklistService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesFromBearerHeader() throws ServletException, IOException {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);

        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtUtils.extractEmail("valid-token")).thenReturn("admin@lunaraspa.com");
        when(jwtUtils.extractExpiration("valid-token")).thenReturn(new Date(System.currentTimeMillis() + 60000));
        when(jwtUtils.isTokenExpired("valid-token")).thenReturn(false);
        when(jwtUtils.extractRole("valid-token")).thenReturn("OWNER");
        when(jwtBlacklistService.isBlacklisted("valid-token")).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("admin@lunaraspa.com", SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @Test
    void authenticatesFromCookieWhenHeaderMissing() throws ServletException, IOException {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);

        Cookie cookie = new Cookie("lunara_access_token", "cookie-token");
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getCookies()).thenReturn(new Cookie[]{cookie});
        when(jwtUtils.extractEmail("cookie-token")).thenReturn("customer@example.com");
        when(jwtUtils.extractExpiration("cookie-token")).thenReturn(new Date(System.currentTimeMillis() + 60000));
        when(jwtUtils.isTokenExpired("cookie-token")).thenReturn(false);
        when(jwtUtils.extractRole("cookie-token")).thenReturn("CUSTOMER");
        when(jwtBlacklistService.isBlacklisted("cookie-token")).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("customer@example.com", SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @Test
    void skipsAuthenticationWhenNeitherHeaderNorCookiePresent() throws ServletException, IOException {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);

        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getCookies()).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
