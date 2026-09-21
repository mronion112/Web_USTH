package com.kevin.lunaraspa.email;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Flow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GmailApiEmailClientTest {
    @Test
    void refreshesTokenAndSendsMimeHtmlWithCalendar() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        @SuppressWarnings("unchecked") HttpResponse<String> tokenResponse = mock(HttpResponse.class);
        @SuppressWarnings("unchecked") HttpResponse<String> sendResponse = mock(HttpResponse.class);
        when(tokenResponse.statusCode()).thenReturn(200);
        when(tokenResponse.body()).thenReturn("{\"access_token\":\"access-123\",\"expires_in\":3600}");
        when(sendResponse.statusCode()).thenReturn(200);
        when(sendResponse.body()).thenReturn("{\"id\":\"message-123\"}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenReturn(tokenResponse, sendResponse);
        GmailApiEmailClient client = configuredClient(httpClient);

        assertThat(client.send(email())).isEqualTo("message-123");

        ArgumentCaptor<HttpRequest> requests = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient, times(2)).send(requests.capture(), any(HttpResponse.BodyHandler.class));
        HttpRequest tokenRequest = requests.getAllValues().get(0);
        HttpRequest sendRequest = requests.getAllValues().get(1);
        assertThat(tokenRequest.uri().toString()).isEqualTo("https://oauth.example/token");
        assertThat(body(tokenRequest)).contains("client_id=client-123", "client_secret=secret-123",
                "refresh_token=refresh-123", "grant_type=refresh_token");
        assertThat(sendRequest.uri().toString()).isEqualTo("https://gmail.example/messages/send");
        assertThat(sendRequest.headers().firstValue("Authorization")).contains("Bearer access-123");
        String raw = new ObjectMapper().readTree(body(sendRequest)).path("raw").asText();
        String mime = new String(Base64.getUrlDecoder().decode(raw), StandardCharsets.UTF_8);
        assertThat(mime).contains("From: =?UTF-8?B?THVuYXJhIFNwYQ==?= <booking@example.com>",
                "To: guest@example.com", "X-Lunara-Idempotency-Key: booking-event-42",
                "Content-Type: text/html", "Content-Type: text/calendar", "filename=\"booking.ics\"",
                Base64.getEncoder().encodeToString("<p>Đã đặt lịch</p>".getBytes(StandardCharsets.UTF_8)),
                Base64.getEncoder().encodeToString("BEGIN:VCALENDAR".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void reusesAccessTokenUntilItApproachesExpiry() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        @SuppressWarnings("unchecked") HttpResponse<String> tokenResponse = mock(HttpResponse.class);
        @SuppressWarnings("unchecked") HttpResponse<String> firstSend = mock(HttpResponse.class);
        @SuppressWarnings("unchecked") HttpResponse<String> secondSend = mock(HttpResponse.class);
        when(tokenResponse.statusCode()).thenReturn(200);
        when(tokenResponse.body()).thenReturn("{\"access_token\":\"access-123\",\"expires_in\":3600}");
        when(firstSend.statusCode()).thenReturn(200);
        when(firstSend.body()).thenReturn("{\"id\":\"message-1\"}");
        when(secondSend.statusCode()).thenReturn(200);
        when(secondSend.body()).thenReturn("{\"id\":\"message-2\"}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenReturn(tokenResponse, firstSend, secondSend);
        GmailApiEmailClient client = configuredClient(httpClient);

        assertThat(client.send(email())).isEqualTo("message-1");
        assertThat(client.send(email())).isEqualTo("message-2");
        verify(httpClient, times(3)).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
    }

    private GmailApiEmailClient configuredClient(HttpClient httpClient) {
        GmailApiEmailClient client = new GmailApiEmailClient(new ObjectMapper(), httpClient,
                Clock.fixed(Instant.parse("2026-09-21T08:00:00Z"), ZoneOffset.UTC));
        ReflectionTestUtils.setField(client, "clientId", "client-123");
        ReflectionTestUtils.setField(client, "clientSecret", "secret-123");
        ReflectionTestUtils.setField(client, "refreshToken", "refresh-123");
        ReflectionTestUtils.setField(client, "tokenUrl", "https://oauth.example/token");
        ReflectionTestUtils.setField(client, "sendUrl", "https://gmail.example/messages/send");
        return client;
    }

    private OutboundEmail email() {
        return new OutboundEmail("booking@example.com", "Lunara Spa", "guest@example.com", "Xác nhận lịch",
                "<p>Đã đặt lịch</p>", "booking-event-42", List.of(new OutboundEmail.Attachment(
                "booking.ics", "BEGIN:VCALENDAR".getBytes(StandardCharsets.UTF_8))));
    }

    private String body(HttpRequest request) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        CompletableFuture<Void> completed = new CompletableFuture<>();
        request.bodyPublisher().orElseThrow().subscribe(new Flow.Subscriber<>() {
            @Override public void onSubscribe(Flow.Subscription subscription) { subscription.request(Long.MAX_VALUE); }
            @Override public void onNext(java.nio.ByteBuffer item) {
                byte[] bytes = new byte[item.remaining()];
                item.get(bytes);
                output.writeBytes(bytes);
            }
            @Override public void onError(Throwable throwable) { completed.completeExceptionally(throwable); }
            @Override public void onComplete() { completed.complete(null); }
        });
        completed.get();
        return output.toString(StandardCharsets.UTF_8);
    }
}
