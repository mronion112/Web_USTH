package com.kevin.lunaraspa.email;

import com.kevin.lunaraspa.booking.entity.Booking;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class BookingCalendarInviteTest {
    private final BookingCalendarInvite invite = new BookingCalendarInvite();

    @Test
    void createsAnUpdateableCalendarRequestInUtc() {
        Booking booking = Booking.builder()
                .bookingCode("LNR-20260920-00001")
                .customerNameSnapshot("Nguyen Van Duc")
                .customerEmailSnapshot("customer@example.com")
                .bookingStart(LocalDateTime.of(2026, 9, 20, 9, 0))
                .bookingEnd(LocalDateTime.of(2026, 9, 20, 10, 0))
                .build();

        String calendar = new String(invite.create(booking, 2, "spa@example.com", "Lunara Spa",
                "https://lunara.example/ticket/1"), StandardCharsets.UTF_8);

        assertThat(calendar).contains("METHOD:REQUEST\r\n")
                .contains("UID:LNR-20260920-00001@lunara-spa\r\n")
                .contains("DTSTART:20260920T020000Z\r\n")
                .contains("DTEND:20260920T030000Z\r\n")
                .contains("SEQUENCE:2\r\n")
                .contains("ORGANIZER;CN=\"Lunara Spa\":mailto:spa@example.com\r\n")
                .contains("ATTENDEE;CN=\"Nguyen Van Duc\";ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:")
                .endsWith("END:VCALENDAR\r\n");
    }

    @Test
    void keepsTheSameUidWhileSequenceChanges() {
        Booking booking = Booking.builder().bookingCode("LNR-1").customerNameSnapshot("Duc")
                .customerEmailSnapshot("duc@example.com")
                .bookingStart(LocalDateTime.of(2026, 9, 20, 9, 0))
                .bookingEnd(LocalDateTime.of(2026, 9, 20, 10, 0)).build();

        String initial = text(invite.create(booking, 0, "spa@example.com", "Lunara", "https://example.com"));
        String updated = text(invite.create(booking, 1, "spa@example.com", "Lunara", "https://example.com"));

        assertThat(initial).contains("UID:LNR-1@lunara-spa", "SEQUENCE:0");
        assertThat(updated).contains("UID:LNR-1@lunara-spa", "SEQUENCE:1");
    }

    private String text(byte[] value) {
        return new String(value, StandardCharsets.UTF_8);
    }
}
