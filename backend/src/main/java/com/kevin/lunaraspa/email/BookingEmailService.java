package com.kevin.lunaraspa.email;

import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import com.kevin.lunaraspa.payment.repository.PaymentRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventEnvelope;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingEmailService {
    private static final DateTimeFormatter DISPLAY_TIME = DateTimeFormatter.ofPattern("HH:mm, dd/MM/yyyy");
    private static final DateTimeFormatter ICS_TIME = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendBookingUpdate(RealtimeEventEnvelope event) {
        if (!enabled || event.entityId() == null) return;
        String deliveryKey = "email:booking-event:" + event.id();
        if (!Boolean.TRUE.equals(redisTemplate.opsForValue().setIfAbsent(deliveryKey, "sending", Duration.ofDays(30)))) {
            return;
        }
        try {
            Booking booking = bookingRepository.findByIdWithItems(event.entityId())
                    .orElseThrow(() -> new IllegalStateException("Booking not found for email event " + event.id()));
            Payment payment = paymentRepository.findByBookingId(booking.getId()).orElse(null);
            Context context = new Context(new Locale("vi", "VN"));
            context.setVariable("headline", "RESCHEDULED".equals(event.eventType())
                    ? "Lịch hẹn đã được cập nhật" : "Đặt lịch thành công");
            context.setVariable("name", booking.getCustomerNameSnapshot());
            context.setVariable("code", booking.getBookingCode());
            context.setVariable("start", booking.getBookingStart().format(DISPLAY_TIME));
            context.setVariable("items", booking.getItems());
            context.setVariable("totalAmount", booking.getTotalAmount());
            context.setVariable("paymentStatus", payment != null && payment.getStatus() == PaymentStatus.PAID
                    ? "Đã thanh toán" : "Chờ xác nhận");
            context.setVariable("ticketUrl", frontendUrl + "/ticket/" + booking.getId());

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from == null || from.isBlank() ? username : from);
            helper.setTo(booking.getCustomerEmailSnapshot());
            helper.setSubject("RESCHEDULED".equals(event.eventType())
                    ? "Lunara — Lịch hẹn đã được cập nhật"
                    : "Lunara — Xác nhận lịch hẹn " + booking.getBookingCode());
            helper.setText(templateEngine.process("booking-email", context), true);
            helper.addAttachment("lunara-" + booking.getBookingCode() + ".ics",
                    new ByteArrayResource(calendarFile(booking).getBytes(StandardCharsets.UTF_8)),
                    "text/calendar; charset=UTF-8");
            mailSender.send(message);
            redisTemplate.opsForValue().set(deliveryKey, "sent", Duration.ofDays(30));
            log.info("Booking email sent: eventId={}, bookingCode={}", event.id(), booking.getBookingCode());
        } catch (RuntimeException | jakarta.mail.MessagingException error) {
            redisTemplate.delete(deliveryKey);
            throw new IllegalStateException("Cannot send booking email for event " + event.id(), error);
        }
    }

    private String calendarFile(Booking booking) {
        return "BEGIN:VCALENDAR\r\n"
                + "VERSION:2.0\r\n"
                + "PRODID:-//Lunara Spa//Booking//VI\r\n"
                + "CALSCALE:GREGORIAN\r\n"
                + "METHOD:PUBLISH\r\n"
                + "BEGIN:VEVENT\r\n"
                + "UID:" + booking.getBookingCode() + "@lunara-spa\r\n"
                + "DTSTART;TZID=Asia/Ho_Chi_Minh:" + booking.getBookingStart().format(ICS_TIME) + "\r\n"
                + "DTEND;TZID=Asia/Ho_Chi_Minh:" + booking.getBookingEnd().format(ICS_TIME) + "\r\n"
                + "SUMMARY:Lịch hẹn tại Lunara Spa\r\n"
                + "DESCRIPTION:Mã vé " + booking.getBookingCode() + "\r\n"
                + "STATUS:CONFIRMED\r\n"
                + "END:VEVENT\r\n"
                + "END:VCALENDAR\r\n";
    }
}
