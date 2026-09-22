package com.kevin.lunaraspa.spa_service;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.spa_service.dto.ServiceDtos.CreateServiceRequest;
import com.kevin.lunaraspa.spa_service.entity.SpaService;
import com.kevin.lunaraspa.spa_service.repository.SpaServiceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpaServiceControllerTest {
    @Mock SpaServiceRepository repository;
    @Mock NamedParameterJdbcTemplate jdbc;

    @Test
    void createAssignsEverySelectedBookableStaffToTheNewService() {
        SpaServiceController controller = new SpaServiceController(repository, jdbc);
        when(repository.existsByNameIgnoreCase("Hot stone")).thenReturn(false);
        when(repository.saveAndFlush(any(SpaService.class))).thenAnswer(invocation -> {
            SpaService service = invocation.getArgument(0);
            service.setId(41L);
            return service;
        });
        when(jdbc.queryForObject(ArgumentMatchers.contains("COUNT(*)"), any(Map.class), eq(Long.class)))
                .thenReturn(2L);
        when(repository.findStaffForService(41L)).thenReturn(List.of());

        controller.create(request(List.of(11L, 12L)));

        verify(jdbc).update(eq("DELETE FROM staff_services WHERE service_id = :serviceId"),
                eq(Map.of("serviceId", 41L)));
        verify(jdbc).update(ArgumentMatchers.contains("INSERT INTO staff_services"),
                eq(Map.of("staffId", 11L, "serviceId", 41L)));
        verify(jdbc).update(ArgumentMatchers.contains("INSERT INTO staff_services"),
                eq(Map.of("staffId", 12L, "serviceId", 41L)));
    }

    @Test
    void createRejectsServiceWithoutAnyBookableStaff() {
        SpaServiceController controller = new SpaServiceController(repository, jdbc);
        when(repository.existsByNameIgnoreCase("Hot stone")).thenReturn(false);
        when(repository.saveAndFlush(any(SpaService.class))).thenAnswer(invocation -> {
            SpaService service = invocation.getArgument(0);
            service.setId(41L);
            return service;
        });

        assertThrows(AppException.class, () -> controller.create(request(List.of())));

        verify(jdbc, never()).update(any(String.class), any(Map.class));
    }

    private CreateServiceRequest request(List<Long> staffIds) {
        return new CreateServiceRequest(
                "Hot stone", "MASSAGE", "Test service", null,
                BigDecimal.valueOf(350000), 60, false, null, null,
                10, 15, staffIds
        );
    }
}
