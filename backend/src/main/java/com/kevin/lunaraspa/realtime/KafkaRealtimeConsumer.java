package com.kevin.lunaraspa.realtime;

import tools.jackson.databind.ObjectMapper;
import com.kevin.lunaraspa.email.BookingEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaRealtimeConsumer {
    private static final Set<String> EMAIL_EVENTS = Set.of(
            "PAYMENT_RECEIVED", "RESCHEDULED", "EMAIL_RESEND_REQUESTED"
    );
    private final ObjectMapper objectMapper;
    private final SseEventHub hub;
    private final BookingEmailService emailService;

    @KafkaListener(topics = {RealtimeTopics.BOOKING, RealtimeTopics.PAYMENT, RealtimeTopics.SCHEDULE})
    public void receive(ConsumerRecord<String, String> record) {
        try {
            RealtimeEventEnvelope event = objectMapper.readValue(record.value(), RealtimeEventEnvelope.class);
            hub.broadcast(event);
            if (RealtimeTopics.BOOKING.equals(record.topic()) && EMAIL_EVENTS.contains(event.eventType())) {
                try {
                    emailService.sendBookingUpdate(event);
                } catch (RuntimeException error) {
                    log.error("Booking email delivery failed: eventId={}", event.id(), error);
                }
            }
        } catch (Exception error) {
            log.error("Invalid realtime event on topic {}", record.topic(), error);
        }
    }
}
