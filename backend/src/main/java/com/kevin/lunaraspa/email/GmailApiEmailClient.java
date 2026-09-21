package com.kevin.lunaraspa.email;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class GmailApiEmailClient implements EmailDeliveryClient {
    private static final Duration TOKEN_EXPIRY_MARGIN = Duration.ofMinutes(1);
    private static final Base64.Encoder MIME_BASE64 = Base64.getMimeEncoder(76, "\r\n".getBytes(StandardCharsets.US_ASCII));

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Clock clock;
    private volatile CachedToken cachedToken;

    @Value("${app.mail.gmail.client-id:}") private String clientId;
    @Value("${app.mail.gmail.client-secret:}") private String clientSecret;
    @Value("${app.mail.gmail.refresh-token:}") private String refreshToken;
    @Value("${app.mail.gmail.token-url:https://oauth2.googleapis.com/token}") private String tokenUrl;
    @Value("${app.mail.gmail.send-url:https://gmail.googleapis.com/gmail/v1/users/me/messages/send}") private String sendUrl;

    @Autowired
    public GmailApiEmailClient(ObjectMapper objectMapper) {
        this(objectMapper, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(), Clock.systemUTC());
    }

    GmailApiEmailClient(ObjectMapper objectMapper, HttpClient httpClient, Clock clock) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.clock = clock;
    }

    @Override
    public String send(OutboundEmail email) {
        requireConfiguration(email);
        try {
            HttpResponse<String> response = sendMessage(email, accessToken());
            if (response.statusCode() == 401) {
                cachedToken = null;
                response = sendMessage(email, accessToken());
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Gmail API rejected email with HTTP " + response.statusCode());
            }
            String id = objectMapper.readTree(response.body()).path("id").asText();
            if (id == null || id.isBlank()) throw new IllegalStateException("Gmail API response is missing message id");
            return id;
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Gmail API request was interrupted", error);
        } catch (RuntimeException error) {
            throw error;
        } catch (Exception error) {
            throw new IllegalStateException("Cannot send email through Gmail API", error);
        }
    }

    String payload(OutboundEmail email) throws Exception {
        return objectMapper.writeValueAsString(Map.of("raw", Base64.getUrlEncoder().withoutPadding()
                .encodeToString(mimeMessage(email).getBytes(StandardCharsets.UTF_8))));
    }

    String mimeMessage(OutboundEmail email) {
        String boundary = "lunara_" + UUID.randomUUID().toString().replace("-", "");
        StringBuilder mime = new StringBuilder()
                .append("From: ").append(sender(email)).append("\r\n")
                .append("To: ").append(header(email.to())).append("\r\n")
                .append("Subject: ").append(encodedWord(email.subject())).append("\r\n")
                .append("MIME-Version: 1.0\r\n")
                .append("X-Lunara-Idempotency-Key: ").append(header(email.idempotencyKey())).append("\r\n")
                .append("Content-Type: multipart/mixed; boundary=\"").append(boundary).append("\"\r\n\r\n")
                .append("--").append(boundary).append("\r\n")
                .append("Content-Type: text/html; charset=UTF-8\r\n")
                .append("Content-Transfer-Encoding: base64\r\n\r\n")
                .append(base64(email.html().getBytes(StandardCharsets.UTF_8))).append("\r\n");
        if (email.attachments() != null) {
            for (OutboundEmail.Attachment attachment : email.attachments()) {
                String filename = header(attachment.filename());
                mime.append("--").append(boundary).append("\r\n")
                        .append("Content-Type: text/calendar; charset=UTF-8; method=PUBLISH; name=\"")
                        .append(filename).append("\"\r\n")
                        .append("Content-Disposition: attachment; filename=\"").append(filename).append("\"\r\n")
                        .append("Content-Transfer-Encoding: base64\r\n\r\n")
                        .append(base64(attachment.content())).append("\r\n");
            }
        }
        return mime.append("--").append(boundary).append("--\r\n").toString();
    }

    private HttpResponse<String> sendMessage(OutboundEmail email, String accessToken) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(sendUrl)).timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + accessToken).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload(email))).build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private String accessToken() throws Exception {
        CachedToken current = cachedToken;
        if (current != null && current.validAt(clock.instant())) return current.value();
        synchronized (this) {
            current = cachedToken;
            if (current != null && current.validAt(clock.instant())) return current.value();
            cachedToken = refreshAccessToken();
            return cachedToken.value();
        }
    }

    private CachedToken refreshAccessToken() throws Exception {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) fields.put("client_secret", clientSecret);
        fields.put("refresh_token", refreshToken);
        fields.put("grant_type", "refresh_token");
        String form = fields.entrySet().stream().map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .reduce((left, right) -> left + "&" + right).orElseThrow();
        HttpRequest request = HttpRequest.newBuilder(URI.create(tokenUrl)).timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form)).build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Google OAuth token refresh failed with HTTP " + response.statusCode());
        }
        var body = objectMapper.readTree(response.body());
        String token = body.path("access_token").asText();
        long expiresIn = body.path("expires_in").asLong(3600);
        if (token == null || token.isBlank()) throw new IllegalStateException("Google OAuth response is missing access token");
        return new CachedToken(token, clock.instant().plusSeconds(Math.max(61, expiresIn)).minus(TOKEN_EXPIRY_MARGIN));
    }

    private String sender(OutboundEmail email) {
        return email.fromName() == null || email.fromName().isBlank() ? header(email.fromAddress())
                : encodedWord(email.fromName().trim()) + " <" + header(email.fromAddress().trim()) + ">";
    }

    private String encodedWord(String value) {
        return "=?UTF-8?B?" + Base64.getEncoder().encodeToString(header(value).getBytes(StandardCharsets.UTF_8)) + "?=";
    }

    private String base64(byte[] value) { return MIME_BASE64.encodeToString(value); }
    private String header(String value) { return value == null ? "" : value.replace("\r", "").replace("\n", ""); }
    private String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }

    private void requireConfiguration(OutboundEmail email) {
        if (clientId == null || clientId.isBlank()) throw new IllegalStateException("GMAIL_CLIENT_ID is required");
        if (refreshToken == null || refreshToken.isBlank()) throw new IllegalStateException("GMAIL_REFRESH_TOKEN is required");
        if (email.fromAddress() == null || email.fromAddress().isBlank()) throw new IllegalStateException("MAIL_FROM is required");
        if (email.to() == null || email.to().isBlank()) throw new IllegalArgumentException("Email recipient is required");
        if (email.idempotencyKey() == null || email.idempotencyKey().isBlank()) {
            throw new IllegalArgumentException("Email idempotency key is required");
        }
    }

    private record CachedToken(String value, Instant expiresAt) {
        private boolean validAt(Instant now) { return now.isBefore(expiresAt); }
    }
}
