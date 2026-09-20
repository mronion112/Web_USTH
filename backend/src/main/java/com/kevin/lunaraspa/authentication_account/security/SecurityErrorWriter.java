package com.kevin.lunaraspa.authentication_account.security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.io.IOException;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class SecurityErrorWriter {
    public static void write(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        if (status == HttpServletResponse.SC_UNAUTHORIZED) response.setHeader("WWW-Authenticate", "Bearer");
        response.getWriter().write("{\"success\":false,\"status\":" + status
                + ",\"message\":\"" + message + "\"}");
    }
}
