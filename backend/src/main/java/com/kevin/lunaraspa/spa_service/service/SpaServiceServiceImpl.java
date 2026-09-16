package com.kevin.lunaraspa.spa_service.service;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.SpaErrorCode;
import com.kevin.lunaraspa.spa_service.dto.CreateSpaServiceRequest;
import com.kevin.lunaraspa.spa_service.dto.CreateSpaServiceResponse;
import com.kevin.lunaraspa.spa_service.dto.SpaServiceDetailResponse;
import com.kevin.lunaraspa.spa_service.dto.SpaServiceListResponse;
import com.kevin.lunaraspa.spa_service.dto.StaffSummaryResponse;
import com.kevin.lunaraspa.spa_service.entity.SpaService;
import com.kevin.lunaraspa.spa_service.repository.SpaServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SpaServiceServiceImpl implements SpaServiceService {

    private final SpaServiceRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<SpaServiceListResponse> getActiveServices() {
        return repository.findByActiveTrueOrderByDisplayOrderAscIdAsc().stream()
                .map(this::toListResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SpaServiceDetailResponse getActiveService(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Service id must be greater than 0");
        }

        SpaService service = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new AppException(
                        SpaErrorCode.SERVICE_NOT_FOUND,
                        "Spa service not found: " + id
                ));

        List<StaffSummaryResponse> staff = repository.findActiveBookableStaffByServiceId(id).stream()
                .map(item -> new StaffSummaryResponse(item.getAccountId(), item.getDisplayName()))
                .toList();

        return new SpaServiceDetailResponse(
                service.getId(),
                service.getName(),
                service.getCategory(),
                service.getBasePrice(),
                service.getMinimumDurationMinutes(),
                service.getPreparationBufferMinutes(),
                service.getCleanupBufferMinutes(),
                staff
        );
    }

    @Override
    @Transactional
    public CreateSpaServiceResponse createService(CreateSpaServiceRequest request) {
        String normalizedName = request.name().trim();
        if (repository.existsByNameIgnoreCase(normalizedName)) {
            throw duplicateName(normalizedName);
        }

        SpaService service = SpaService.builder()
                .name(normalizedName)
                .category(request.category().trim())
                .description(normalizeNullableText(request.description()))
                .basePrice(request.basePrice())
                .minimumDurationMinutes(request.minimumDurationMinutes())
                .durationAdjustable(request.isDurationAdjustable())
                .durationStepMinutes(request.durationStepMinutes())
                .pricePerDurationStep(request.pricePerDurationStep())
                .preparationBufferMinutes(request.preparationBufferMinutes())
                .cleanupBufferMinutes(request.cleanupBufferMinutes())
                .build();

        try {
            SpaService saved = repository.saveAndFlush(service);
            return new CreateSpaServiceResponse(saved.getId(), saved.getName(), saved.isActive());
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(
                    SpaErrorCode.SERVICE_ALREADY_EXISTS,
                    "Spa service name already exists: " + normalizedName,
                    exception
            );
        }
    }

    private SpaServiceListResponse toListResponse(SpaService service) {
        return new SpaServiceListResponse(
                service.getId(),
                service.getName(),
                service.getCategory(),
                service.getDescription(),
                service.getImageUrl(),
                service.getBasePrice(),
                service.getMinimumDurationMinutes(),
                service.isDurationAdjustable(),
                service.getDurationStepMinutes(),
                service.getPricePerDurationStep(),
                service.isActive()
        );
    }

    private AppException duplicateName(String name) {
        return new AppException(
                SpaErrorCode.SERVICE_ALREADY_EXISTS,
                "Spa service name already exists: " + name
        );
    }

    private String normalizeNullableText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
