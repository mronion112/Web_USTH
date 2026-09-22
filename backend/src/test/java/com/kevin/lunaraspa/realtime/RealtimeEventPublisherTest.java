package com.kevin.lunaraspa.realtime;

import com.kevin.lunaraspa.booking.entity.Booking;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RealtimeEventPublisherTest {

    @AfterEach
    void clearTransactionSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void publishesBookingAndCalendarOnlyAfterTransactionCommit() throws Exception {
        @SuppressWarnings("unchecked")
        KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        ObjectMapper mapper = mock(ObjectMapper.class);
        when(mapper.writeValueAsString(any())).thenReturn("{\"event\":true}");
        when(kafka.send(anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(null));
        RealtimeEventPublisher publisher = new RealtimeEventPublisher(kafka, mapper);
        Booking booking = Booking.builder().id(42L).bookingCode("LUN-42")
                .customerAccountId(7L).staffAccountId(9L).build();

        TransactionSynchronizationManager.initSynchronization();
        publisher.bookingChanged(booking, "RESCHEDULED");

        verify(kafka, never()).send(anyString(), anyString(), anyString());
        List<TransactionSynchronization> callbacks = TransactionSynchronizationManager.getSynchronizations();
        assertThat(callbacks).hasSize(2);
        callbacks.forEach(TransactionSynchronization::afterCommit);

        verify(kafka).send(RealtimeTopics.BOOKING, "LUN-42", "{\"event\":true}");
        verify(kafka).send(RealtimeTopics.SCHEDULE, "LUN-42", "{\"event\":true}");
        verify(mapper, times(2)).writeValueAsString(any(RealtimeEventEnvelope.class));
    }

    @Test
    void emailRequestPublishesOnlyToBookingTopic() throws Exception {
        @SuppressWarnings("unchecked")
        KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        ObjectMapper mapper = mock(ObjectMapper.class);
        when(mapper.writeValueAsString(any())).thenReturn("{\"event\":true}");
        when(kafka.send(anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(null));
        RealtimeEventPublisher publisher = new RealtimeEventPublisher(kafka, mapper);
        Booking booking = Booking.builder().id(42L).bookingCode("LUN-42")
                .customerAccountId(7L).staffAccountId(9L).build();

        publisher.bookingEmailRequested(booking);

        verify(kafka).send(RealtimeTopics.BOOKING, "LUN-42", "{\"event\":true}");
        verify(kafka, times(1)).send(anyString(), anyString(), anyString());
    }
}
