package com.kevin.lunaraspa.dashboard_manager;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.entity.Role;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NamedParameterJdbcTemplate jdbc;

    @Mock
    private AccountRepository accountRepository;

    private NotificationController controller;

    @BeforeEach
    void setUp() {
        controller = new NotificationController(jdbc, accountRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuthUser(String email, String roleCode, Long accountId) {
        CustomUserDetails userDetails = new CustomUserDetails(
                email, roleCode,
                Collections.singletonList(new SimpleGrantedAuthority(roleCode))
        );
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        Account account = Account.builder()
                .id(accountId)
                .email(email)
                .role(Role.builder().code(roleCode).build())
                .build();
        when(accountRepository.findByEmail(email)).thenReturn(Optional.of(account));
    }

    @Test
    void ownerGetsAllEventsWithoutRoleFilter() {
        mockAuthUser("owner@lunara.vn", "OWNER", 1L);
        when(jdbc.query(anyString(), anyMap(), any(RowMapper.class))).thenReturn(Collections.emptyList());

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map<String, Object>> paramsCaptor = ArgumentCaptor.forClass(Map.class);

        ResponseEntity<Object> response = controller.getNotifications(10, 0);

        verify(jdbc).query(sqlCaptor.capture(), paramsCaptor.capture(), any(RowMapper.class));
        String executedSql = sqlCaptor.getValue();
        assertFalse(executedSql.contains("WHERE be.event_type IN"));
        assertFalse(executedSql.contains("staff_account_id"));
        assertEquals(10, paramsCaptor.getValue().get("limit"));
    }

    @Test
    void receptionistFiltersReceptionEvents() {
        mockAuthUser("reception@lunara.vn", "RECEPTIONIST", 2L);
        when(jdbc.query(anyString(), anyMap(), any(RowMapper.class))).thenReturn(Collections.emptyList());

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map<String, Object>> paramsCaptor = ArgumentCaptor.forClass(Map.class);

        controller.getNotifications(10, 0);

        verify(jdbc).query(sqlCaptor.capture(), paramsCaptor.capture(), any(RowMapper.class));
        String executedSql = sqlCaptor.getValue();
        assertTrue(executedSql.contains("WHERE be.event_type IN (:eventTypes)"));
        List<?> eventTypes = (List<?>) paramsCaptor.getValue().get("eventTypes");
        assertTrue(eventTypes.contains("CREATED"));
        assertTrue(eventTypes.contains("CHECKED_IN"));
        assertTrue(eventTypes.contains("PAYMENT_INITIALIZED"));
        assertTrue(eventTypes.contains("PAYMENT_RECEIVED"));
    }

    @Test
    void accountantFiltersFinancialEvents() {
        mockAuthUser("accountant@lunara.vn", "ACCOUNTANT", 3L);
        when(jdbc.query(anyString(), anyMap(), any(RowMapper.class))).thenReturn(Collections.emptyList());

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map<String, Object>> paramsCaptor = ArgumentCaptor.forClass(Map.class);

        controller.getNotifications(10, 0);

        verify(jdbc).query(sqlCaptor.capture(), paramsCaptor.capture(), any(RowMapper.class));
        String executedSql = sqlCaptor.getValue();
        assertTrue(executedSql.contains("WHERE be.event_type IN (:eventTypes)"));
        List<?> eventTypes = (List<?>) paramsCaptor.getValue().get("eventTypes");
        assertTrue(eventTypes.contains("PAYMENT_RECEIVED"));
        assertTrue(eventTypes.contains("PAYMENT_REFUNDED"));
        assertFalse(eventTypes.contains("CHECKED_IN"));
    }

    @Test
    void therapistFiltersAssignedBookings() {
        mockAuthUser("therapist@lunara.vn", "THERAPIST", 4L);
        when(jdbc.query(anyString(), anyMap(), any(RowMapper.class))).thenReturn(Collections.emptyList());

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map<String, Object>> paramsCaptor = ArgumentCaptor.forClass(Map.class);

        controller.getNotifications(10, 0);

        verify(jdbc).query(sqlCaptor.capture(), paramsCaptor.capture(), any(RowMapper.class));
        String executedSql = sqlCaptor.getValue();
        assertTrue(executedSql.contains("staff_account_id = :staffAccountId"));
        assertEquals(4L, paramsCaptor.getValue().get("staffAccountId"));
    }
}
