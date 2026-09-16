package vn.lunara.backend;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

record AccountInput(@Email @NotBlank String email,@NotBlank String displayName,@NotBlank String roleCode) { }
record AccountRoleInput(@NotBlank String roleCode) { }
record CustomerInput(String phone,String preferences,String internalNotes) { }
record RolePermissionsInput(@NotNull Set<String> permissionCodes) { }
record AccountView(String id,String email,String displayName,String roleCode,boolean isActive,String googleBound) { }
record CustomerView(String accountId,String email,String displayName,String phone,String preferences,String internalNotes,long bookingsCount,BigDecimal totalSpent) { }
record PaymentView(String id,String bookingCode,String status,String method,BigDecimal amount,OffsetDateTime paidAt) { }

@Service class AdminService {
    private final EntityManager em; private final BookingService bookingService; private final CatalogService catalog;
    AdminService(EntityManager em,BookingService bookingService,CatalogService catalog) { this.em=em; this.bookingService=bookingService; this.catalog=catalog; }
    private void owner() {
        Account actor=em.find(Account.class,AuthService.actor());
        if (actor==null || !actor.role.code.equals("OWNER")) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Owner only");
    }
    @Transactional(readOnly=true) List<AccountView> accounts() {
        owner(); return em.createQuery("select a from Account a order by a.id",Account.class).setMaxResults(500).getResultList().stream().map(this::account).toList();
    }
    private AccountView account(Account a) { return new AccountView(a.id.toString(),a.email,a.displayName,a.role.code,a.active,a.googleSubject==null?"PENDING":"BOUND"); }
    @Transactional AccountView provision(AccountInput input) {
        owner(); Role role=role(input.roleCode());
        if (role.code.equals("THERAPIST")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Use staff endpoint for therapist");
        String email=input.email().toLowerCase(Locale.ROOT);
        if (!em.createQuery("select a from Account a where a.email=:email",Account.class).setParameter("email",email).getResultList().isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Email already exists");
        Account a=new Account(); a.email=email; a.displayName=input.displayName(); a.role=role; a.provisionedByAccountId=AuthService.actor(); em.persist(a); em.flush();
        if (role.code.equals("CUSTOMER")) { CustomerProfile p=new CustomerProfile(); p.accountId=a.id; em.persist(p); }
        catalog.audit("ACCOUNT_PROVISION","ACCOUNT",a.id.toString(),role.code); return account(a);
    }
    @Transactional AccountView roleChange(Long id,AccountRoleInput input) {
        owner(); Account a=em.find(Account.class,id,LockModeType.PESSIMISTIC_WRITE); if (a==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Role next=role(input.roleCode());
        if (a.id.equals(AuthService.actor()) && !next.code.equals("OWNER")) throw new ResponseStatusException(HttpStatus.CONFLICT,"Owner cannot demote self");
        if (next.code.equals("THERAPIST") && em.find(StaffProfile.class,id)==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Staff profile required");
        if (!next.code.equals("THERAPIST") && em.find(StaffProfile.class,id)!=null) throw new ResponseStatusException(HttpStatus.CONFLICT,"Staff account cannot change role while profile exists");
        if (next.code.equals("CUSTOMER") && em.find(CustomerProfile.class,id)==null) { CustomerProfile p=new CustomerProfile(); p.accountId=id; em.persist(p); }
        a.role=next; catalog.audit("ACCOUNT_ROLE","ACCOUNT",id.toString(),next.code); return account(a);
    }
    @Transactional AccountView active(Long id,boolean active) {
        owner(); Account a=em.find(Account.class,id,LockModeType.PESSIMISTIC_WRITE); if (a==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (a.id.equals(AuthService.actor()) && !active) throw new ResponseStatusException(HttpStatus.CONFLICT,"Owner cannot deactivate self");
        if (!active && em.find(StaffProfile.class,id)!=null) {
            Number future=(Number)em.createNativeQuery("SELECT COUNT(*) FROM bookings WHERE staff_account_id=:id AND status IN ('PENDING_PAYMENT','CONFIRMED','CHECKED_IN','IN_SERVICE') AND occupied_end>UTC_TIMESTAMP(6)").setParameter("id",id).getSingleResult();
            if (future.longValue()>0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Reassign future staff bookings before deactivation");
        }
        a.active=active; if (!active) em.createNativeQuery("UPDATE refresh_sessions SET revoked_at=UTC_TIMESTAMP(6) WHERE account_id=:id AND revoked_at IS NULL").setParameter("id",id).executeUpdate();
        catalog.audit("ACCOUNT_ACTIVE","ACCOUNT",id.toString(),String.valueOf(active)); return account(a);
    }
    private Role role(String code) { var result=em.createQuery("select r from Role r where r.code=:code",Role.class).setParameter("code",code).getResultList(); if (result.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown role"); return result.get(0); }
    @Transactional(readOnly=true) List<Map<String,Object>> matrix() {
        owner(); List<Permission> all=em.createQuery("select p from Permission p order by p.module,p.code",Permission.class).getResultList();
        return em.createQuery("select r from Role r order by r.id",Role.class).getResultList().stream().map(r -> Map.<String,Object>of("roleCode",r.code,"availablePermissions",all.stream().map(p->p.code).toList(),"permissionCodes",permissions(r.id))).toList();
    }
    private List<String> permissions(Byte roleId) { return em.createNativeQuery("SELECT p.code FROM permissions p JOIN role_permissions rp ON p.id=rp.permission_id WHERE rp.role_id=:id ORDER BY p.code")
        .setParameter("id",roleId).getResultList().stream().map(String::valueOf).toList(); }
    @Transactional Map<String,Object> replacePermissions(String code,RolePermissionsInput input) {
        owner(); Role role=role(code); if (role.code.equals("OWNER") && !input.permissionCodes().contains("RBAC_MANAGE")) throw new ResponseStatusException(HttpStatus.CONFLICT,"Owner must retain RBAC_MANAGE");
        List<Permission> chosen=em.createQuery("select p from Permission p where p.code in :codes",Permission.class).setParameter("codes",input.permissionCodes().isEmpty()?Set.of("__NONE__"):input.permissionCodes()).getResultList();
        if (chosen.size()!=input.permissionCodes().size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown permission");
        em.createNativeQuery("DELETE FROM role_permissions WHERE role_id=:id").setParameter("id",role.id).executeUpdate();
        for(Permission p:chosen) em.createNativeQuery("INSERT INTO role_permissions(role_id,permission_id) VALUES(:role,:permission)").setParameter("role",role.id).setParameter("permission",p.id).executeUpdate();
        catalog.audit("RBAC_UPDATE","ROLE",role.code,String.join(",",input.permissionCodes())); return Map.of("roleCode",role.code,"permissionCodes",permissions(role.id));
    }
    @Transactional(readOnly=true) List<CustomerView> customers() {
        CatalogService.require("CUSTOMERS_READ");
        return em.createQuery("select c from CustomerProfile c order by c.accountId",CustomerProfile.class).setMaxResults(500).getResultList().stream().map(this::customer).toList();
    }
    private CustomerView customer(CustomerProfile c) {
        Account a=em.find(Account.class,c.accountId);
        Number count=(Number)em.createNativeQuery("SELECT COUNT(*) FROM bookings WHERE customer_account_id=:id").setParameter("id",c.accountId).getSingleResult();
        BigDecimal spent=(BigDecimal)em.createNativeQuery("SELECT COALESCE(SUM(p.amount),0) FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.customer_account_id=:id AND p.status='PAID'").setParameter("id",c.accountId).getSingleResult();
        return new CustomerView(c.accountId.toString(),a.email,a.displayName,c.phone,c.preferences,c.internalNotes,count.longValue(),spent);
    }
    @Transactional CustomerView updateCustomer(Long id,CustomerInput input) {
        CatalogService.require("CUSTOMERS_WRITE"); CustomerProfile c=em.find(CustomerProfile.class,id,LockModeType.PESSIMISTIC_WRITE); if (c==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        c.phone=input.phone(); c.preferences=input.preferences(); c.internalNotes=input.internalNotes(); c.updatedAt=LocalDateTime.now(java.time.Clock.systemUTC());
        catalog.audit("CUSTOMER_UPDATE","ACCOUNT",id.toString(),"Profile updated"); return customer(c);
    }
    @Transactional(readOnly=true) List<BookingView> bookings(LocalDate date) {
        CatalogService.require("BOOKINGS_READ");
        LocalDateTime from=date==null?LocalDateTime.now(java.time.Clock.systemUTC()).minusDays(30):LocalDateTime.ofInstant(date.atStartOfDay(BookingService.SPA_ZONE).toInstant(),ZoneOffset.UTC);
        LocalDateTime to=date==null?LocalDateTime.now(java.time.Clock.systemUTC()).plusDays(90):LocalDateTime.ofInstant(date.plusDays(1).atStartOfDay(BookingService.SPA_ZONE).toInstant(),ZoneOffset.UTC);
        Account actor=em.find(Account.class,AuthService.actor());
        var query=em.createQuery("select b from Booking b where b.bookingStart>=:from and b.bookingStart<:to order by b.bookingStart",Booking.class).setParameter("from",from).setParameter("to",to).setMaxResults(500);
        return query.getResultList().stream().filter(b -> !actor.role.code.equals("THERAPIST") || b.staffAccountId.equals(actor.id)).map(bookingService::view).toList();
    }
    @Transactional(readOnly=true) List<PaymentView> payments() {
        CatalogService.require("PAYMENTS_READ");
        return em.createQuery("select p from Payment p order by p.createdAt desc",Payment.class).setMaxResults(500).getResultList().stream().map(p -> {
            Booking b=em.find(Booking.class,p.bookingId); return new PaymentView(p.id.toString(),b.bookingCode,p.status.name(),p.method,p.amount,p.paidAt==null?null:p.paidAt.atOffset(ZoneOffset.UTC));
        }).toList();
    }
    @Transactional(readOnly=true) Map<String,Object> dashboard() {
        CatalogService.require("REPORTS_READ");
        LocalDateTime today=LocalDateTime.ofInstant(LocalDate.now(BookingService.SPA_ZONE).atStartOfDay(BookingService.SPA_ZONE).toInstant(),ZoneOffset.UTC);
        LocalDateTime tomorrow=LocalDateTime.ofInstant(LocalDate.now(BookingService.SPA_ZONE).plusDays(1).atStartOfDay(BookingService.SPA_ZONE).toInstant(),ZoneOffset.UTC);
        long todayCount=((Number)em.createNativeQuery("SELECT COUNT(*) FROM bookings WHERE booking_start>=:from AND booking_start<:to AND status<>'EXPIRED'").setParameter("from",today).setParameter("to",tomorrow).getSingleResult()).longValue();
        long active=((Number)em.createNativeQuery("SELECT COUNT(*) FROM bookings WHERE status IN ('CHECKED_IN','IN_SERVICE')").getSingleResult()).longValue();
        BigDecimal paid=(BigDecimal)em.createNativeQuery("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='PAID' AND paid_at>=:from AND paid_at<:to").setParameter("from",today).setParameter("to",tomorrow).getSingleResult();
        return Map.of("todayBookings",todayCount,"activeServices",active,"todayRevenue",paid,"pendingPaymentReviews",((Number)em.createNativeQuery("SELECT COUNT(*) FROM webhook_inbox WHERE outcome='MANUAL_REVIEW'").getSingleResult()).longValue());
    }
    @Transactional(readOnly=true) List<Map<String,Object>> reports(LocalDate from,LocalDate to) {
        CatalogService.require("REPORTS_READ"); if (from==null || to==null || from.isAfter(to) || to.isAfter(from.plusDays(366))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Report range required, max one year");
        LocalDateTime start=LocalDateTime.ofInstant(from.atStartOfDay(BookingService.SPA_ZONE).toInstant(),ZoneOffset.UTC);
        LocalDateTime end=LocalDateTime.ofInstant(to.plusDays(1).atStartOfDay(BookingService.SPA_ZONE).toInstant(),ZoneOffset.UTC);
        List<Object[]> rows=em.createNativeQuery("SELECT DATE(CONVERT_TZ(p.paid_at,'+00:00','+07:00')),COUNT(*),SUM(p.amount) FROM payments p WHERE p.status='PAID' AND p.paid_at>=:start AND p.paid_at<:end GROUP BY DATE(CONVERT_TZ(p.paid_at,'+00:00','+07:00')) ORDER BY 1")
            .setParameter("start",start).setParameter("end",end).getResultList();
        return rows.stream().map(r -> Map.<String,Object>of("date",String.valueOf(r[0]),"paidBookings",((Number)r[1]).longValue(),"revenue",r[2])).toList();
    }
}

@RestController @RequestMapping("/api/v1/admin") class AdminController {
    private final AdminService admin;
    AdminController(AdminService admin) { this.admin=admin; }
    @GetMapping("/accounts") List<AccountView> accounts() { return admin.accounts(); }
    @PostMapping("/accounts") @ResponseStatus(HttpStatus.CREATED) AccountView provision(@Valid @RequestBody AccountInput input) { return admin.provision(input); }
    @PutMapping("/accounts/{id}/role") AccountView role(@PathVariable Long id,@Valid @RequestBody AccountRoleInput input) { return admin.roleChange(id,input); }
    @PutMapping("/accounts/{id}/active") AccountView active(@PathVariable Long id,@RequestParam boolean value) { return admin.active(id,value); }
    @GetMapping("/roles/permissions") List<Map<String,Object>> matrix() { return admin.matrix(); }
    @PutMapping("/roles/{code}/permissions") Map<String,Object> permissions(@PathVariable String code,@Valid @RequestBody RolePermissionsInput input) { return admin.replacePermissions(code,input); }
    @GetMapping("/customers") List<CustomerView> customers() { return admin.customers(); }
    @PutMapping("/customers/{id}") CustomerView customer(@PathVariable Long id,@Valid @RequestBody CustomerInput input) { return admin.updateCustomer(id,input); }
    @GetMapping("/bookings") List<BookingView> bookings(@RequestParam(required=false) LocalDate date) { return admin.bookings(date); }
    @GetMapping("/payments") List<PaymentView> payments() { return admin.payments(); }
    @GetMapping("/dashboard") Map<String,Object> dashboard() { return admin.dashboard(); }
    @GetMapping("/reports") List<Map<String,Object>> reports(@RequestParam LocalDate from,@RequestParam LocalDate to) { return admin.reports(from,to); }
}
