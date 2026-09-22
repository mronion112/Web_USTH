package com.kevin.lunaraspa.spa_service;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.spa_service.dto.ServiceDtos.*;
import com.kevin.lunaraspa.spa_service.entity.SpaService;
import com.kevin.lunaraspa.spa_service.exception.ServiceErrorCode;
import com.kevin.lunaraspa.spa_service.repository.SpaServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SpaServiceController {
    private final SpaServiceRepository repository;
    private final NamedParameterJdbcTemplate jdbc;

    @GetMapping("/staff")
    @Transactional(readOnly = true)
    public ResponseEntity<Object> publicStaff() {
        String sql = """
                SELECT a.id, a.id AS accountId, a.display_name AS displayName, a.avatar_url AS avatarUrl,
                       COALESCE(sp.job_title, 'Chuyên viên trị liệu') AS jobTitle
                FROM accounts a
                JOIN roles r ON a.role_id = r.id
                LEFT JOIN staff_profiles sp ON sp.account_id = a.id
                WHERE a.is_active = TRUE AND (r.code = 'THERAPIST' OR sp.is_bookable = TRUE)
                ORDER BY a.id ASC
                """;
        List<Map<String, Object>> staff = jdbc.queryForList(sql, Map.of());
        return ResponseBuilder.ok(staff, "Get staff successfully");
    }

    @GetMapping("/services")
    @Transactional(readOnly = true)
    public ResponseEntity<Object> list() {
        return ResponseBuilder.ok(repository.findByActiveTrueOrderByDisplayOrderAscIdAsc().stream()
                .map(service -> toResponse(service, false)).toList(), "Get services successfully");
    }

    @GetMapping("/services/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Object> detail(@PathVariable Long id) {
        SpaService service = repository.findById(id)
                .filter(item -> Boolean.TRUE.equals(item.getActive()))
                .orElseThrow(() -> new AppException(ServiceErrorCode.NOT_FOUND));
        return ResponseBuilder.ok(toResponse(service, true), "Get service successfully");
    }

    @PostMapping("/manager/services")
    @Transactional
    public ResponseEntity<Object> create(@RequestBody CreateServiceRequest request) {
        validate(request);
        String name = request.name().trim();
        if (repository.existsByNameIgnoreCase(name)) throw new AppException(ServiceErrorCode.NAME_EXISTS);
        boolean adjustable = Boolean.TRUE.equals(request.isDurationAdjustable());
        SpaService saved = repository.saveAndFlush(SpaService.builder()
                .name(name).category(request.category().trim()).description(trim(request.description()))
                .imageUrl(trim(request.imageUrl())).basePrice(request.basePrice())
                .minimumDurationMinutes(request.minimumDurationMinutes()).durationAdjustable(adjustable)
                .durationStepMinutes(adjustable ? request.durationStepMinutes() : null)
                .pricePerDurationStep(adjustable ? request.pricePerDurationStep() : null)
                .preparationBufferMinutes(orZero(request.preparationBufferMinutes()))
                .cleanupBufferMinutes(orZero(request.cleanupBufferMinutes())).active(true).build());
        return ResponseBuilder.ok(toResponse(saved, false), HttpStatus.CREATED, "Create service successfully");
    }

    @PutMapping("/manager/services/{id}")
    @Transactional
    public ResponseEntity<Object> update(@PathVariable Long id, @RequestBody CreateServiceRequest request) {
        SpaService service = repository.findById(id)
                .orElseThrow(() -> new AppException(ServiceErrorCode.NOT_FOUND));
        if (request.name() != null && !request.name().isBlank()) {
            service.setName(request.name().trim());
        }
        if (request.category() != null && !request.category().isBlank()) {
            service.setCategory(request.category().trim());
        }
        if (request.description() != null) {
            service.setDescription(request.description().trim());
        }
        if (request.imageUrl() != null) {
            service.setImageUrl(request.imageUrl().trim());
        }
        if (request.basePrice() != null) {
            service.setBasePrice(request.basePrice());
        }
        if (request.minimumDurationMinutes() != null) {
            service.setMinimumDurationMinutes(request.minimumDurationMinutes());
        }
        if (request.isDurationAdjustable() != null) {
            service.setDurationAdjustable(request.isDurationAdjustable());
        }
        if (request.durationStepMinutes() != null) {
            service.setDurationStepMinutes(request.durationStepMinutes());
        }
        if (request.pricePerDurationStep() != null) {
            service.setPricePerDurationStep(request.pricePerDurationStep());
        }
        SpaService saved = repository.saveAndFlush(service);
        return ResponseBuilder.ok(toResponse(saved, false), "Update service successfully");
    }

    @DeleteMapping("/manager/services/{id}")
    @Transactional
    public ResponseEntity<Object> toggleActive(@PathVariable Long id) {
        SpaService service = repository.findById(id)
                .orElseThrow(() -> new AppException(ServiceErrorCode.NOT_FOUND));
        service.setActive(!Boolean.TRUE.equals(service.getActive()));
        repository.saveAndFlush(service);
        return ResponseBuilder.ok(java.util.Map.of("id", service.getId(), "active", service.getActive()), "Toggled service status successfully");
    }

    private void validate(CreateServiceRequest r) {
        if (r == null || blank(r.name()) || blank(r.category()) || r.basePrice() == null
                || r.basePrice().signum() < 0 || r.minimumDurationMinutes() == null
                || r.minimumDurationMinutes() <= 0 || orZero(r.preparationBufferMinutes()) < 0
                || orZero(r.cleanupBufferMinutes()) < 0) throw new AppException(ServiceErrorCode.INVALID_REQUEST);
        if (Boolean.TRUE.equals(r.isDurationAdjustable()) && (r.durationStepMinutes() == null
                || r.durationStepMinutes() <= 0 || r.pricePerDurationStep() == null
                || r.pricePerDurationStep().compareTo(BigDecimal.ZERO) < 0)) {
            throw new AppException(ServiceErrorCode.INVALID_REQUEST);
        }
    }

    private ServiceResponse toResponse(SpaService s, boolean withStaff) {
        List<StaffResponse> staff = withStaff ? repository.findStaffForService(s.getId()).stream()
                .map(row -> new StaffResponse(row.getAccountId(), row.getDisplayName())).toList() : List.of();
        return new ServiceResponse(s.getId(), s.getName(), s.getCategory(), s.getDescription(), s.getImageUrl(),
                s.getBasePrice(), s.getMinimumDurationMinutes(), s.getDurationAdjustable(), s.getDurationStepMinutes(),
                s.getPricePerDurationStep(), s.getPreparationBufferMinutes(), s.getCleanupBufferMinutes(),
                s.getActive(), staff);
    }
    private static boolean blank(String value) { return value == null || value.isBlank(); }
    private static String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static int orZero(Integer value) { return value == null ? 0 : value; }
}
