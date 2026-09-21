package com.kevin.lunaraspa.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

@Component
public class VietQrPayloadGenerator {
    private static final String VIETQR_GUID = "A000000727";
    private static final String TRANSFER_SERVICE = "QRIBFTTA";

    private final String bankBin;
    private final String bankAccount;

    public VietQrPayloadGenerator(@Value("${app.payment.bank-bin}") String bankBin,
                                  @Value("${app.payment.bank-account}") String bankAccount) {
        this.bankBin = requireDigits(bankBin, "Bank BIN");
        this.bankAccount = requireDigits(bankAccount, "Bank account");
    }

    public String generate(BigDecimal amount, String paymentCode) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        if (paymentCode == null || paymentCode.isBlank()) {
            throw new IllegalArgumentException("Payment code is required");
        }
        String beneficiary = field("00", bankBin) + field("01", bankAccount);
        String merchantAccount = field("00", VIETQR_GUID)
                + field("01", beneficiary)
                + field("02", TRANSFER_SERVICE);
        String amountText = amount.stripTrailingZeros().toPlainString();
        String additionalData = field("08", paymentCode.trim().toUpperCase());
        String withoutChecksum = field("00", "01")
                + field("01", "12")
                + field("38", merchantAccount)
                + field("53", "704")
                + field("54", amountText)
                + field("58", "VN")
                + field("62", additionalData)
                + "6304";
        return withoutChecksum + String.format("%04X", crc16(withoutChecksum.getBytes(StandardCharsets.UTF_8)));
    }

    public String bankBin() {
        return bankBin;
    }

    public String bankAccount() {
        return bankAccount;
    }

    private String field(String id, String value) {
        int length = value.getBytes(StandardCharsets.UTF_8).length;
        if (length > 99) throw new IllegalArgumentException("VietQR field is too long: " + id);
        return id + String.format("%02d", length) + value;
    }

    private String requireDigits(String value, String label) {
        if (value == null || !value.matches("\\d+")) {
            throw new IllegalArgumentException(label + " must contain digits only");
        }
        return value;
    }

    private int crc16(byte[] bytes) {
        int crc = 0xFFFF;
        for (byte value : bytes) {
            crc ^= (value & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return crc;
    }
}
