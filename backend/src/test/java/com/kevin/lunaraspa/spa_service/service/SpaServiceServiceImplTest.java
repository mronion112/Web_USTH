package com.kevin.lunaraspa.spa_service.service;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.SpaErrorCode;
import com.kevin.lunaraspa.spa_service.dto.CreateSpaServiceRequest;
import com.kevin.lunaraspa.spa_service.dto.CreateSpaServiceResponse;
import com.kevin.lunaraspa.spa_service.dto.SpaServiceDetailResponse;
import com.kevin.lunaraspa.spa_service.dto.SpaServiceListResponse;
import com.kevin.lunaraspa.spa_service.entity.SpaService;
import com.kevin.lunaraspa.spa_service.repository.SpaServiceRepository;
import com.kevin.lunaraspa.spa_service.repository.StaffSummaryProjection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpaServiceServiceImplTest {

    @Mock
    private SpaServiceRepository repository;

    private SpaServiceServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SpaServiceServiceImpl(repository);
    }

    @Test
    void listsOnlyActiveServicesInRepositoryOrder() {
        SpaService entity = spaService(1L, "Aroma Massage");
        when(repository.findByActiveTrueOrderByDisplayOrderAscIdAsc()).thenReturn(List.of(entity));

        List<SpaServiceListResponse> result = service.getActiveServices();

        assertEquals(1, result.size());
        assertEquals("Aroma Massage", result.getFirst().name());
        assertTrue(result.getFirst().isActive());
    }

    @Test
    void returnsServiceDetailWithOnlyEligibleStaff() {
        SpaService entity = spaService(1L, "Aroma Massage");
        StaffSummaryProjection projection = mock(StaffSummaryProjection.class);
        when(projection.getAccountId()).thenReturn(4L);
        when(projection.getDisplayName()).thenReturn("Therapist One");
        when(repository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(entity));
        when(repository.findActiveBookableStaffByServiceId(1L)).thenReturn(List.of(projection));

        SpaServiceDetailResponse result = service.getActiveService(1L);

        assertEquals("Aroma Massage", result.name());
        assertEquals(1, result.staff().size());
        assertEquals(4L, result.staff().getFirst().accountId());
    }

    @Test
    void throwsNotFoundWhenActiveServiceDoesNotExist() {
        when(repository.findByIdAndActiveTrue(99L)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () -> service.getActiveService(99L));

        assertEquals(SpaErrorCode.SERVICE_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void createsNormalizedActiveService() {
        CreateSpaServiceRequest request = validRequest("  New Service  ", "  Massage  ", "   ");
        when(repository.existsByNameIgnoreCase("New Service")).thenReturn(false);
        when(repository.saveAndFlush(any(SpaService.class))).thenAnswer(invocation -> {
            SpaService candidate = invocation.getArgument(0);
            return SpaService.builder()
                    .id(10L)
                    .name(candidate.getName())
                    .category(candidate.getCategory())
                    .description(candidate.getDescription())
                    .basePrice(candidate.getBasePrice())
                    .minimumDurationMinutes(candidate.getMinimumDurationMinutes())
                    .durationAdjustable(candidate.isDurationAdjustable())
                    .preparationBufferMinutes(candidate.getPreparationBufferMinutes())
                    .cleanupBufferMinutes(candidate.getCleanupBufferMinutes())
                    .build();
        });

        CreateSpaServiceResponse result = service.createService(request);

        ArgumentCaptor<SpaService> captor = ArgumentCaptor.forClass(SpaService.class);
        verify(repository).saveAndFlush(captor.capture());
        assertEquals(10L, result.id());
        assertEquals("New Service", result.name());
        assertTrue(result.isActive());
        assertEquals("Massage", captor.getValue().getCategory());
        assertNull(captor.getValue().getDescription());
        assertFalse(captor.getValue().isDurationAdjustable());
    }

    @Test
    void rejectsDuplicateNameBeforeInsert() {
        CreateSpaServiceRequest request = validRequest("Aroma Massage", "Massage", null);
        when(repository.existsByNameIgnoreCase("Aroma Massage")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> service.createService(request));

        assertEquals(SpaErrorCode.SERVICE_ALREADY_EXISTS, exception.getErrorCode());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void translatesUniqueConstraintRaceToConflict() {
        CreateSpaServiceRequest request = validRequest("Aroma Massage", "Massage", null);
        when(repository.existsByNameIgnoreCase("Aroma Massage")).thenReturn(false);
        when(repository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("duplicate"));

        AppException exception = assertThrows(AppException.class, () -> service.createService(request));

        assertEquals(SpaErrorCode.SERVICE_ALREADY_EXISTS, exception.getErrorCode());
    }

    private SpaService spaService(Long id, String name) {
        return SpaService.builder()
                .id(id)
                .name(name)
                .category("Massage")
                .description("Description")
                .basePrice(new BigDecimal("500000.00"))
                .minimumDurationMinutes(60)
                .durationAdjustable(false)
                .preparationBufferMinutes(10)
                .cleanupBufferMinutes(10)
                .build();
    }

    private CreateSpaServiceRequest validRequest(String name, String category, String description) {
        return new CreateSpaServiceRequest(
                name,
                category,
                description,
                new BigDecimal("500000.00"),
                60,
                false,
                null,
                null,
                10,
                10
        );
    }
}
