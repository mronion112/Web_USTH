package com.kevin.lunaraspa.payment;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.booking.entity.*;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.payment.dto.PaymentDtos.*;
import com.kevin.lunaraspa.payment.entity.*;
import com.kevin.lunaraspa.payment.exception.PaymentErrorCode;
import com.kevin.lunaraspa.payment.repository.PaymentRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private static final Set<String> OPERATIONS = Set.of("OWNER", "MANAGER", "RECEPTIONIST", "ACCOUNTANT");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final AccountRepository accountRepository;
    private final org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;
    private final RealtimeEventPublisher realtimeEventPublisher;
    private final PaymentConfirmationService confirmationService;
    private final VietQrPayloadGenerator vietQrPayloadGenerator;

    @Value("${app.payment.bank-account-name}")
    private String bankAccountName;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Object> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Account actor = currentAccount();
        ensureOperations(actor, false);

        String sql = """
                SELECT p.id, p.transaction_code, p.booking_id, b.booking_code,
                       b.customer_name_snapshot AS customer_name,
                       p.status, p.method, p.amount, p.paid_at, p.created_at, p.qr_payload,
                       st.reference_code AS bank_reference, st.gateway AS payment_provider
                FROM payments p
                LEFT JOIN bookings b ON p.booking_id = b.id
                LEFT JOIN sepay_transactions st ON st.matched_payment_id = p.id AND st.status = 'CONFIRMED'
                WHERE (:status IS NULL OR :status = '' OR :status = 'ALL' OR p.status = :status)
                  AND (:search IS NULL OR :search = ''
                       OR p.transaction_code LIKE :searchPattern
                       OR b.booking_code LIKE :searchPattern
                       OR b.customer_name_snapshot LIKE :searchPattern)
                ORDER BY p.id DESC
                LIMIT :limit OFFSET :offset
                """;

        Map<String, Object> params = new HashMap<>();
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        params.put("search", trimmedSearch);
        params.put("searchPattern", trimmedSearch != null ? "%" + trimmedSearch + "%" : null);
        String trimmedStatus = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) ? status.trim().toUpperCase(Locale.ROOT) : null;
        params.put("status", trimmedStatus);
        params.put("limit", Math.max(1, Math.min(200, size)));
        params.put("offset", Math.max(0, page) * size);

        List<Map<String, Object>> list = jdbc.query(sql, params, (rs, rowNum) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", rs.getLong("id"));
            map.put("transactionCode", rs.getString("transaction_code"));
            map.put("bookingId", rs.getObject("booking_id"));
            map.put("bookingCode", rs.getString("booking_code"));
            map.put("customerName", rs.getString("customer_name"));
            map.put("status", rs.getString("status"));
            map.put("method", rs.getString("method"));
            map.put("amount", rs.getBigDecimal("amount"));
            map.put("paidAt", rs.getObject("paid_at", LocalDateTime.class));
            map.put("createdAt", rs.getObject("created_at", LocalDateTime.class));
            map.put("qrPayload", rs.getString("qr_payload"));
            map.put("bankReference", rs.getString("bank_reference"));
            map.put("paymentProvider", rs.getString("payment_provider"));
            map.put("bankBin", vietQrPayloadGenerator.bankBin());
            map.put("bankAccount", vietQrPayloadGenerator.bankAccount());
            map.put("bankAccountName", bankAccountName);
            return map;
        });

        return ResponseBuilder.ok(list, "Get payments successfully");
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Object> create(@RequestBody CreatePaymentRequest request) {
        if (request == null || request.bookingId() == null || request.bookingId() <= 0)
            throw new AppException(PaymentErrorCode.BOOKING_NOT_FOUND);
        PaymentMethod method;
        try { method = PaymentMethod.valueOf(request.method() == null ? "" : request.method().trim().toUpperCase(Locale.ROOT)); }
        catch (IllegalArgumentException ex) { throw new AppException(PaymentErrorCode.INVALID_METHOD); }
        Account actor = currentAccount();
        Booking booking = bookingRepository.findByIdForUpdate(request.bookingId())
                .orElseThrow(() -> new AppException(PaymentErrorCode.BOOKING_NOT_FOUND));
        ensureCanView(actor, booking);
        Optional<Payment> existing = paymentRepository.findByBookingId(booking.getId());
        if (existing.isPresent()) {
            Payment payment = existing.get();
            refreshUnpaidQr(payment);
            return ResponseBuilder.ok(toResponse(payment), "Payment already initialized");
        }
        String temporaryCode = "TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        Payment payment = Payment.builder().transactionCode(temporaryCode).bookingId(booking.getId())
                .method(method).amount(booking.getTotalAmount()).status(PaymentStatus.UNPAID).build();
        paymentRepository.saveAndFlush(payment);
        String code = "PAY-" + LocalDateTime.now().format(DATE) + "-" + String.format("%05d", payment.getId());
        payment.setTransactionCode(code);
        if (method == PaymentMethod.QR) {
            payment.setQrPayload(vietQrPayloadGenerator.generate(payment.getAmount(), code));
        }
        paymentRepository.saveAndFlush(payment);
        realtimeEventPublisher.paymentChanged(booking, "PAYMENT_INITIALIZED");
        return ResponseBuilder.ok(toResponse(payment), HttpStatus.CREATED, "Payment created successfully");
    }

    @GetMapping("/booking/{bookingId}")
    @Transactional
    public ResponseEntity<Object> getForBooking(@PathVariable Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new AppException(PaymentErrorCode.NOT_FOUND));
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(PaymentErrorCode.BOOKING_NOT_FOUND));
        ensureCanView(currentAccount(), booking);
        refreshUnpaidQr(payment);
        return ResponseBuilder.ok(toResponse(payment), "Get payment successfully");
    }

    @PatchMapping("/{paymentId}/paid")
    @Transactional
    public ResponseEntity<Object> paid(@PathVariable Long paymentId, @RequestBody PaidRequest request) {
        Account actor = currentAccount();
        ensureOperations(actor, false);
        if (request == null) throw new AppException(PaymentErrorCode.TRANSACTION_MISMATCH);
        Payment payment = confirmationService.confirmManually(paymentId, request.transactionCode(), actor.getId());
        return ResponseBuilder.ok(toResponse(payment), "Payment completed successfully");
    }

    @PostMapping("/{paymentId}/refund")
    @Transactional
    public ResponseEntity<Object> refund(@PathVariable Long paymentId) {
        Account actor = currentAccount();
        ensureOperations(actor, true);
        Payment payment = get(paymentId);
        if (payment.getStatus() != PaymentStatus.PAID) throw new AppException(PaymentErrorCode.INVALID_STATUS);
        payment.setStatus(PaymentStatus.REFUNDED); payment.setRefundedAt(LocalDateTime.now());
        Payment saved = paymentRepository.saveAndFlush(payment);
        Booking booking = bookingRepository.findById(payment.getBookingId())
                .orElseThrow(() -> new AppException(PaymentErrorCode.BOOKING_NOT_FOUND));
        booking.addEvent(BookingEvent.builder().eventType("PAYMENT_REFUNDED").actorAccountId(actor.getId())
                .message("Payment " + payment.getTransactionCode() + " was refunded.").occurredAt(LocalDateTime.now()).build());
        bookingRepository.saveAndFlush(booking);
        realtimeEventPublisher.paymentChanged(booking, "PAYMENT_REFUNDED");
        return ResponseBuilder.ok(toResponse(saved), "Payment refunded successfully");
    }

    private Payment get(Long id) {
        if (id == null || id <= 0) throw new AppException(PaymentErrorCode.NOT_FOUND);
        return paymentRepository.findById(id).orElseThrow(() -> new AppException(PaymentErrorCode.NOT_FOUND));
    }
    private void refreshUnpaidQr(Payment payment) {
        if (payment.getMethod() != PaymentMethod.QR || payment.getStatus() != PaymentStatus.UNPAID) return;
        String expected = vietQrPayloadGenerator.generate(payment.getAmount(), payment.getTransactionCode());
        if (!expected.equals(payment.getQrPayload())) {
            payment.setQrPayload(expected);
            paymentRepository.saveAndFlush(payment);
        }
    }
    private Account currentAccount() {
        return accountRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .orElseThrow(() -> new AppException(PaymentErrorCode.ACCESS_DENIED));
    }
    private void ensureCanView(Account account, Booking booking) {
        if (!account.getId().equals(booking.getCustomerAccountId())
                && !OPERATIONS.contains(role(account)))
            throw new AppException(PaymentErrorCode.ACCESS_DENIED);
    }
    private void ensureOperations(Account account, boolean refund) {
        String role = role(account);
        if (!OPERATIONS.contains(role) || (refund && "RECEPTIONIST".equals(role)))
            throw new AppException(PaymentErrorCode.ACCESS_DENIED);
    }
    private String role(Account a) {
        String role = a.getRole().getCode().toUpperCase(Locale.ROOT);
        return role.startsWith("ROLE_") ? role.substring(5) : role;
    }
    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(p.getId(), p.getTransactionCode(), p.getBookingId(), p.getStatus().name(),
                p.getMethod().name(), p.getAmount(), p.getQrPayload(), p.getPaidAt(), p.getRefundedAt(),
                vietQrPayloadGenerator.bankBin(), vietQrPayloadGenerator.bankAccount(), bankAccountName);
    }
}
