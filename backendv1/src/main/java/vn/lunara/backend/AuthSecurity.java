package vn.lunara.backend;

import jakarta.persistence.EntityManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.bind.annotation.*;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Configuration class AuthSecurity {
    @Value("${app.frontend-url}") String frontendUrl;
    private final AuthService auth;
    AuthSecurity(AuthService auth) { this.auth=auth; }

    @Bean SecurityFilterChain chain(org.springframework.security.config.annotation.web.builders.HttpSecurity http, CookieAuthFilter filter) throws Exception {
        http.cors(c -> c.configurationSource(req -> {
            var cfg=new org.springframework.web.cors.CorsConfiguration();
            cfg.setAllowedOrigins(List.of(frontendUrl)); cfg.setAllowCredentials(true);
            cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
            cfg.setAllowedHeaders(List.of("Content-Type","X-XSRF-TOKEN","Idempotency-Key"));
            return cfg;
        }));
        http.csrf(c -> c.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()).csrfTokenRequestHandler(new SpaCsrfHandler()).ignoringRequestMatchers("/webhooks/sepay"));
        http.authorizeHttpRequests(a -> a.requestMatchers("/api/v1/services/**","/api/v1/staff/**","/api/v1/availability/**","/api/v1/auth/csrf","/api/v1/auth/refresh","/api/v1/auth/logout","/dev/auth/login","/webhooks/sepay","/error","/actuator/health").permitAll().anyRequest().authenticated());
        http.exceptionHandling(e -> e.authenticationEntryPoint((req,res,ex) -> { res.setStatus(401); res.setContentType("application/json"); res.getWriter().write("{\"status\":401,\"message\":\"Authentication required\"}"); }));
        http.oauth2Login(o -> o.successHandler((req,res,authentication) -> {
            OidcUser user=(OidcUser)authentication.getPrincipal();
            Account account=auth.bindGoogle(user);
            auth.issueCookies(res,account);
            if (req.getSession(false)!=null) req.getSession(false).invalidate();
            res.sendRedirect(frontendUrl + (account.role.code.equals("CUSTOMER") ? "/booking" : "/admin/dashboard"));
        }).failureHandler((req,res,error) -> res.sendRedirect(frontendUrl+"/auth?error=google")));
        http.addFilterBefore(filter,org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
        http.sessionManagement(s -> s.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED));
        return http.build();
    }
    static final class SpaCsrfHandler implements CsrfTokenRequestHandler {
        private final CsrfTokenRequestHandler plain=new CsrfTokenRequestAttributeHandler();
        private final CsrfTokenRequestHandler xor=new XorCsrfTokenRequestAttributeHandler();
        @Override public void handle(HttpServletRequest request,HttpServletResponse response,java.util.function.Supplier<CsrfToken> token) {
            xor.handle(request,response,token);
            token.get();
        }
        @Override public String resolveCsrfTokenValue(HttpServletRequest request,CsrfToken token) {
            return request.getHeader(token.getHeaderName()) != null ? plain.resolveCsrfTokenValue(request,token) : xor.resolveCsrfTokenValue(request,token);
        }
    }
}

@Configuration class JwtConfig {
    @Value("${app.jwt-secret}") String jwtSecret;
    @Bean JwtEncoder jwtEncoder() { return new NimbusJwtEncoder(new ImmutableSecret<>(key())); }
    @Bean JwtDecoder jwtDecoder() { return NimbusJwtDecoder.withSecretKey(key()).build(); }
    private SecretKey key() {
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) throw new IllegalStateException("JWT_SECRET must contain at least 32 UTF-8 bytes");
        return new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8),"HmacSHA256");
    }
}

@org.springframework.stereotype.Component class CookieAuthFilter extends OncePerRequestFilter {
    private final JwtDecoder decoder;
    private final AuthService auth;
    CookieAuthFilter(JwtDecoder decoder,AuthService auth) { this.decoder=decoder; this.auth=auth; }
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        if (SecurityContextHolder.getContext().getAuthentication()==null && request.getCookies()!=null) {
            for (Cookie cookie:request.getCookies()) if ("LUNARA_AT".equals(cookie.getName())) {
                try {
                    Jwt jwt=decoder.decode(cookie.getValue());
                    if (!"access".equals(jwt.getClaimAsString("type"))) break;
                    Long id=Long.parseLong(jwt.getSubject());
                    var authorities=auth.authorities(id);
                    if (!authorities.isEmpty()) SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(id,null,authorities));
                } catch (Exception ignored) { /* Expired or revoked account; leave request unauthenticated. */ }
                break;
            }
        }
        chain.doFilter(request,response);
    }
}

@org.springframework.stereotype.Service class AuthService {
    private final EntityManager em;
    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    @Value("${app.owner-email}") String ownerEmail;
    @Value("${app.cookie-secure}") boolean cookieSecure;
    AuthService(EntityManager em,JwtEncoder encoder,JwtDecoder decoder) { this.em=em; this.encoder=encoder; this.decoder=decoder; }
    @org.springframework.transaction.annotation.Transactional Account bindGoogle(OidcUser user) {
        String sub=user.getSubject(); String email=user.getEmail();
        if (email==null || !Boolean.TRUE.equals(user.getEmailVerified())) throw new org.springframework.security.access.AccessDeniedException("Verified Google email required");
        List<Account> bySub=em.createQuery("select a from Account a where a.googleSubject=:sub",Account.class).setParameter("sub",sub).getResultList();
        Account account=bySub.isEmpty()?null:bySub.get(0);
        if (account==null) {
            var byEmail=em.createQuery("select a from Account a where lower(a.email)=:email",Account.class).setParameter("email",email.toLowerCase(Locale.ROOT)).getResultList();
            if (!byEmail.isEmpty()) {
                account=byEmail.get(0);
                if (account.googleSubject!=null && !account.googleSubject.equals(sub)) throw new org.springframework.security.access.AccessDeniedException("Account already bound to Google");
                account.googleSubject=sub;
            } else {
                String roleCode=email.equalsIgnoreCase(ownerEmail)?"OWNER":"CUSTOMER";
                Role role=em.createQuery("select r from Role r where r.code=:code",Role.class).setParameter("code",roleCode).getSingleResult();
                account=new Account(); account.role=role; account.googleSubject=sub; account.email=email.toLowerCase(Locale.ROOT);
                account.displayName=Optional.ofNullable(user.getFullName()).orElse(email); account.avatarUrl=user.getPicture();
                em.persist(account); em.flush();
                if (roleCode.equals("CUSTOMER")) { CustomerProfile profile=new CustomerProfile(); profile.accountId=account.id; em.persist(profile); }
            }
        }
        if (!account.active) throw new org.springframework.security.access.AccessDeniedException("Inactive account");
        account.lastLoginAt=LocalDateTime.now(java.time.Clock.systemUTC());
        return account;
    }
    @org.springframework.transaction.annotation.Transactional(readOnly=true) List<SimpleGrantedAuthority> authorities(Long id) {
        Account a=em.find(Account.class,id);
        if (a==null || !a.active) return List.of();
        List<String> codes=em.createNativeQuery("SELECT p.code FROM permissions p JOIN role_permissions rp ON rp.permission_id=p.id WHERE rp.role_id=:role")
            .setParameter("role",a.role.id).getResultList();
        List<SimpleGrantedAuthority> result=new ArrayList<>(); result.add(new SimpleGrantedAuthority("ROLE_"+a.role.code));
        codes.forEach(code -> result.add(new SimpleGrantedAuthority(code)));
        return result;
    }
    @org.springframework.transaction.annotation.Transactional void issueCookies(HttpServletResponse response,Account account) {
        Instant now=Instant.now();
        String at=token(account.id,"access",now,now.plusSeconds(900),null);
        String jti=UUID.randomUUID().toString();
        String rt=token(account.id,"refresh",now,now.plusSeconds(7*86400),jti);
        RefreshSession session=new RefreshSession(); session.accountId=account.id; session.tokenHash=hash(jti); session.expiresAt=LocalDateTime.ofInstant(now.plusSeconds(7*86400),ZoneOffset.UTC); em.persist(session);
        cookie(response,"LUNARA_AT",at,900,"/api"); cookie(response,"LUNARA_RT",rt,7*86400,"/api/v1/auth");
    }
    private String token(Long id,String type,Instant now,Instant exp,String jti) {
        var claims=JwtClaimsSet.builder().issuer("lunara-local").subject(id.toString()).issuedAt(now).expiresAt(exp).claim("type",type);
        if (jti!=null) claims.id(jti);
        return encoder.encode(JwtEncoderParameters.from(org.springframework.security.oauth2.jwt.JwsHeader.with(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256).build(),claims.build())).getTokenValue();
    }
    @org.springframework.transaction.annotation.Transactional void refresh(HttpServletRequest request,HttpServletResponse response) {
        Jwt jwt=refreshJwt(request); String hash=hash(jwt.getId());
        var sessions=em.createQuery("select s from RefreshSession s where s.tokenHash=:hash",RefreshSession.class).setParameter("hash",hash).getResultList();
        if (sessions.isEmpty() || sessions.get(0).revokedAt!=null || !sessions.get(0).expiresAt.isAfter(LocalDateTime.now(java.time.Clock.systemUTC()))) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED,"Refresh token revoked");
        RefreshSession session=sessions.get(0); session.revokedAt=LocalDateTime.now(java.time.Clock.systemUTC());
        Account account=em.find(Account.class,Long.valueOf(jwt.getSubject()));
        if (account==null || !account.active) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED,"Account inactive");
        issueCookies(response,account);
    }
    @org.springframework.transaction.annotation.Transactional void logout(HttpServletRequest request,HttpServletResponse response) {
        try { Jwt jwt=refreshJwt(request); var sessions=em.createQuery("select s from RefreshSession s where s.tokenHash=:hash",RefreshSession.class).setParameter("hash",hash(jwt.getId())).getResultList(); if (!sessions.isEmpty()) sessions.get(0).revokedAt=LocalDateTime.now(java.time.Clock.systemUTC()); } catch(Exception ignored) { }
        cookie(response,"LUNARA_AT","",0,"/api"); cookie(response,"LUNARA_RT","",0,"/api/v1/auth");
    }
    private Jwt refreshJwt(HttpServletRequest request) {
        if (request.getCookies()!=null) for (Cookie c:request.getCookies()) if ("LUNARA_RT".equals(c.getName())) {
            Jwt jwt=decoder.decode(c.getValue()); if ("refresh".equals(jwt.getClaimAsString("type")) && jwt.getId()!=null) return jwt;
        }
        throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED,"Missing refresh token");
    }
    private void cookie(HttpServletResponse response,String name,String value,int age,String path) {
        response.addHeader("Set-Cookie",name+"="+value+"; Max-Age="+age+"; Path="+path+"; HttpOnly; SameSite=Lax"+(cookieSecure?"; Secure":""));
    }
    static String hash(String value) {
        try { byte[] digest=MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)); return java.util.HexFormat.of().formatHex(digest); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
    static Long actor() {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        if (auth==null || !(auth.getPrincipal() instanceof Long id)) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return id;
    }
}

@RestController @RequestMapping("/api/v1/auth") class AuthController {
    private final AuthService auth; private final EntityManager em;
    AuthController(AuthService auth,EntityManager em) { this.auth=auth; this.em=em; }
    @GetMapping("/csrf") Map<String,String> csrf(CsrfToken csrf) { return Map.of("header",csrf.getHeaderName(),"token",csrf.getToken()); }
    @GetMapping("/me") Map<String,Object> me() {
        Account a=em.find(Account.class,AuthService.actor());
        return Map.of("id",a.id.toString(),"email",a.email,"displayName",a.displayName,"roleCode",a.role.code,"permissions",auth.authorities(a.id).stream().map(SimpleGrantedAuthority::getAuthority).toList());
    }
    @PostMapping("/refresh") Map<String,Boolean> refresh(HttpServletRequest request,HttpServletResponse response) { auth.refresh(request,response); return Map.of("success",true); }
    @PostMapping("/logout") Map<String,Boolean> logout(HttpServletRequest request,HttpServletResponse response) { auth.logout(request,response); return Map.of("success",true); }
}
