package vn.lunara.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

record DevLogin(@Email @NotBlank String email,@NotBlank String roleCode) { }
record DevSepay(@NotBlank String bookingCode,@NotNull @DecimalMin("0") BigDecimal amount) { }

@Profile("local") @RestController @RequestMapping("/dev") class LocalSimulator {
    private final EntityManager em; private final AuthService auth; private final SepayService sepay; private final ObjectMapper mapper;
    LocalSimulator(EntityManager em,AuthService auth,SepayService sepay,ObjectMapper mapper) { this.em=em; this.auth=auth; this.sepay=sepay; this.mapper=mapper; }
    private void loopback(HttpServletRequest request) { if (!List.of("127.0.0.1","0:0:0:0:0:0:0:1").contains(request.getRemoteAddr())) throw new ResponseStatusException(HttpStatus.FORBIDDEN); }
    @PostMapping("/auth/login") @Transactional Map<String,Object> login(@Valid @RequestBody DevLogin input,HttpServletRequest request,HttpServletResponse response) {
        loopback(request);
        Role role=em.createQuery("select r from Role r where r.code=:code",Role.class).setParameter("code",input.roleCode()).getResultStream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown role"));
        String email=input.email().toLowerCase(Locale.ROOT);
        Account account=em.createQuery("select a from Account a where a.email=:email",Account.class).setParameter("email",email).getResultStream().findFirst().orElse(null);
        if (account==null) {
            if (role.code.equals("THERAPIST")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Provision therapist using admin/staff API first");
            account=new Account(); account.role=role; account.email=email; account.displayName="Local "+role.code; em.persist(account); em.flush();
            if (role.code.equals("CUSTOMER")) { CustomerProfile profile=new CustomerProfile(); profile.accountId=account.id; em.persist(profile); }
        } else if (!account.role.code.equals(role.code)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Existing account has a different role");
        if (!account.active) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Inactive account");
        auth.issueCookies(response,account); return Map.of("id",account.id,"roleCode",role.code,"email",account.email);
    }
    @PostMapping("/sepay/transaction") Map<String,Object> transaction(@Valid @RequestBody DevSepay input,HttpServletRequest request) throws Exception {
        loopback(request); Account actor=em.find(Account.class,AuthService.actor()); if (!actor.role.code.equals("OWNER")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        byte[] raw=mapper.writeValueAsBytes(Map.of("id",Math.abs(new Random().nextLong()/2),"accountNumber",sepay.bankAccount,"code",input.bookingCode(),"content",input.bookingCode(),"transferType","in","transferAmount",input.amount(),"transactionDate",Instant.now().toString()));
        return sepay.process(raw);
    }
}
