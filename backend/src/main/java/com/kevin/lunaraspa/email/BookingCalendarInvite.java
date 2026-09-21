package com.kevin.lunaraspa.email;

import com.kevin.lunaraspa.booking.entity.Booking;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
public class BookingCalendarInvite {
    private static final ZoneId SPA_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter UTC_TIME = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");

    public byte[] create(Booking booking, int sequence, String organizerEmail, String organizerName,
                         String ticketUrl) {
        List<String> lines = new ArrayList<>();
        lines.add("BEGIN:VCALENDAR");
        lines.add("VERSION:2.0");
        lines.add("PRODID:-//Lunara Spa//Booking//VI");
        lines.add("CALSCALE:GREGORIAN");
        lines.add("METHOD:REQUEST");
        lines.add("BEGIN:VEVENT");
        lines.add("UID:" + escapeText(booking.getBookingCode()) + "@lunara-spa");
        lines.add("DTSTAMP:" + UTC_TIME.format(java.time.Instant.now().atZone(ZoneOffset.UTC)));
        lines.add("DTSTART:" + utc(booking.getBookingStart()));
        lines.add("DTEND:" + utc(booking.getBookingEnd()));
        lines.add("SEQUENCE:" + Math.max(sequence, 0));
        lines.add("ORGANIZER;CN=\"" + parameter(organizerName) + "\":mailto:" + organizerEmail);
        lines.add("ATTENDEE;CN=\"" + parameter(booking.getCustomerNameSnapshot())
                + "\";ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:" + booking.getCustomerEmailSnapshot());
        lines.add("SUMMARY:" + escapeText("Lịch hẹn tại Lunara Spa"));
        lines.add("DESCRIPTION:" + escapeText("Mã vé " + booking.getBookingCode() + "\nXem chi tiết: " + ticketUrl));
        lines.add("STATUS:CONFIRMED");
        lines.add("END:VEVENT");
        lines.add("END:VCALENDAR");
        String body = lines.stream().map(this::foldLine).reduce("", (left, line) -> left + line + "\r\n");
        return body.getBytes(StandardCharsets.UTF_8);
    }

    private String utc(java.time.LocalDateTime time) {
        return UTC_TIME.format(time.atZone(SPA_ZONE).withZoneSameInstant(ZoneOffset.UTC));
    }

    private String escapeText(String value) {
        return value.replace("\\", "\\\\").replace("\r", "").replace("\n", "\\n")
                .replace(",", "\\,").replace(";", "\\;");
    }

    private String parameter(String value) {
        return value.replace("\r", " ").replace("\n", " ").replace("\"", "'");
    }

    private String foldLine(String line) {
        StringBuilder folded = new StringBuilder();
        int octets = 0;
        for (int offset = 0; offset < line.length();) {
            int codePoint = line.codePointAt(offset);
            String character = new String(Character.toChars(codePoint));
            int width = character.getBytes(StandardCharsets.UTF_8).length;
            if (octets + width > 75) {
                folded.append("\r\n ");
                octets = 1;
            }
            folded.append(character);
            octets += width;
            offset += Character.charCount(codePoint);
        }
        return folded.toString();
    }
}
