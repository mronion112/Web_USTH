package com.kevin.lunaraspa.email;

import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class BookingEmailTemplateTest {

    @Test
    void rendersBookingConfirmationFromRealTemplate() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);

        Context context = new Context(new Locale("vi", "VN"));
        context.setVariable("headline", "Đặt lịch thành công");
        context.setVariable("name", "Nguyễn Văn A");
        context.setVariable("code", "LUN-42");
        context.setVariable("start", "09:00, 20/09/2026");
        context.setVariable("items", List.of(Map.of(
                "serviceNameSnapshot", "Massage thư giãn",
                "lineAmount", new BigDecimal("450000"),
                "durationMinutes", 60)));
        context.setVariable("totalAmount", new BigDecimal("450000"));
        context.setVariable("paymentStatus", "Đã thanh toán");
        context.setVariable("ticketUrl", "http://localhost:5173/ticket/42");

        String html = engine.process("booking-email", context);

        assertThat(html).contains("Đặt lịch thành công", "Nguyễn Văn A", "LUN-42",
                "Massage thư giãn", "Đã thanh toán", "http://localhost:5173/ticket/42");
        assertThat(html).doesNotContain("th:text", "th:href", "${");
    }
}
