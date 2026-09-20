package com.kevin.lunaraspa.realtime;

import java.time.Instant;

public record RealtimeEventEnvelope(
        String id,
        String topic,
        String entityType,
        Long entityId,
        Instant occurredAt,
        long version,
        String eventType,
        String bookingCode,
        Long customerAccountId,
        Long staffAccountId
) {
}
