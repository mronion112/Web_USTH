package com.kevin.lunaraspa.email;

import java.util.List;

public record OutboundEmail(String fromAddress, String fromName, String to, String subject, String html,
                            String idempotencyKey, List<Attachment> attachments) {
    public record Attachment(String filename, byte[] content) {
    }
}
