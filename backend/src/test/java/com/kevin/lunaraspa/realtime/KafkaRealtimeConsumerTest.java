package com.kevin.lunaraspa.realtime;

import com.kevin.lunaraspa.email.BookingEmailService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class KafkaRealtimeConsumerTest {

    @Test
    void paymentConfirmationBroadcastsAndEmailsOnlyFromBookingTopic() throws Exception {
        ObjectMapper mapper = mock(ObjectMapper.class);
        SseEventHub hub = mock(SseEventHub.class);
        BookingEmailService email = mock(BookingEmailService.class);
        KafkaRealtimeConsumer consumer = new KafkaRealtimeConsumer(mapper, hub, email);
        RealtimeEventEnvelope envelope = new RealtimeEventEnvelope("evt-1", "booking", "booking", 42L,
                Instant.parse("2026-09-20T00:00:00Z"), 1L, "PAYMENT_RECEIVED", "LUN-42", 7L, 9L);
        when(mapper.readValue("payload", RealtimeEventEnvelope.class)).thenReturn(envelope);

        consumer.receive(new ConsumerRecord<>(RealtimeTopics.BOOKING, 0, 0L, "LUN-42", "payload"));

        verify(hub).broadcast(envelope);
        verify(email).sendBookingUpdate(envelope);

        consumer.receive(new ConsumerRecord<>(RealtimeTopics.PAYMENT, 0, 1L, "LUN-42", "payload"));
        verify(hub, org.mockito.Mockito.times(2)).broadcast(envelope);
        verify(email, org.mockito.Mockito.times(1)).sendBookingUpdate(envelope);
    }

    @Test
    void nonEmailBookingEventDoesNotSendMail() throws Exception {
        ObjectMapper mapper = mock(ObjectMapper.class);
        SseEventHub hub = mock(SseEventHub.class);
        BookingEmailService email = mock(BookingEmailService.class);
        KafkaRealtimeConsumer consumer = new KafkaRealtimeConsumer(mapper, hub, email);
        RealtimeEventEnvelope envelope = new RealtimeEventEnvelope("evt-2", "booking", "booking", 43L,
                Instant.now(), 2L, "CHECKED_IN", "LUN-43", 8L, 10L);
        when(mapper.readValue("payload", RealtimeEventEnvelope.class)).thenReturn(envelope);

        consumer.receive(new ConsumerRecord<>(RealtimeTopics.BOOKING, 0, 0L, "LUN-43", "payload"));

        verify(hub).broadcast(envelope);
        verify(email, never()).sendBookingUpdate(envelope);
    }
}
