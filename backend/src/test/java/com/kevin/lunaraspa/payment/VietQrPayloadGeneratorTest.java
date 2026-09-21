package com.kevin.lunaraspa.payment;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class VietQrPayloadGeneratorTest {
    private final VietQrPayloadGenerator generator = new VietQrPayloadGenerator("970422", "0000000001");

    @Test
    void createsDynamicVietQrPayloadWithAmountCodeAndValidCrc() {
        String payload = generator.generate(new BigDecimal("450000.00"), "PAY-20260920-00042");

        assertThat(payload).startsWith("000201010212")
                .contains("A000000727")
                .contains("970422")
                .contains("0000000001")
                .contains("450000")
                .contains("PAY-20260920-00042")
                .matches(".*6304[0-9A-F]{4}$");
        String checksumInput = payload.substring(0, payload.length() - 4);
        assertThat(payload.substring(payload.length() - 4)).isEqualTo(crc(checksumInput));
    }

    private String crc(String input) {
        int crc = 0xFFFF;
        for (byte value : input.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (value & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return String.format("%04X", crc);
    }
}
