package vn.lunara.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

@Service class SepayService {
    private final EntityManager em; private final ObjectMapper mapper; private final EventService events;
    @Value("${app.sepay.hmac-secret}") String secret;
    @Value("${app.sepay.account}") String bankAccount;
    SepayService(EntityManager em,ObjectMapper mapper,EventService events) { this.em=em; this.mapper=mapper; this.events=events; }
    void verify(byte[] raw,String timestamp,String signature) {
        try {
            long signedAt=Long.parseLong(timestamp);
            if (Math.abs(Instant.now().getEpochSecond()-signedAt)>300) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Webhook timestamp outside 5 minutes");
            Mac mac=Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));
            byte[] prefix=(timestamp+".").getBytes(StandardCharsets.UTF_8); mac.update(prefix); byte[] digest=mac.doFinal(raw);
            String expected="sha256="+HexFormat.of().formatHex(digest);
            if (signature==null || !MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII),signature.getBytes(StandardCharsets.US_ASCII))) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid webhook signature");
        } catch (NumberFormatException ex) { throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid timestamp"); }
        catch (ResponseStatusException ex) { throw ex; }
        catch (Exception ex) { throw new IllegalStateException(ex); }
    }
    @Transactional Map<String,Object> process(byte[] raw) {
        JsonNode body;
        try { body=mapper.readTree(raw); } catch(Exception ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid JSON"); }
        if (!body.hasNonNull("id") || !body.hasNonNull("transferAmount")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Missing SePay transaction fields");
        long id=body.get("id").asLong(); if (id<=0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid transaction id");
        BigDecimal amount=body.get("transferAmount").decimalValue();
        String code=text(body,"code"); String content=text(body,"content"); String reference=text(body,"referenceCode");
        int inserted=em.createNativeQuery("INSERT IGNORE INTO webhook_inbox(sepay_id,reference_code,content,amount,outcome,received_at) VALUES(:id,:reference,:content,:amount,'RECEIVED',UTC_TIMESTAMP(6))")
            .setParameter("id",id).setParameter("reference",reference).setParameter("content",content).setParameter("amount",amount).executeUpdate();
        if (inserted==0) return Map.of("success",true,"duplicate",true);
        WebhookInbox inbox=em.find(WebhookInbox.class,id);
        if (!"in".equalsIgnoreCase(text(body,"transferType")) || !bankAccount.equals(text(body,"accountNumber"))) { inbox.outcome="MANUAL_REVIEW"; return Map.of("success",true,"outcome",inbox.outcome); }
        if (code==null || code.isBlank()) code=extractCode(content);
        List<Payment> found=code==null?List.of():em.createQuery("select p from Payment p where p.transactionCode=:code",Payment.class).setParameter("code",code).getResultList();
        if (found.isEmpty()) { inbox.outcome="MANUAL_REVIEW"; return Map.of("success",true,"outcome",inbox.outcome); }
        Payment p=found.get(0); Booking b=em.find(Booking.class,p.bookingId,LockModeType.PESSIMISTIC_WRITE); inbox.bookingId=b.id;
        LocalDateTime now=LocalDateTime.now(java.time.Clock.systemUTC());
        if (p.status!=PaymentStatus.UNPAID || b.status!=BookingStatus.PENDING_PAYMENT || b.holdExpiresAt==null || !now.isBefore(b.holdExpiresAt) || p.amount.compareTo(amount)!=0) {
            inbox.outcome="MANUAL_REVIEW";
            return Map.of("success",true,"outcome",inbox.outcome);
        }
        p.status=PaymentStatus.PAID; p.paidAt=now; b.status=BookingStatus.CONFIRMED; inbox.outcome="CONFIRMED";
        events.booking(b,"PAYMENT_RECEIVED",null,"SePay payment confirmed"); events.payment(b,"PAID");
        return Map.of("success",true,"outcome",inbox.outcome,"bookingCode",b.bookingCode);
    }
    private String text(JsonNode body,String field) { return body.hasNonNull(field)?body.get(field).asText():null; }
    private String extractCode(String content) {
        if (content==null) return null;
        var matcher=java.util.regex.Pattern.compile("(?i)(?<![A-Z0-9])LNR[A-Z0-9]{10}(?![A-Z0-9])").matcher(content);
        return matcher.find()?matcher.group().toUpperCase(Locale.ROOT):null;
    }
    @Transactional(readOnly=true) List<Map<String,Object>> review() {
        if (!BookingService.can("PAYMENTS_RECONCILE")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return em.createQuery("select w from WebhookInbox w where w.outcome='MANUAL_REVIEW' order by w.receivedAt desc",WebhookInbox.class).setMaxResults(100).getResultList().stream()
            .map(w -> { Map<String,Object> result=new LinkedHashMap<>(); result.put("sepayId",w.sepayId); result.put("bookingId",w.bookingId); result.put("amount",w.amount); result.put("content",w.content); result.put("outcome",w.outcome); result.put("receivedAt",w.receivedAt); return result; }).toList();
    }
    @Transactional void resolve(Long id,String outcome) {
        if (!BookingService.can("PAYMENTS_RECONCILE")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (!List.of("RESOLVED","REFUNDED").contains(outcome)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        WebhookInbox inbox=em.find(WebhookInbox.class,id,LockModeType.PESSIMISTIC_WRITE);
        if (inbox==null || !inbox.outcome.equals("MANUAL_REVIEW")) throw new ResponseStatusException(HttpStatus.CONFLICT);
        inbox.outcome=outcome;
        if (inbox.bookingId!=null) {
            Booking b=em.find(Booking.class,inbox.bookingId);
            events.booking(b,"PAYMENT_RECONCILED",AuthService.actor(),"SePay transaction "+id+" marked "+outcome);
        }
    }
}

@RestController class SepayController {
    private final SepayService service;
    SepayController(SepayService service) { this.service=service; }
    @PostMapping("/webhooks/sepay") Map<String,Object> webhook(@RequestBody byte[] raw,@RequestHeader(value="X-SePay-Timestamp",required=false) String timestamp,@RequestHeader(value="X-SePay-Signature",required=false) String signature) {
        service.verify(raw,timestamp,signature); return service.process(raw);
    }
    @GetMapping("/api/v1/payments/review") List<Map<String,Object>> review() { return service.review(); }
    @PostMapping("/api/v1/payments/review/{id}/{outcome:RESOLVED|REFUNDED}") Map<String,Boolean> resolve(@PathVariable Long id,@PathVariable String outcome) { service.resolve(id,outcome); return Map.of("success",true); }
}
