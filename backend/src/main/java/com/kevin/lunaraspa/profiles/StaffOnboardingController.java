package com.kevin.lunaraspa.profiles;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.repository.RoleRepository;
import com.kevin.lunaraspa.authentication_account.security.SecurityUtils;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.SystemErrorCode;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.profiles.entity.StaffProfile;
import com.kevin.lunaraspa.profiles.repository.StaffProfileRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import com.kevin.lunaraspa.spa_service.repository.SpaServiceRepository;
import com.kevin.lunaraspa.staff_schedule.entity.StaffWorkingHour;
import com.kevin.lunaraspa.staff_schedule.repository.StaffWorkingHourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/manager/staff")
@RequiredArgsConstructor
public class StaffOnboardingController {
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final SpaServiceRepository serviceRepository;
    private final StaffWorkingHourRepository workingHourRepository;
    private final JdbcTemplate jdbc;
    private final RealtimeEventPublisher realtimeEventPublisher;

    public record WorkingHourInput(Integer dayOfWeek, LocalTime startTime, LocalTime endTime, Boolean isActive) {}
    public record CreateStaffRequest(String name, String email, String jobTitle, Boolean isBookable,
                                     List<Long> serviceIds, List<WorkingHourInput> workingHours) {}

    @PostMapping
    @Transactional
    public Object create(@RequestBody CreateStaffRequest request) {
        Account actor = currentManager();
        validate(request);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (accountRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new AppException(SystemErrorCode.INVALID_REQUEST, "Email already exists");
        }
        Set<Long> serviceIds = new HashSet<>(request.serviceIds() == null ? List.of() : request.serviceIds());
        if (serviceIds.size() != (request.serviceIds() == null ? 0 : request.serviceIds().size())
                || serviceRepository.findAllById(serviceIds).stream()
                        .filter(service -> Boolean.TRUE.equals(service.getActive())).count() != serviceIds.size()) {
            throw new AppException(SystemErrorCode.INVALID_REQUEST, "Every service must exist and be active");
        }
        var therapistRole = roleRepository.findByCodeIgnoreCase("THERAPIST")
                .orElseThrow(() -> new AppException(SystemErrorCode.NOT_FOUND, "THERAPIST role not found"));
        Account account = accountRepository.saveAndFlush(Account.builder().email(email)
                .displayName(request.name().trim()).role(therapistRole).isActive(true)
                .provisionedByAccount(actor).build());
        StaffProfile profile = staffProfileRepository.saveAndFlush(StaffProfile.builder().account(account)
                .employeeCode("EMP-" + String.format("%05d", account.getId()))
                .jobTitle(request.jobTitle().trim()).isBookable(Boolean.TRUE.equals(request.isBookable())).build());
        for (Long serviceId : serviceIds) {
            jdbc.update("INSERT INTO staff_services (staff_account_id, service_id) VALUES (?, ?)", account.getId(), serviceId);
        }
        List<StaffWorkingHour> hours = request.workingHours() == null ? List.of() : request.workingHours().stream()
                .map(hour -> StaffWorkingHour.builder().staffAccountId(account.getId()).dayOfWeek(hour.dayOfWeek())
                        .startTime(hour.startTime()).endTime(hour.endTime())
                        .active(hour.isActive() == null || hour.isActive()).build()).toList();
        workingHourRepository.saveAll(hours);
        realtimeEventPublisher.scheduleChanged(account.getId(), "STAFF_ONBOARDED");
        return ResponseBuilder.ok(Map.of("accountId", account.getId(), "email", account.getEmail(),
                "displayName", account.getDisplayName(), "role", "THERAPIST",
                "employeeCode", profile.getEmployeeCode(), "isBookable", profile.getIsBookable()),
                HttpStatus.CREATED, "Staff onboarded successfully");
    }

    private Account currentManager() {
        Account actor = accountRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new AppException(SystemErrorCode.ACCESS_DENIED));
        String role = actor.getRole().getCode().replace("ROLE_", "").toUpperCase(Locale.ROOT);
        if (!Boolean.TRUE.equals(actor.getIsActive()) || !(role.equals("OWNER") || role.equals("MANAGER"))) {
            throw new AppException(SystemErrorCode.ACCESS_DENIED);
        }
        return actor;
    }

    private void validate(CreateStaffRequest request) {
        if (request == null || blank(request.name()) || blank(request.email()) || blank(request.jobTitle())) {
            throw new AppException(SystemErrorCode.INVALID_REQUEST, "Name, email and job title are required");
        }
        List<WorkingHourInput> hours = request.workingHours() == null ? List.of() : request.workingHours();
        Set<String> unique = new HashSet<>();
        for (WorkingHourInput hour : hours) {
            if (hour == null || hour.dayOfWeek() == null || hour.dayOfWeek() < 1 || hour.dayOfWeek() > 7
                    || hour.startTime() == null || hour.endTime() == null || !hour.startTime().isBefore(hour.endTime())
                    || !unique.add(hour.dayOfWeek() + ":" + hour.startTime())) {
                throw new AppException(SystemErrorCode.INVALID_REQUEST, "Invalid working hours");
            }
        }
        if (Boolean.TRUE.equals(request.isBookable())
                && ((request.serviceIds() == null || request.serviceIds().isEmpty())
                || hours.stream().noneMatch(hour -> hour.isActive() == null || hour.isActive()))) {
            throw new AppException(SystemErrorCode.INVALID_REQUEST,
                    "Bookable therapists need at least one service and one active working shift");
        }
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
}
