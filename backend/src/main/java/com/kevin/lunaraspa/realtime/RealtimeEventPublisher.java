package com.kevin.lunaraspa.realtime;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.kevin.lunaraspa.booking.entity.Booking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class RealtimeEventPublisher {
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void bookingChanged(Booking booking, String eventType) {
        publishAfterCommit(RealtimeTopics.BOOKING, "booking", booking, eventType);
        publishAfterCommit(RealtimeTopics.SCHEDULE, "calendar", booking, eventType);
    }

    public void paymentChanged(Booking booking, String eventType) {
        publishAfterCommit(RealtimeTopics.PAYMENT, "payment", booking, eventType);
        publishAfterCommit(RealtimeTopics.BOOKING, "booking", booking, eventType);
    }

    public void scheduleChanged(Long staffAccountId, String eventType) {
        RealtimeEventEnvelope envelope = new RealtimeEventEnvelope(
                UUID.randomUUID().toString(), "calendar", "staff", staffAccountId,
                Instant.now(), System.currentTimeMillis(), eventType, null, null, staffAccountId);
        publishAfterCommit(RealtimeTopics.SCHEDULE, String.valueOf(staffAccountId), envelope);
    }

    private void publishAfterCommit(String kafkaTopic, String refreshTopic, Booking booking, String eventType) {
        RealtimeEventEnvelope envelope = new RealtimeEventEnvelope(
                UUID.randomUUID().toString(), refreshTopic, "booking", booking.getId(),
                Instant.now(), System.currentTimeMillis(), eventType, booking.getBookingCode(),
                booking.getCustomerAccountId(), booking.getStaffAccountId());
        publishAfterCommit(kafkaTopic, booking.getBookingCode(), envelope);
    }

    private void publishAfterCommit(String kafkaTopic, String key, RealtimeEventEnvelope envelope) {
        Runnable send = () -> send(kafkaTopic, key, envelope);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }

    private void send(String topic, String key, RealtimeEventEnvelope envelope) {
        try {
            kafkaTemplate.send(topic, key, objectMapper.writeValueAsString(envelope))
                    .whenComplete((result, error) -> {
                        if (error != null) log.error("Cannot publish realtime event {} to {}", envelope.id(), topic, error);
                    });
        } catch (JacksonException error) {
            throw new IllegalStateException("Cannot serialize realtime event", error);
        }
    }
}
