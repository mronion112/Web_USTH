package vn.lunara.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

@Service class EventService {
    private final EntityManager em; private final ObjectMapper mapper; private final SseHub hub;
    EventService(EntityManager em,ObjectMapper mapper,SseHub hub) { this.em=em; this.mapper=mapper; this.hub=hub; }
    void booking(Booking b,String type,Long actor,String message) {
        BookingEvent event=new BookingEvent(); event.bookingId=b.id; event.eventType=type; event.actorAccountId=actor; event.message=message; em.persist(event);
        Map<String,Object> bookingData=Map.of("bookingCode",b.bookingCode,"customerAccountId",b.customerAccountId,"staffAccountId",b.staffAccountId,"type",type,"start",b.bookingStart.toString());
        Map<String,Object> scheduleData=Map.of("type","AVAILABILITY_CHANGED","staffAccountId",b.staffAccountId,"start",b.bookingStart.toString());
        outbox("booking.events",b.bookingCode,bookingData);
        outbox("schedule.events",b.bookingCode,scheduleData);
        afterCommit("booking.events",bookingData); afterCommit("schedule.events",scheduleData);
    }
    void payment(Booking b,String type) {
        Map<String,Object> data=Map.of("bookingCode",b.bookingCode,"customerAccountId",b.customerAccountId,"type",type);
        outbox("payment.events",b.bookingCode,data); afterCommit("payment.events",data);
    }
    private void afterCommit(String topic,Map<String,Object> data) {
        if (!org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) throw new IllegalStateException("Booking events require a transaction");
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization() {
            @Override public void afterCommit() { hub.send(topic,data); }
        });
    }
    private void outbox(String topic,String key,Map<String,Object> data) {
        try { OutboxEvent e=new OutboxEvent(); e.topic=topic; e.aggregateKey=key; e.payload=mapper.writeValueAsString(data); em.persist(e); em.flush(); data=new HashMap<>(data); data.put("outboxId",e.id); e.payload=mapper.writeValueAsString(data); }
        catch (Exception ex) { throw new IllegalStateException("Cannot serialize event",ex); }
    }
}

@Service class OutboxPublisher {
    private final EntityManager em; private final KafkaTemplate<String,String> kafka;
    OutboxPublisher(EntityManager em,KafkaTemplate<String,String> kafka) { this.em=em; this.kafka=kafka; }
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay=1000)
    @Transactional void publish() {
        List<OutboxEvent> pending=em.createQuery("select e from OutboxEvent e where e.publishedAt is null order by e.id",OutboxEvent.class).setMaxResults(50).getResultList();
        for (OutboxEvent event:pending) {
            try { kafka.send(event.topic,event.aggregateKey,event.payload).get(3,TimeUnit.SECONDS); event.publishedAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
            catch (Exception ex) { break; }
        }
    }
}

@Service class SseHub {
    private record Client(Long accountId,String role,SseEmitter emitter) { }
    private final List<Client> clients=new CopyOnWriteArrayList<>();
    SseEmitter subscribe(Long id,String role) {
        SseEmitter emitter=new SseEmitter(0L); Client client=new Client(id,role,emitter); clients.add(client);
        emitter.onCompletion(() -> clients.remove(client)); emitter.onTimeout(() -> clients.remove(client)); emitter.onError(ex -> clients.remove(client));
        try { emitter.send(SseEmitter.event().name("connected").data(Map.of("serverTime",Instant.now().toString()))); }
        catch (Exception ex) { clients.remove(client); }
        return emitter;
    }
    void send(String topic,Map<String,Object> data) {
        Long customer=number(data.get("customerAccountId")); Long staff=number(data.get("staffAccountId"));
        for (Client client:clients) {
            boolean internal=!client.role.equals("CUSTOMER");
            boolean operations=List.of("OWNER","MANAGER","RECEPTIONIST").contains(client.role);
            boolean paymentRole=operations || client.role.equals("ACCOUNTANT");
            boolean permitted=topic.equals("schedule.events") || client.accountId.equals(customer) || (internal && ((topic.equals("payment.events") && paymentRole) || (topic.equals("booking.events") && (operations || client.accountId.equals(staff)))));
            if (!permitted) continue;
            Map<String,Object> payload=topic.equals("schedule.events")?Map.of("type","AVAILABILITY_CHANGED","start",data.get("start"),"staffAccountId",data.get("staffAccountId")):data;
            try { client.emitter.send(SseEmitter.event().name(topic).data(payload)); }
            catch (Exception ex) { clients.remove(client); }
        }
    }
    private Long number(Object value) { return value instanceof Number n?n.longValue():null; }
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay=25000) void heartbeat() {
        for (Client client:clients) try { client.emitter.send(SseEmitter.event().comment("heartbeat")); } catch(Exception ex) { clients.remove(client); }
    }
}

@RestController @RequestMapping("/api/v1/events") class EventController {
    private final SseHub hub; private final EntityManager em;
    EventController(SseHub hub,EntityManager em) { this.hub=hub; this.em=em; }
    @GetMapping(produces=MediaType.TEXT_EVENT_STREAM_VALUE) SseEmitter stream() {
        Long id=AuthService.actor(); Account a=em.find(Account.class,id); return hub.subscribe(id,a.role.code);
    }
}

@Service class EventConsumer {
    private final ObjectMapper mapper; private final SseHub hub; private final MailService mail;
    EventConsumer(ObjectMapper mapper,SseHub hub,MailService mail) { this.mapper=mapper; this.hub=hub; this.mail=mail; }
    @KafkaListener(topics={"booking.events","payment.events","schedule.events"})
    void receive(org.apache.kafka.clients.consumer.ConsumerRecord<String,String> record) throws Exception {
        Map<String,Object> data=mapper.readValue(record.value(),new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>(){});
        hub.send(record.topic(),data);
        if (record.topic().equals("booking.events") && List.of("PAYMENT_RECEIVED","RESCHEDULED").contains(data.get("type"))) mail.bookingMessage(((Number)data.get("outboxId")).longValue(),String.valueOf(data.get("bookingCode")),String.valueOf(data.get("type")));
    }
}

@Service class MailService {
    private final EntityManager em; private final JavaMailSender sender; private final TemplateEngine template;
    @Value("${app.mail-from}") String from;
    @Value("${app.frontend-url}") String frontendUrl;
    @Value("${app.mail-enabled:true}") boolean enabled;
    MailService(EntityManager em,JavaMailSender sender,TemplateEngine template) { this.em=em; this.sender=sender; this.template=template; }
    @Transactional void bookingMessage(Long outboxId,String code,String type) throws Exception {
        if (!enabled) return;
        Number count=(Number)em.createNativeQuery("SELECT COUNT(*) FROM email_deliveries WHERE outbox_id=:id").setParameter("id",outboxId).getSingleResult();
        if (count.longValue()>0) return;
        Booking b=em.createQuery("select b from Booking b where b.bookingCode=:code",Booking.class).setParameter("code",code).getSingleResult();
        Context context=new Context(); context.setVariable("name",b.customerNameSnapshot); context.setVariable("code",b.bookingCode);
        context.setVariable("start",b.bookingStart.atOffset(ZoneOffset.UTC).atZoneSameInstant(BookingService.SPA_ZONE).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        context.setVariable("ticketUrl",frontendUrl+"/ticket/"+b.bookingCode);
        String html=template.process("booking-email",context);
        MimeMessage message=sender.createMimeMessage(); MimeMessageHelper helper=new MimeMessageHelper(message,true,"UTF-8");
        helper.setFrom(from); helper.setTo(b.customerEmailSnapshot); helper.setSubject(type.equals("RESCHEDULED")?"Lunara: lịch hẹn đã đổi":"Lunara: xác nhận lịch hẹn"); helper.setText(html,true);
        String ics="BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Lunara//Booking//VI\r\nMETHOD:REQUEST\r\nBEGIN:VEVENT\r\nUID:"+b.bookingCode+"@lunara.local\r\nSEQUENCE:"+(type.equals("RESCHEDULED")?1:0)+"\r\nDTSTAMP:"+icsTime(LocalDateTime.now(java.time.Clock.systemUTC()))+"\r\nDTSTART:"+icsTime(b.bookingStart)+"\r\nDTEND:"+icsTime(b.bookingEnd)+"\r\nSUMMARY:Lunara Spa - "+b.bookingCode+"\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
        helper.addAttachment("lunara-"+b.bookingCode+".ics",new org.springframework.core.io.ByteArrayResource(ics.getBytes(java.nio.charset.StandardCharsets.UTF_8)),"text/calendar");
        sender.send(message);
        em.createNativeQuery("INSERT INTO email_deliveries(outbox_id,delivered_at) VALUES(:id,UTC_TIMESTAMP(6))").setParameter("id",outboxId).executeUpdate();
    }
    private String icsTime(LocalDateTime utc) { return utc.format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")); }
}
