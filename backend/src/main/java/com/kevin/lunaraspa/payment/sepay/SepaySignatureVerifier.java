package com.kevin.lunaraspa.payment.sepay;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.payment.exception.PaymentErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;

@Component
public class SepaySignatureVerifier {
    private static final long MAX_CLOCK_SKEW_SECONDS = 300;
    private final String secret;
    private final Clock clock;

    @Autowired
    public SepaySignatureVerifier(@Value("${app.sepay.hmac-secret:}") String secret) {
        this(secret, Clock.systemUTC());
    }

    SepaySignatureVerifier(String secret, Clock clock) {
        this.secret = secret;
        this.clock = clock;
    }

    public void verify(byte[] rawBody, String timestamp, String signature) {
        if (secret == null || secret.isBlank()) {
            throw new AppException(PaymentErrorCode.WEBHOOK_NOT_CONFIGURED);
        }
        try {
            long signedAt = Long.parseLong(timestamp);
            if (Math.abs(Instant.now(clock).getEpochSecond() - signedAt) > MAX_CLOCK_SKEW_SECONDS) {
                throw new AppException(PaymentErrorCode.INVALID_WEBHOOK_SIGNATURE, "Webhook timestamp is outside 5 minutes");
            }
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            mac.update((timestamp + ".").getBytes(StandardCharsets.UTF_8));
            String expected = "sha256=" + HexFormat.of().formatHex(mac.doFinal(rawBody));
            if (signature == null || !MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII),
                    signature.getBytes(StandardCharsets.US_ASCII))) {
                throw new AppException(PaymentErrorCode.INVALID_WEBHOOK_SIGNATURE);
            }
        } catch (NumberFormatException error) {
            throw new AppException(PaymentErrorCode.INVALID_WEBHOOK_SIGNATURE, "Invalid webhook timestamp");
        } catch (AppException error) {
            throw error;
        } catch (Exception error) {
            throw new IllegalStateException("Cannot verify SePay webhook signature", error);
        }
    }
}
