package com.kevin.lunaraspa.profiles;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.entity.Role;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.JwtAuthenticationFilter;
import com.kevin.lunaraspa.authentication_account.security.JwtBlacklistService;
import com.kevin.lunaraspa.authentication_account.security.JwtUtils;
import com.kevin.lunaraspa.core.http.GlobalExceptionHandler;
import com.kevin.lunaraspa.profiles.config.ProfileSecurityConfig;
import com.kevin.lunaraspa.profiles.entity.CustomerProfile;
import com.kevin.lunaraspa.profiles.entity.StaffProfile;
import com.kevin.lunaraspa.profiles.repository.CustomerProfileRepository;
import com.kevin.lunaraspa.profiles.repository.StaffProfileRepository;
import com.kevin.lunaraspa.profiles.service.impl.ProfileServiceImpl;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ProfileController.class, properties = {
        "app.frontend-url=http://localhost:5175",
        "app.jwt.secret=profile-test-secret-at-least-32-bytes-long",
        "app.jwt.access-expiration-ms=300000", "app.jwt.refresh-expiration-ms=600000",
        "server.port=0"
})
@EnableWebSecurity
@Import({ProfileSecurityConfig.class, JwtAuthenticationFilter.class, JwtUtils.class,
        ProfileServiceImpl.class, GlobalExceptionHandler.class})
class ProfileControllerTest {
    private static final String EMAIL = "customer@example.com";
    private static final String SECRET = "profile-test-secret-at-least-32-bytes-long";
    @Autowired MockMvc mvc;
    @Autowired JwtUtils jwt;
    @MockitoBean AccountRepository accounts;
    @MockitoBean CustomerProfileRepository customers;
    @MockitoBean StaffProfileRepository staff;
    @MockitoBean JwtBlacklistService blacklist;
    private Account account;
    private CustomerProfile profile;

    @BeforeEach
    void setup() {
        account = Account.builder().id(10L).email(EMAIL).displayName("Customer")
                .role(Role.builder().code("CUSTOMER").build()).isActive(true).build();
        profile = CustomerProfile.builder().account(account).id(10L).phone("0912345678")
                .preferences("Massage nhẹ").internalNotes("Private note").build();
        when(accounts.findByEmail(EMAIL)).thenReturn(Optional.of(account));
        lenient().when(customers.findById(10L)).thenReturn(Optional.of(profile));
    }

    private String bearer() { return "Bearer " + jwt.generateAccessToken(EMAIL, "CUSTOMER"); }

    @Test
    void authenticatedCustomerCanReadProfileWithoutPermissionRegistryEntry() throws Exception {
        mvc.perform(get("/api/profile/me").header("Authorization", bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.accountId").value(10))
                .andExpect(jsonPath("$.data.phone").value("0912345678"))
                .andExpect(jsonPath("$.data.internalNotes").doesNotExist());
    }

    @Test
    void partialUpdatePreservesPreferencesAndPrivateNotes() throws Exception {
        mvc.perform(put("/api/profile/me").header("Authorization", bearer())
                        .contentType("application/json").content("{\"phone\":\"0987 654 321\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.phone").value("0987654321"))
                .andExpect(jsonPath("$.data.preferences").value("Massage nhẹ"));
        verify(customers).save(profile);
        assertThat(profile.getInternalNotes()).isEqualTo("Private note");
        assertThat(account.getDisplayName()).isEqualTo("Customer");
    }

    @Test
    void explicitNullClearsFieldAndKeepsOmittedField() throws Exception {
        mvc.perform(put("/api/profile/me").header("Authorization", bearer())
                        .contentType("application/json").content("{\"phone\":null}"))
                .andExpect(status().isOk());
        assertThat(profile.getPhone()).isNull();
        assertThat(profile.getPreferences()).isEqualTo("Massage nhẹ");
    }

    @Test
    void updatesDisplayNameAndCreatesMissingCustomerProfile() throws Exception {
        when(customers.findById(10L)).thenReturn(Optional.empty());
        mvc.perform(put("/api/profile/me").header("Authorization", bearer())
                        .contentType("application/json").content("{\"displayName\":\" New name \",\"phone\":\"0912345678\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.displayName").value("New name"));
        verify(accounts).save(account);
        verify(customers).save(argThat(p -> p.getAccount() == account && "0912345678".equals(p.getPhone())));
    }

    @ParameterizedTest
    @ValueSource(strings = {"MANAGER", "THERAPIST", "OWNER", "RECEPTIONIST", "ACCOUNTANT"})
    void staffReadsEmployeeFieldsButCannotUpdateEvenWithCustomerJwt(String role) throws Exception {
        account.setRole(Role.builder().code(role).build());
        when(staff.findById(10L)).thenReturn(Optional.of(StaffProfile.builder().account(account)
                .employeeCode("EMP10").jobTitle("Staff").isBookable(false).build()));
        mvc.perform(get("/api/profile/me").header("Authorization", bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.role").value(role))
                .andExpect(jsonPath("$.data.employeeCode").value("EMP10"))
                .andExpect(jsonPath("$.data.isBookable").value(false));
        mvc.perform(put("/api/profile/me").header("Authorization", bearer())
                        .contentType("application/json").content("{\"displayName\":\"Changed\"}"))
                .andExpect(status().isForbidden());
        verify(customers, never()).save(any());
        verify(accounts, never()).save(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "[]", "null", "{", "{\"phone\":123}", "{\"phone\":\"---\"}", "{\"phone\":\"123\"}",
            "{\"phone\":\"abc\"}", "{\"displayName\":\" \"}", "{\"displayName\":null}",
            "{\"preferences\":true}", "{\"role\":\"OWNER\"}", "{\"employee_code\":\"X\"}",
            "{\"job_title\":\"X\"}", "{\"internalNotes\":\"X\"}", "{\"accountId\":99}"})
    void invalidBodyNeverWritesData(String body) throws Exception {
        mvc.perform(put("/api/profile/me").header("Authorization", bearer())
                        .contentType("application/json").content(body)).andExpect(status().isBadRequest());
        verify(customers, never()).save(any());
        verify(accounts, never()).save(any());
    }

    @Test
    void validatesAllFieldsBeforeMutatingName() throws Exception {
        mvc.perform(put("/api/profile/me").header("Authorization", bearer())
                        .contentType("application/json").content("{\"displayName\":\"Changed\",\"preferences\":\"" + "ệ".repeat(22000) + "\"}"))
                .andExpect(status().isBadRequest());
        assertThat(account.getDisplayName()).isEqualTo("Customer");
        verify(accounts, never()).save(any());
    }

    @Test
    void inactiveAndMissingAccountsAreRejected() throws Exception {
        account.setIsActive(false);
        mvc.perform(get("/api/profile/me").header("Authorization", bearer())).andExpect(status().isForbidden());
        mvc.perform(put("/api/profile/me").header("Authorization", bearer())
                .contentType("application/json").content("{\"phone\":null}")).andExpect(status().isForbidden());
        when(accounts.findByEmail(EMAIL)).thenReturn(Optional.empty());
        mvc.perform(get("/api/profile/me").header("Authorization", bearer())).andExpect(status().isNotFound());
    }

    @Test
    void missingInvalidExpiredAndBlacklistedTokensReturn401() throws Exception {
        mvc.perform(get("/api/profile/me")).andExpect(status().isUnauthorized());
        var key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String expired = Jwts.builder().subject(EMAIL).expiration(Date.from(Instant.now().minusSeconds(120)))
                .signWith(key).compact();
        String noExpiry = Jwts.builder().subject(EMAIL).signWith(key).compact();
        String wrongKey = Jwts.builder().subject(EMAIL).expiration(Date.from(Instant.now().plusSeconds(300)))
                .signWith(Keys.hmacShaKeyFor("other-test-secret-at-least-32-bytes".getBytes(StandardCharsets.UTF_8))).compact();
        for (String token : new String[]{"invalid", expired, noExpiry, wrongKey}) {
            mvc.perform(get("/api/profile/me").header("Authorization", "Bearer " + token))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.success").value(false));
        }
        String token = jwt.generateAccessToken(EMAIL, "CUSTOMER");
        when(blacklist.isBlacklisted(token)).thenReturn(true);
        mvc.perform(get("/api/profile/me").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
    }

    @Test
    void allowsConfiguredFrontendPreflightAndRejectsOtherOrigin() throws Exception {
        mvc.perform(options("/api/profile/me").header("Origin", "http://localhost:5175")
                        .header("Access-Control-Request-Method", "PUT")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5175"));
        mvc.perform(options("/api/profile/me").header("Origin", "https://other.example")
                .header("Access-Control-Request-Method", "PUT")).andExpect(status().isForbidden());
    }
}
