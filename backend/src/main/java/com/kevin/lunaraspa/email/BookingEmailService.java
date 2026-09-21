package com.kevin.lunaraspa.email;

import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.booking.repository.BookingEventRepository;
import com.kevin.lunaraspa.payment.entity.Payment;
import com.kevin.lunaraspa.payment.entity.PaymentStatus;
import com.kevin.lunaraspa.payment.repository.PaymentRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventEnvelope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingEmailService {
    private static final DateTimeFormatter DISPLAY_TIME = DateTimeFormatter.ofPattern("HH:mm, dd/MM/yyyy");
    private final BookingRepository bookingRepository;
    private final BookingEventRepository bookingEventRepository;
    private final PaymentRepository paymentRepository;
    private final EmailDeliveryClient emailDeliveryClient;
    private final TemplateEngine templateEngine;
    private final StringRedisTemplate redisTemplate;
    private final BookingCalendarInvite calendarInvite;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${app.mail.name:Lunara Spa}")
    private String fromName;

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
            String eventType = event.eventType();
            Context context = new Context(new Locale("vi", "VN"));
            context.setVariable("headline", switch (eventType) {
                case "RESCHEDULED" -> "Lịch hẹn đã được cập nhật";
                case "EMAIL_RESEND_REQUESTED" -> "Thông tin lịch hẹn của bạn";
                default -> "Đặt lịch thành công";
            });
            context.setVariable("name", booking.getCustomerNameSnapshot());
            context.setVariable("code", booking.getBookingCode());
            context.setVariable("start", booking.getBookingStart().format(DISPLAY_TIME));
            context.setVariable("items", booking.getItems());
            context.setVariable("totalAmount", booking.getTotalAmount());
            context.setVariable("paymentStatus", payment != null && payment.getStatus() == PaymentStatus.PAID
                    ? "Đã thanh toán" : "Chờ xác nhận");
            String ticketUrl = frontendUrl + "/ticket/" + booking.getBookingCode();
            context.setVariable("ticketUrl", ticketUrl);

            String subject = switch (eventType) {
                case "RESCHEDULED" -> "Lunara — Lịch hẹn đã được cập nhật";
                case "EMAIL_RESEND_REQUESTED" -> "Lunara — Thông tin lịch hẹn " + booking.getBookingCode();
                default -> "Lunara — Xác nhận lịch hẹn " + booking.getBookingCode();
            };
            String html = templateEngine.process("booking-email", context);
            int sequence = Math.toIntExact(bookingEventRepository.countByBookingIdAndEventType(
                    booking.getId(), "RESCHEDULED"));
            byte[] calendar = calendarInvite.create(booking, sequence, from, fromName, ticketUrl);
            String providerId = emailDeliveryClient.send(new OutboundEmail(from, fromName,
                    booking.getCustomerEmailSnapshot(), subject, html, deliveryKey,
                    List.of(new OutboundEmail.Attachment(
                            "lunara-" + booking.getBookingCode() + ".ics", calendar))));
            redisTemplate.opsForValue().set(deliveryKey, "sent", Duration.ofDays(30));
            log.info("Booking email sent: eventId={}, bookingCode={}, providerId={}",
                    event.id(), booking.getBookingCode(), providerId);
        } catch (RuntimeException error) {
            redisTemplate.delete(deliveryKey);
            throw new IllegalStateException("Cannot send booking email for event " + event.id(), error);
        }
    }

}
