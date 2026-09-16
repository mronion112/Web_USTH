package vn.lunara.backend;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

record ServiceInput(@NotBlank String name,@NotBlank String category,String description,String imageUrl,@NotNull @DecimalMin("0") BigDecimal basePrice,@Min(1) int minimumDurationMinutes,boolean isDurationAdjustable,Integer durationStepMinutes,BigDecimal pricePerDurationStep,@Min(0) int preparationBufferMinutes,@Min(0) int cleanupBufferMinutes,int displayOrder,boolean isActive) { }
record ServiceView(String id,String name,String category,String description,String imageUrl,BigDecimal basePrice,int minimumDurationMinutes,boolean isDurationAdjustable,Integer durationStepMinutes,BigDecimal pricePerDurationStep,int preparationBufferMinutes,int cleanupBufferMinutes,int displayOrder,boolean isActive) { }
record StaffInput(@Email @NotBlank String email,@NotBlank String displayName,@NotBlank String employeeCode,@NotBlank String jobTitle,boolean isBookable,@NotEmpty Set<Long> serviceIds) { }
record HoursInput(@Min(1) @Max(7) int dayOfWeek,@NotNull LocalTime startTime,@NotNull LocalTime endTime) { }
record TimeOffInput(@NotNull OffsetDateTime startAt,@NotNull OffsetDateTime endAt,String reason) { }
record StaffView(String accountId,String email,String displayName,String employeeCode,String jobTitle,boolean isBookable,List<String> serviceIds) { }
record PublicStaffView(String accountId,String displayName,String jobTitle,boolean isBookable,List<String> serviceIds) { }

@Service class CatalogService {
    private final EntityManager em; private final StringRedisTemplate redis; private final ObjectMapper mapper;
    CatalogService(EntityManager em,StringRedisTemplate redis,ObjectMapper mapper) { this.em=em; this.redis=redis; this.mapper=mapper; }
    @Transactional(readOnly=true) List<ServiceView> services() {
        try { String cached=redis.opsForValue().get("catalog:services:v1"); if (cached!=null) return mapper.readValue(cached,new TypeReference<List<ServiceView>>(){}); } catch(Exception ignored) { }
        List<ServiceView> result=em.createQuery("select s from ServiceItem s where s.active=true order by s.displayOrder,s.id",ServiceItem.class).getResultList().stream().map(this::service).toList();
        try { redis.opsForValue().set("catalog:services:v1",mapper.writeValueAsString(result),5,TimeUnit.MINUTES); } catch(Exception ignored) { }
        return result;
    }
    @Transactional(readOnly=true) List<ServiceView> allServices() { require("SERVICES_WRITE"); return em.createQuery("select s from ServiceItem s order by s.displayOrder,s.id",ServiceItem.class).getResultList().stream().map(this::service).toList(); }
    private ServiceView service(ServiceItem s) { return new ServiceView(s.id.toString(),s.name,s.category,s.description,s.imageUrl,s.basePrice,s.minimumDurationMinutes,s.durationAdjustable,s.durationStepMinutes,s.pricePerDurationStep,s.preparationBufferMinutes,s.cleanupBufferMinutes,s.displayOrder,s.active); }
    @Transactional ServiceView saveService(Long id,ServiceInput input) {
        require("SERVICES_WRITE");
        if (input.isDurationAdjustable() != (input.durationStepMinutes()!=null && input.pricePerDurationStep()!=null) || (input.isDurationAdjustable() && (input.durationStepMinutes()<=0 || input.pricePerDurationStep().signum()<0))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid adjustable duration pricing");
        ServiceItem s=id==null?new ServiceItem():em.find(ServiceItem.class,id,LockModeType.PESSIMISTIC_WRITE); if (s==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        s.name=input.name().trim(); s.category=input.category().trim(); s.description=input.description(); s.imageUrl=input.imageUrl(); s.basePrice=input.basePrice(); s.minimumDurationMinutes=input.minimumDurationMinutes();
        s.durationAdjustable=input.isDurationAdjustable(); s.durationStepMinutes=input.durationStepMinutes(); s.pricePerDurationStep=input.pricePerDurationStep(); s.preparationBufferMinutes=input.preparationBufferMinutes(); s.cleanupBufferMinutes=input.cleanupBufferMinutes(); s.displayOrder=input.displayOrder(); s.active=input.isActive();
        if (id==null) { em.persist(s); em.flush(); }
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization() {
            @Override public void afterCommit() { try { redis.delete("catalog:services:v1"); } catch(Exception ignored) { } }
        });
        audit("SERVICE_UPSERT","SERVICE",s.id.toString(),s.name); return service(s);
    }
    @Transactional(readOnly=true) List<StaffView> staff() {
        require("STAFF_READ");
        return em.createQuery("select s from StaffProfile s order by s.accountId",StaffProfile.class).getResultList().stream().map(this::staffView).toList();
    }
    @Transactional(readOnly=true) List<PublicStaffView> publicStaff() {
        return em.createQuery("select s from StaffProfile s where s.bookable=true order by s.accountId",StaffProfile.class).getResultList().stream().map(s -> {
            StaffView v=staffView(s); return new PublicStaffView(v.accountId(),v.displayName(),v.jobTitle(),v.isBookable(),v.serviceIds());
        }).toList();
    }
    private StaffView staffView(StaffProfile s) {
        Account a=em.find(Account.class,s.accountId);
        List<String> skills=em.createNativeQuery("SELECT service_id FROM staff_services WHERE staff_account_id=:id").setParameter("id",s.accountId).getResultList().stream().map(String::valueOf).toList();
        return new StaffView(s.accountId.toString(),a.email,a.displayName,s.employeeCode,s.jobTitle,s.bookable,skills);
    }
    @Transactional StaffView createStaff(StaffInput input) {
        require("STAFF_WRITE");
        Role role=em.createQuery("select r from Role r where r.code='THERAPIST'",Role.class).getSingleResult();
        String email=input.email().toLowerCase(Locale.ROOT);
        if (!em.createQuery("select a from Account a where a.email=:email",Account.class).setParameter("email",email).getResultList().isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Email already exists");
        Account a=new Account(); a.email=email; a.displayName=input.displayName(); a.role=role; a.provisionedByAccountId=AuthService.actor(); em.persist(a); em.flush();
        StaffProfile s=new StaffProfile(); s.accountId=a.id; s.employeeCode=input.employeeCode(); s.jobTitle=input.jobTitle(); s.bookable=input.isBookable(); em.persist(s);
        replaceSkills(a.id,input.serviceIds()); audit("STAFF_CREATE","ACCOUNT",a.id.toString(),email); return staffView(s);
    }
    @Transactional StaffView updateStaff(Long id,StaffInput input) {
        require("STAFF_WRITE"); StaffProfile s=em.find(StaffProfile.class,id,LockModeType.PESSIMISTIC_WRITE); if (s==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Account a=em.find(Account.class,id); s.employeeCode=input.employeeCode(); s.jobTitle=input.jobTitle(); s.bookable=input.isBookable(); a.displayName=input.displayName();
        replaceSkills(id,input.serviceIds()); audit("STAFF_UPDATE","ACCOUNT",id.toString(),a.email); return staffView(s);
    }
    private void replaceSkills(Long staffId,Set<Long> serviceIds) {
        if (serviceIds.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Staff needs at least one service");
        em.createNativeQuery("DELETE FROM staff_services WHERE staff_account_id=:id").setParameter("id",staffId).executeUpdate();
        for(Long serviceId:serviceIds) {
            if (em.find(ServiceItem.class,serviceId)==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown service");
            em.createNativeQuery("INSERT INTO staff_services(staff_account_id,service_id) VALUES(:staff,:service)").setParameter("staff",staffId).setParameter("service",serviceId).executeUpdate();
        }
    }
    @Transactional List<Map<String,Object>> hours(Long staffId) {
        require("STAFF_READ"); return em.createQuery("select h from StaffHours h where h.staffAccountId=:id order by h.dayOfWeek,h.startTime",StaffHours.class).setParameter("id",staffId).getResultList().stream()
            .map(h -> Map.<String,Object>of("id",h.id,"dayOfWeek",h.dayOfWeek,"startTime",h.startTime.toString(),"endTime",h.endTime.toString(),"isActive",h.active)).toList();
    }
    @Transactional void addHours(Long staffId,HoursInput input) {
        require("STAFF_WRITE"); if (!input.startTime().isBefore(input.endTime())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid hours range");
        if (em.find(StaffProfile.class,staffId)==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        StaffHours h=new StaffHours(); h.staffAccountId=staffId; h.dayOfWeek=(byte)input.dayOfWeek(); h.startTime=input.startTime(); h.endTime=input.endTime(); em.persist(h); audit("STAFF_HOURS_ADD","ACCOUNT",staffId.toString(),input.toString());
    }
    @Transactional void addTimeOff(Long staffId,TimeOffInput input) {
        require("STAFF_WRITE"); if (!input.startAt().isBefore(input.endAt())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid time-off range");
        StaffProfile s=em.find(StaffProfile.class,staffId,LockModeType.PESSIMISTIC_WRITE); if (s==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        LocalDateTime start=LocalDateTime.ofInstant(input.startAt().toInstant(),ZoneOffset.UTC),end=LocalDateTime.ofInstant(input.endAt().toInstant(),ZoneOffset.UTC);
        Long overlapping=em.createQuery("select count(b) from Booking b where b.staffAccountId=:id and b.status in :statuses and b.occupiedStart<:end and b.occupiedEnd>:start",Long.class)
            .setParameter("id",staffId).setParameter("statuses",List.of(BookingStatus.PENDING_PAYMENT,BookingStatus.CONFIRMED,BookingStatus.CHECKED_IN,BookingStatus.IN_SERVICE))
            .setParameter("start",start).setParameter("end",end).getSingleResult();
        if (overlapping>0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Time off conflicts with booking");
        StaffTimeOff t=new StaffTimeOff(); t.staffAccountId=staffId; t.startAt=start; t.endAt=end; t.reason=input.reason(); em.persist(t); audit("STAFF_TIME_OFF","ACCOUNT",staffId.toString(),input.toString());
    }
    void audit(String action,String targetType,String targetId,String details) { AuditLog log=new AuditLog(); log.actorAccountId=AuthService.actor(); log.action=action; log.targetType=targetType; log.targetId=targetId; log.details=details; em.persist(log); }
    static void require(String code) { if (!BookingService.can(code)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Missing "+code); }
}

@RestController @RequestMapping("/api/v1") class CatalogController {
    private final CatalogService catalog;
    CatalogController(CatalogService catalog) { this.catalog=catalog; }
    @GetMapping("/services") List<ServiceView> services() { return catalog.services(); }
    @GetMapping("/staff") List<PublicStaffView> publicStaff() { return catalog.publicStaff(); }
    @GetMapping("/admin/services") List<ServiceView> allServices() { return catalog.allServices(); }
    @PostMapping("/admin/services") @ResponseStatus(HttpStatus.CREATED) ServiceView createService(@Valid @RequestBody ServiceInput input) { return catalog.saveService(null,input); }
    @PutMapping("/admin/services/{id}") ServiceView updateService(@PathVariable Long id,@Valid @RequestBody ServiceInput input) { return catalog.saveService(id,input); }
    @GetMapping("/admin/staff") List<StaffView> staff() { return catalog.staff(); }
    @PostMapping("/admin/staff") @ResponseStatus(HttpStatus.CREATED) StaffView createStaff(@Valid @RequestBody StaffInput input) { return catalog.createStaff(input); }
    @PutMapping("/admin/staff/{id}") StaffView updateStaff(@PathVariable Long id,@Valid @RequestBody StaffInput input) { return catalog.updateStaff(id,input); }
    @GetMapping("/admin/staff/{id}/hours") List<Map<String,Object>> hours(@PathVariable Long id) { return catalog.hours(id); }
    @PostMapping("/admin/staff/{id}/hours") Map<String,Boolean> addHours(@PathVariable Long id,@Valid @RequestBody HoursInput input) { catalog.addHours(id,input); return Map.of("success",true); }
    @PostMapping("/admin/staff/{id}/time-off") Map<String,Boolean> addTimeOff(@PathVariable Long id,@Valid @RequestBody TimeOffInput input) { catalog.addTimeOff(id,input); return Map.of("success",true); }
}
