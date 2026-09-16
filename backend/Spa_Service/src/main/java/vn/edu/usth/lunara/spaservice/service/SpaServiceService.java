package vn.edu.usth.lunara.spaservice.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.usth.lunara.common.exception.DuplicateResourceException;
import vn.edu.usth.lunara.common.exception.ResourceNotFoundException;
import vn.edu.usth.lunara.spaservice.dto.CreateSpaServiceRequest;
import vn.edu.usth.lunara.spaservice.dto.CreateSpaServiceResponse;
import vn.edu.usth.lunara.spaservice.dto.SpaServiceDetailResponse;
import vn.edu.usth.lunara.spaservice.dto.SpaServiceListResponse;
import vn.edu.usth.lunara.spaservice.dto.StaffSummaryResponse;
import vn.edu.usth.lunara.spaservice.entity.SpaServiceEntity;
import vn.edu.usth.lunara.spaservice.repository.SpaServiceRepository;

import java.util.List;

@Service
public class SpaServiceService {

    private final SpaServiceRepository repository;

    public SpaServiceService(SpaServiceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SpaServiceListResponse> getActiveServices() {
        return repository.findByActiveTrueOrderByDisplayOrderAscIdAsc().stream()
                .map(this::toListResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SpaServiceDetailResponse getActiveService(Long id) {
        SpaServiceEntity entity = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found: " + id));

        List<StaffSummaryResponse> staff = repository.findActiveBookableStaffByServiceId(id).stream()
                .map(item -> new StaffSummaryResponse(item.getAccountId(), item.getDisplayName()))
                .toList();

        return new SpaServiceDetailResponse(
                entity.getId(),
                entity.getName(),
                entity.getCategory(),
                entity.getBasePrice(),
                entity.getMinimumDurationMinutes(),
                entity.getPreparationBufferMinutes(),
                entity.getCleanupBufferMinutes(),
                staff
        );
    }

    @Transactional
    public CreateSpaServiceResponse createService(CreateSpaServiceRequest request) {
        String normalizedName = request.name().trim();
        if (repository.existsByNameIgnoreCase(normalizedName)) {
            throw new DuplicateResourceException("Service name already exists: " + normalizedName);
        }

        SpaServiceEntity entity = new SpaServiceEntity(
                normalizedName,
                request.category().trim(),
                normalizeNullableText(request.description()),
                request.basePrice(),
                request.minimumDurationMinutes(),
                request.isDurationAdjustable(),
                request.durationStepMinutes(),
                request.pricePerDurationStep(),
                request.preparationBufferMinutes(),
                request.cleanupBufferMinutes()
        );

        SpaServiceEntity saved = repository.saveAndFlush(entity);
        return new CreateSpaServiceResponse(saved.getId(), saved.getName(), saved.isActive());
    }

    private SpaServiceListResponse toListResponse(SpaServiceEntity entity) {
        return new SpaServiceListResponse(
                entity.getId(),
                entity.getName(),
                entity.getCategory(),
                entity.getDescription(),
                entity.getImageUrl(),
                entity.getBasePrice(),
                entity.getMinimumDurationMinutes(),
                entity.isDurationAdjustable(),
                entity.getDurationStepMinutes(),
                entity.getPricePerDurationStep(),
                entity.isActive()
        );
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
