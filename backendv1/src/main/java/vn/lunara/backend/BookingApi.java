package vn.lunara.backend;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

record BookingLineInput(@NotNull Long serviceId,@Min(0) int additionalDurationSteps) { }
record CreateBookingInput(@NotBlank String customerName,String customerPhone,String customerNote,@NotNull OffsetDateTime bookingStart,Long staffAccountId,@NotEmpty List<@Valid BookingLineInput> items) { }
record AvailabilityInput(@NotNull OffsetDateTime bookingStart,@NotEmpty List<@Valid BookingLineInput> items) { }
record RescheduleInput(@NotNull OffsetDateTime bookingStart,Long staffAccountId,String staffNote) { }
record RequestRescheduleInput(@NotBlank String reason) { }
record FeedbackInput(@Min(1) @Max(5) int rating,String comment) { }
record RescheduleDecisionInput(String staffNote) { }
record RescheduleRequestView(String id,String bookingCode,String customerName,String reason,String status,String staffNote,OffsetDateTime createdAt) { }
record BookingLineView(String serviceId,String serviceNameSnapshot,int durationMinutes,BigDecimal lineAmount) { }
record BookingView(String id,String bookingCode,String customerAccountId,String staffAccountId,String status,String assignmentSource,String customerNameSnapshot,String customerEmailSnapshot,String customerPhoneSnapshot,OffsetDateTime bookingStart,OffsetDateTime bookingEnd,OffsetDateTime holdExpiresAt,OffsetDateTime serverNow,int totalDurationMinutes,BigDecimal totalAmount,String qrImageUrl,String bank,String bankAccount,String paymentMemo,String paymentStatus,List<BookingLineView> items) { }

@Service class BookingService {
    static final ZoneId SPA_ZONE=ZoneId.of("Asia/Ho_Chi_Minh");
    private final EntityManager em;
    private final EventService events;
    @Value("${app.sepay.bank}") String bank;
    @Value("${app.sepay.account}") String bankAccount;
    BookingService(EntityManager em,EventService events) { this.em=em; this.events=events; }
    record Quote(List<BookingItem> items,int minutes,BigDecimal amount,int prep,int cleanup) { }
    private Quote quote(List<BookingLineInput> inputs) {
        if (inputs==null || inputs.isEmpty() || inputs.size()>10) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"1-10 services required");
        Set<Long> unique=new HashSet<>(); List<BookingItem> items=new ArrayList<>(); int minutes=0,prep=0,cleanup=0; BigDecimal amount=BigDecimal.ZERO;
        for (var input:inputs) {
            if (input.serviceId()==null || !unique.add(input.serviceId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Duplicate service");
            ServiceItem service=em.find(ServiceItem.class,input.serviceId());
            if (service==null || !service.active) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Inactive service");
            int steps=input.additionalDurationSteps();
            if (steps<0 || steps>10 || (steps>0 && !service.durationAdjustable)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid duration steps");
            BookingItem item=new BookingItem(); item.serviceId=service.id; item.serviceNameSnapshot=service.name;
            item.additionalDurationSteps=steps; item.basePriceSnapshot=service.basePrice;
            item.pricePerStepSnapshot=service.durationAdjustable?service.pricePerDurationStep:BigDecimal.ZERO;
            item.durationMinutes=service.minimumDurationMinutes+steps*(service.durationAdjustable?service.durationStepMinutes:0);
            item.lineAmount=service.basePrice.add(item.pricePerStepSnapshot.multiply(BigDecimal.valueOf(steps)));
            items.add(item); minutes+=item.durationMinutes; amount=amount.add(item.lineAmount);
            prep=Math.max(prep,service.preparationBufferMinutes); cleanup=Math.max(cleanup,service.cleanupBufferMinutes);
        }
        return new Quote(items,minutes,amount,prep,cleanup);
    }
    private LocalDateTime utc(OffsetDateTime value) { return LocalDateTime.ofInstant(value.toInstant(),ZoneOffset.UTC); }
    private OffsetDateTime offset(LocalDateTime value) { return value==null?null:value.atOffset(ZoneOffset.UTC); }
    private boolean eligible(Long staffId,Set<Long> services) { return candidates(services,staffId).contains(staffId); }
    private List<Long> candidates(Set<Long> services,Long chosen) {
        List<Long> ids=em.createNativeQuery("SELECT sp.account_id FROM staff_profiles sp JOIN accounts a ON a.id=sp.account_id JOIN staff_services ss ON ss.staff_account_id=sp.account_id WHERE sp.is_bookable=1 AND a.is_active=1 AND ss.service_id IN (:services) GROUP BY sp.account_id HAVING COUNT(DISTINCT ss.service_id)=:need ORDER BY sp.account_id")
            .setParameter("services",services).setParameter("need",services.size()).getResultList().stream().map(v -> ((Number)v).longValue()).toList();
        if (chosen!=null) return ids.contains(chosen)?List.of(chosen):List.of();
        return ids.stream().sorted(Comparator.comparingLong(this::load).thenComparingLong(Long::longValue)).toList();
    }
    private long load(Long staffId) {
        Number n=(Number)em.createNativeQuery("SELECT COUNT(*) FROM bookings WHERE staff_account_id=:id AND status IN ('PENDING_PAYMENT','PENDING','CONFIRMED','CHECKED_IN','IN_SERVICE') AND booking_start >= UTC_TIMESTAMP(6)")
            .setParameter("id",staffId).getSingleResult(); return n.longValue();
    }
    private boolean free(Long staffId,LocalDateTime occupiedStart,LocalDateTime occupiedEnd,Long exceptBookingId) {
        ZonedDateTime localStart=occupiedStart.atZone(ZoneOffset.UTC).withZoneSameInstant(SPA_ZONE);
        ZonedDateTime localEnd=occupiedEnd.atZone(ZoneOffset.UTC).withZoneSameInstant(SPA_ZONE);
        if (!localStart.toLocalDate().equals(localEnd.toLocalDate())) return false;
        List<StaffHours> hours=em.createQuery("select h from StaffHours h where h.staffAccountId=:staff and h.dayOfWeek=:day and h.active=true",StaffHours.class)
            .setParameter("staff",staffId).setParameter("day",(byte)localStart.getDayOfWeek().getValue()).getResultList();
        boolean working=hours.stream().anyMatch(h -> !localStart.toLocalTime().isBefore(h.startTime) && !localEnd.toLocalTime().isAfter(h.endTime));
        if (!working) return false;
        Long off=em.createQuery("select count(t) from StaffTimeOff t where t.staffAccountId=:staff and t.startAt<:end and t.endAt>:start",Long.class)
            .setParameter("staff",staffId).setParameter("start",occupiedStart).setParameter("end",occupiedEnd).getSingleResult();
        if (off>0) return false;
        String hql="select count(b) from Booking b where b.staffAccountId=:staff and b.status in :statuses and b.occupiedStart<:end and b.occupiedEnd>:start"+(exceptBookingId==null?"":" and b.id<>:except");
        var overlapQuery=em.createQuery(hql,Long.class)
            .setParameter("staff",staffId).setParameter("statuses",List.of(BookingStatus.PENDING_PAYMENT,BookingStatus.PENDING,BookingStatus.CONFIRMED,BookingStatus.CHECKED_IN,BookingStatus.IN_SERVICE))
            .setParameter("start",occupiedStart).setParameter("end",occupiedEnd);
        if (exceptBookingId!=null) overlapQuery.setParameter("except",exceptBookingId);
        Long overlap=overlapQuery.getSingleResult();
        return overlap==0;
    }
    @Transactional(readOnly=true) Map<String,Object> availability(AvailabilityInput input) {
        Quote q=quote(input.items()); LocalDateTime start=utc(input.bookingStart());
        if (start.isBefore(LocalDateTime.now(java.time.Clock.systemUTC()).plusMinutes(30)) || start.isAfter(LocalDateTime.now(java.time.Clock.systemUTC()).plusDays(90))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Booking must be 30 minutes to 90 days ahead");
        LocalDateTime occupiedStart=start.minusMinutes(q.prep()), occupiedEnd=start.plusMinutes(q.minutes()+q.cleanup());
        List<Long> staff=candidates(q.items().stream().map(i->i.serviceId).collect(java.util.stream.Collectors.toSet()),null).stream().filter(id->free(id,occupiedStart,occupiedEnd,null)).toList();
        return Map.of("available",!staff.isEmpty(),"staffAccountIds",staff.stream().map(String::valueOf).toList(),"durationMinutes",q.minutes(),"totalAmount",q.amount());
    }
    @Transactional BookingView create(Long accountId,String key,CreateBookingInput input) {
        if (key==null || key.isBlank() || key.length()>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Idempotency-Key required");
        Account account=em.find(Account.class,accountId,LockModeType.PESSIMISTIC_WRITE);
        if (account==null || !account.active || !account.role.code.equals("CUSTOMER")) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Customer booking only");
        List<Number> previous=em.createNativeQuery("SELECT booking_id FROM idempotency_keys WHERE account_id=:account AND request_key=:key")
            .setParameter("account",accountId).setParameter("key",key).getResultList();
        if (!previous.isEmpty()) return view(em.find(Booking.class,previous.get(0).longValue()));
        Quote q=quote(input.items()); LocalDateTime start=utc(input.bookingStart()); LocalDateTime now=LocalDateTime.now(java.time.Clock.systemUTC());
        if (start.isBefore(now.plusMinutes(30)) || start.isAfter(now.plusDays(90))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Booking must be 30 minutes to 90 days ahead");
        LocalDateTime occupiedStart=start.minusMinutes(q.prep()), occupiedEnd=start.plusMinutes(q.minutes()+q.cleanup());
        Set<Long> skillIds=q.items().stream().map(i->i.serviceId).collect(java.util.stream.Collectors.toSet());
        Long staff=null;
        for (Long candidate:candidates(skillIds,input.staffAccountId())) {
            em.find(StaffProfile.class,candidate,LockModeType.PESSIMISTIC_WRITE);
            if (eligible(candidate,skillIds) && free(candidate,occupiedStart,occupiedEnd,null)) { staff=candidate; break; }
        }
        if (staff==null) throw new ResponseStatusException(HttpStatus.CONFLICT,"Slot no longer available");
        Booking b=new Booking(); b.bookingCode="LNR"+UUID.randomUUID().toString().replace("-","").substring(0,10).toUpperCase(Locale.ROOT);
        b.customerAccountId=accountId; b.staffAccountId=staff; b.assignmentSource=input.staffAccountId()==null?AssignmentSource.SYSTEM:AssignmentSource.CUSTOMER;
        b.customerNameSnapshot=input.customerName().trim(); b.customerEmailSnapshot=account.email; b.customerPhoneSnapshot=input.customerPhone(); b.customerNote=input.customerNote();
        b.bookingStart=start; b.bookingEnd=start.plusMinutes(q.minutes()); b.occupiedStart=occupiedStart; b.occupiedEnd=occupiedEnd;
        b.holdExpiresAt=now.plusMinutes(15); b.totalDurationMinutes=q.minutes(); b.totalAmount=q.amount(); b.createdByAccountId=accountId;
        em.persist(b); em.flush();
        for (BookingItem item:q.items()) { item.bookingId=b.id; em.persist(item); }
        Payment p=new Payment(); p.bookingId=b.id; p.transactionCode=b.bookingCode; p.amount=q.amount(); p.qrPayload=qrUrl(b.bookingCode,q.amount()); em.persist(p);
        em.createNativeQuery("INSERT INTO idempotency_keys(account_id,request_key,booking_id) VALUES(:account,:key,:booking)")
            .setParameter("account",accountId).setParameter("key",key).setParameter("booking",b.id).executeUpdate();
        events.booking(b,"CREATED",accountId,"Booking created and slot held");
        return view(b);
    }
    private String qrUrl(String code,BigDecimal amount) {
        return "https://vietqr.app/img?acc="+enc(bankAccount)+"&bank="+enc(bank)+"&amount="+amount.toBigInteger()+"&des="+enc(code)+"&template=compact";
    }
    private String enc(String value) { return URLEncoder.encode(value,StandardCharsets.UTF_8); }
    @Transactional(readOnly=true) BookingView get(String code,Long actor) {
        Booking b=byCode(code); Account account=em.find(Account.class,actor);
        boolean staff=account!=null && !account.role.code.equals("CUSTOMER");
        if (b.customerAccountId.equals(actor) || (staff && can("BOOKINGS_READ") && (!account.role.code.equals("THERAPIST") || b.staffAccountId.equals(actor)))) return view(b);
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    @Transactional(readOnly=true) List<BookingView> mine(Long actor) {
        return em.createQuery("select b from Booking b where b.customerAccountId=:id order by b.bookingStart desc",Booking.class).setParameter("id",actor).setMaxResults(100).getResultList().stream().map(this::view).toList();
    }
    Booking byCode(String code) {
        var list=em.createQuery("select b from Booking b where b.bookingCode=:code",Booking.class).setParameter("code",code).getResultList();
        if (list.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Booking not found"); return list.get(0);
    }
    BookingView view(Booking b) {
        Payment p=em.createQuery("select p from Payment p where p.bookingId=:id",Payment.class).setParameter("id",b.id).getSingleResult();
        List<BookingLineView> items=em.createQuery("select i from BookingItem i where i.bookingId=:id order by i.id",BookingItem.class).setParameter("id",b.id).getResultList().stream()
            .map(i->new BookingLineView(i.serviceId.toString(),i.serviceNameSnapshot,i.durationMinutes,i.lineAmount)).toList();
        return new BookingView(b.id.toString(),b.bookingCode,b.customerAccountId.toString(),b.staffAccountId.toString(),b.status.name(),b.assignmentSource.name(),b.customerNameSnapshot,b.customerEmailSnapshot,b.customerPhoneSnapshot,offset(b.bookingStart),offset(b.bookingEnd),offset(b.holdExpiresAt),OffsetDateTime.now(ZoneOffset.UTC),b.totalDurationMinutes,b.totalAmount,p.qrPayload,bank,bankAccount,b.bookingCode,p.status.name(),items);
    }
    @Transactional void expireDue() {
        List<Booking> expired=em.createQuery("select b from Booking b where b.status=:status and b.holdExpiresAt<=:now order by b.holdExpiresAt",Booking.class)
            .setParameter("status",BookingStatus.PENDING_PAYMENT).setParameter("now",LocalDateTime.now(java.time.Clock.systemUTC())).setMaxResults(100).getResultList();
        for (Booking b:expired) {
            em.lock(b,LockModeType.PESSIMISTIC_WRITE);
            if (b.status==BookingStatus.PENDING_PAYMENT && !b.holdExpiresAt.isAfter(LocalDateTime.now(java.time.Clock.systemUTC()))) { b.status=BookingStatus.EXPIRED; events.booking(b,"EXPIRED",null,"Payment hold expired"); }
        }
    }
    @Transactional Map<String,Object> requestChange(String code,Long actor,RequestRescheduleInput input) {
        Booking b=byCode(code); em.lock(b,LockModeType.PESSIMISTIC_WRITE);
        if (!b.customerAccountId.equals(actor)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (b.status!=BookingStatus.CONFIRMED || !b.bookingStart.isAfter(LocalDateTime.now(java.time.Clock.systemUTC()).plusHours(5))) throw new ResponseStatusException(HttpStatus.CONFLICT,"Request must be at least five hours before confirmed appointment");
        Long open=em.createQuery("select count(r) from RescheduleRequest r where r.bookingId=:id and r.status in ('REQUESTED','CONTACTED')",Long.class).setParameter("id",b.id).getSingleResult();
        if (open>0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Open request already exists");
        RescheduleRequest r=new RescheduleRequest(); r.bookingId=b.id; r.customerAccountId=actor; r.reason=input.reason().trim(); em.persist(r);
        events.booking(b,"RESCHEDULE_REQUESTED",actor,"Customer requested reschedule"); em.flush(); return Map.of("id",r.id.toString(),"bookingCode",b.bookingCode,"reason",r.reason,"status",r.status);
    }
    @Transactional(readOnly=true) List<RescheduleRequestView> requests() {
        if (!can("BOOKINGS_RESCHEDULE")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return em.createQuery("select r from RescheduleRequest r where r.status in ('REQUESTED','CONTACTED') order by r.createdAt",RescheduleRequest.class).setMaxResults(100).getResultList().stream().map(r -> {
            Booking b=em.find(Booking.class,r.bookingId);
            return new RescheduleRequestView(r.id.toString(),b.bookingCode,b.customerNameSnapshot,r.reason,r.status,r.staffNote,offset(r.createdAt));
        }).toList();
    }
    @Transactional RescheduleRequestView decideRequest(Long id,Long actor,String decision,RescheduleDecisionInput input) {
        if (!can("BOOKINGS_RESCHEDULE")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (!List.of("CONTACTED","DECLINED").contains(decision)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        RescheduleRequest r=em.find(RescheduleRequest.class,id,LockModeType.PESSIMISTIC_WRITE);
        if (r==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (!List.of("REQUESTED","CONTACTED").contains(r.status)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Request already closed");
        r.status=decision; r.staffAccountId=actor; r.staffNote=input.staffNote();
        if (decision.equals("DECLINED")) r.resolvedAt=LocalDateTime.now(java.time.Clock.systemUTC());
        Booking b=em.find(Booking.class,r.bookingId); events.booking(b,"RESCHEDULE_"+decision,actor,"Staff updated reschedule request");
        return new RescheduleRequestView(r.id.toString(),b.bookingCode,b.customerNameSnapshot,r.reason,r.status,r.staffNote,offset(r.createdAt));
    }
    @Transactional BookingView change(String code,Long actor,RescheduleInput input) {
        if (!can("BOOKINGS_RESCHEDULE")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Booking b=byCode(code); em.lock(b,LockModeType.PESSIMISTIC_WRITE);
        if (b.status!=BookingStatus.CONFIRMED) throw new ResponseStatusException(HttpStatus.CONFLICT,"Cannot reschedule after check-in");
        LocalDateTime start=utc(input.bookingStart()); if (!start.isAfter(LocalDateTime.now(java.time.Clock.systemUTC()))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"New time must be in future");
        long prep=Duration.between(b.occupiedStart,b.bookingStart).toMinutes(), cleanup=Duration.between(b.bookingEnd,b.occupiedEnd).toMinutes();
        LocalDateTime occupiedStart=start.minusMinutes(prep), occupiedEnd=start.plusMinutes(b.totalDurationMinutes+cleanup);
        Set<Long> services=em.createQuery("select i.serviceId from BookingItem i where i.bookingId=:id",Long.class).setParameter("id",b.id).getResultList().stream().collect(java.util.stream.Collectors.toSet());
        Long newStaff=input.staffAccountId()==null?b.staffAccountId:input.staffAccountId();
        if (!candidates(services,newStaff).contains(newStaff)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Staff lacks required services");
        em.find(StaffProfile.class,newStaff,LockModeType.PESSIMISTIC_WRITE);
        if (!eligible(newStaff,services) || !free(newStaff,occupiedStart,occupiedEnd,b.id)) throw new ResponseStatusException(HttpStatus.CONFLICT,"New slot unavailable");
        b.staffAccountId=newStaff; b.bookingStart=start; b.bookingEnd=start.plusMinutes(b.totalDurationMinutes); b.occupiedStart=occupiedStart; b.occupiedEnd=occupiedEnd; b.assignmentSource=AssignmentSource.ADMIN;
        List<RescheduleRequest> open=em.createQuery("select r from RescheduleRequest r where r.bookingId=:id and r.status in ('REQUESTED','CONTACTED')",RescheduleRequest.class).setParameter("id",b.id).getResultList();
        for (RescheduleRequest r:open) { r.status="RESOLVED"; r.staffAccountId=actor; r.staffNote=input.staffNote(); r.resolvedAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
        events.booking(b,"RESCHEDULED",actor,"Staff rescheduled after customer contact"); return view(b);
    }
    @Transactional BookingView transition(String code,Long actor,String action) {
        Booking b=byCode(code); em.lock(b,LockModeType.PESSIMISTIC_WRITE);
        BookingStatus next;
        switch(action) {
            case "check-in" -> { if (!can("BOOKINGS_CHECKIN") || b.status!=BookingStatus.CONFIRMED) throw new ResponseStatusException(HttpStatus.CONFLICT); next=BookingStatus.CHECKED_IN; b.checkedInAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
            case "start" -> { if (!can("BOOKINGS_SERVICE") || !b.staffAccountId.equals(actor) || b.status!=BookingStatus.CHECKED_IN) throw new ResponseStatusException(HttpStatus.CONFLICT); next=BookingStatus.IN_SERVICE; b.serviceStartedAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
            case "complete" -> { if (!can("BOOKINGS_SERVICE") || !b.staffAccountId.equals(actor) || b.status!=BookingStatus.IN_SERVICE) throw new ResponseStatusException(HttpStatus.CONFLICT); next=BookingStatus.COMPLETED; b.completedAt=LocalDateTime.now(java.time.Clock.systemUTC()); }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        b.status=next; events.booking(b,next.name(),actor,next.name()); return view(b);
    }
    @Transactional Map<String,Object> feedback(String code,Long actor,FeedbackInput input) {
        Booking b=byCode(code);
        if (!b.customerAccountId.equals(actor)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (b.status!=BookingStatus.COMPLETED) throw new ResponseStatusException(HttpStatus.CONFLICT,"Booking not completed");
        Long count=em.createQuery("select count(f) from Feedback f where f.bookingId=:id",Long.class).setParameter("id",b.id).getSingleResult();
        if (count>0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Feedback already exists");
        Feedback f=new Feedback(); f.bookingId=b.id; f.rating=(byte)input.rating(); f.comment=input.comment(); em.persist(f); events.booking(b,"FEEDBACK",actor,"Customer feedback submitted"); em.flush(); return Map.of("id",f.id.toString(),"bookingCode",b.bookingCode,"rating",f.rating);
    }
    static boolean can(String permission) {
        var auth=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return auth!=null && auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals(permission));
    }
}

@RestController @RequestMapping("/api/v1") class BookingController {
    private final BookingService bookings;
    BookingController(BookingService bookings) { this.bookings=bookings; }
    @PostMapping("/availability") Map<String,Object> available(@Valid @RequestBody AvailabilityInput input) { return bookings.availability(input); }
    @PostMapping("/bookings") @ResponseStatus(HttpStatus.CREATED) BookingView create(@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody CreateBookingInput input) { return bookings.create(AuthService.actor(),key,input); }
    @GetMapping("/bookings/mine") List<BookingView> mine() { return bookings.mine(AuthService.actor()); }
    @GetMapping("/bookings/{code}") BookingView get(@PathVariable String code) { return bookings.get(code,AuthService.actor()); }
    @PostMapping("/bookings/{code}/reschedule-requests") @ResponseStatus(HttpStatus.CREATED) Map<String,Object> request(@PathVariable String code,@Valid @RequestBody RequestRescheduleInput input) { return bookings.requestChange(code,AuthService.actor(),input); }
    @GetMapping("/admin/reschedule-requests") List<RescheduleRequestView> requests() { return bookings.requests(); }
    @PostMapping("/admin/reschedule-requests/{id}/{decision:CONTACTED|DECLINED}") RescheduleRequestView decide(@PathVariable Long id,@PathVariable String decision,@RequestBody RescheduleDecisionInput input) { return bookings.decideRequest(id,AuthService.actor(),decision,input); }
    @PostMapping("/bookings/{code}/reschedule") BookingView change(@PathVariable String code,@Valid @RequestBody RescheduleInput input) { return bookings.change(code,AuthService.actor(),input); }
    @PostMapping("/bookings/{code}/{action:check-in|start|complete}") BookingView transition(@PathVariable String code,@PathVariable String action) { return bookings.transition(code,AuthService.actor(),action); }
    @PostMapping("/bookings/{code}/feedback") @ResponseStatus(HttpStatus.CREATED) Map<String,Object> feedback(@PathVariable String code,@Valid @RequestBody FeedbackInput input) { return bookings.feedback(code,AuthService.actor(),input); }
}

@org.springframework.stereotype.Component class HoldExpiryJob {
    private final BookingService service;
    HoldExpiryJob(BookingService service) { this.service=service; }
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay=1000) void expire() { service.expireDue(); }
}
