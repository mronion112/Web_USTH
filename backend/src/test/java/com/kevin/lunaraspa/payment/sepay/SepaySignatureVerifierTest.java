package com.kevin.lunaraspa.payment.sepay;

import com.kevin.lunaraspa.core.exception.AppException;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class SepaySignatureVerifierTest {
    private static final String SECRET = "unit-test-sepay-secret";
    private static final Instant NOW = Instant.parse("2026-09-20T05:00:00Z");
    private final SepaySignatureVerifier verifier = new SepaySignatureVerifier(
            SECRET, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void acceptsExactSignedRawBytes() throws Exception {
        byte[] body = "{\"id\":42,\"transferAmount\":450000}".getBytes(StandardCharsets.UTF_8);
        String timestamp = String.valueOf(NOW.getEpochSecond());
        assertDoesNotThrow(() -> verifier.verify(body, timestamp, signature(timestamp, body)));
    }

    @Test
    void rejectsTamperedBodyAndReplayedTimestamp() throws Exception {
        String timestamp = String.valueOf(NOW.getEpochSecond());
        byte[] original = "{\"transferAmount\":450000}".getBytes(StandardCharsets.UTF_8);
        byte[] tampered = "{\"transferAmount\":1}".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> verifier.verify(tampered, timestamp, signature(timestamp, original)))
                .isInstanceOf(AppException.class);
        String oldTimestamp = String.valueOf(NOW.minusSeconds(301).getEpochSecond());
        assertThatThrownBy(() -> verifier.verify(original, oldTimestamp, signature(oldTimestamp, original)))
                .isInstanceOf(AppException.class);
    }

    private String signature(String timestamp, byte[] body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        mac.update((timestamp + ".").getBytes(StandardCharsets.UTF_8));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(body));
    }
}
