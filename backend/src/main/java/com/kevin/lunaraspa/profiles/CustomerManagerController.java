package com.kevin.lunaraspa.profiles;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.entity.Role;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.repository.RoleRepository;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.SystemErrorCode;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.core.validation.PhoneNumberValidator;
import com.kevin.lunaraspa.profiles.entity.CustomerProfile;
import com.kevin.lunaraspa.profiles.repository.CustomerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager/customers")
@RequiredArgsConstructor
public class CustomerManagerController {

    private final NamedParameterJdbcTemplate jdbc;
    private final CustomerProfileRepository customerProfileRepository;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Object> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size
    ) {
        String sql = """
                SELECT cp.account_id, a.display_name, a.email, cp.phone, cp.preferences, cp.internal_notes,
                       COUNT(b.id) AS bookings_count,
                       COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS completed_count,
                       COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) AS total_spent,
                       MAX(b.booking_start) AS last_visit
                FROM customer_profiles cp
                JOIN accounts a ON cp.account_id = a.id
                LEFT JOIN bookings b ON b.customer_account_id = cp.account_id
                LEFT JOIN payments p ON p.booking_id = b.id
                WHERE (:search IS NULL OR :search = ''
                       OR a.display_name LIKE :searchPattern
                       OR cp.phone LIKE :searchPattern
                       OR a.email LIKE :searchPattern)
                GROUP BY cp.account_id, a.display_name, a.email, cp.phone, cp.preferences, cp.internal_notes
                ORDER BY cp.account_id DESC
                LIMIT :limit OFFSET :offset
                """;

        Map<String, Object> params = new HashMap<>();
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        params.put("search", trimmedSearch);
        params.put("searchPattern", trimmedSearch != null ? "%" + trimmedSearch + "%" : null);
        params.put("limit", Math.max(1, Math.min(200, size)));
        params.put("offset", Math.max(0, page) * size);

        List<CustomerRow> list = jdbc.query(sql, params, (rs, rowNum) -> new CustomerRow(
                rs.getLong("account_id"),
                rs.getString("display_name"),
                rs.getString("email"),
                rs.getString("phone"),
                rs.getString("preferences"),
                rs.getString("internal_notes"),
                rs.getLong("bookings_count"),
                rs.getLong("completed_count"),
                rs.getBigDecimal("total_spent"),
                rs.getString("last_visit")
        ));

        return ResponseBuilder.ok(list, "Get customers successfully");
    }

    @PutMapping("/{accountId}/notes")
    @Transactional
    public ResponseEntity<Object> updateNotes(
            @PathVariable Long accountId,
            @RequestBody Map<String, String> request
    ) {
        CustomerProfile profile = customerProfileRepository.findById(accountId)
                .orElseThrow(() -> new AppException(SystemErrorCode.NOT_FOUND, "Customer not found"));

        if (request.containsKey("internalNotes")) {
            profile.setInternalNotes(request.get("internalNotes"));
        }
        if (request.containsKey("preferences")) {
            profile.setPreferences(request.get("preferences"));
        }
        customerProfileRepository.saveAndFlush(profile);

        return ResponseBuilder.ok(Map.of("message", "Updated notes successfully"));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Object> create(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String phone = request.get("phone");
        String email = request.get("email");
        String notes = request.get("internalNotes");
        String prefs = request.get("preferences");

        String normalizedPhone = PhoneNumberValidator.normalize(phone);
        if (name == null || name.isBlank() || normalizedPhone == null) {
            throw new AppException(SystemErrorCode.INVALID_REQUEST, "Name and phone are required");
        }
        if (!PhoneNumberValidator.isValid(normalizedPhone)) {
            throw new AppException(SystemErrorCode.INVALID_REQUEST, "Invalid phone number");
        }

        String emailPhone = normalizedPhone.replace("+", "");
        String actualEmail = (email != null && !email.isBlank()) ? email.trim() : (emailPhone + "@client.lunara.vn");
        if (accountRepository.findByEmail(actualEmail).isPresent()) {
            actualEmail = emailPhone + "." + System.currentTimeMillis() + "@client.lunara.vn";
        }

        Role customerRole = roleRepository.findByCodeIgnoreCase("CUSTOMER")
                .orElseThrow(() -> new AppException(SystemErrorCode.NOT_FOUND, "Role CUSTOMER not found"));

        Account account = Account.builder()
                .displayName(name.trim())
                .email(actualEmail)
                .role(customerRole)
                .isActive(true)
                .build();
        accountRepository.saveAndFlush(account);

        CustomerProfile profile = CustomerProfile.builder()
                .account(account)
                .phone(normalizedPhone)
                .internalNotes(notes != null ? notes.trim() : null)
                .preferences(prefs != null ? prefs.trim() : null)
                .build();
        customerProfileRepository.saveAndFlush(profile);

        return ResponseBuilder.ok(Map.of(
                "id", account.getId(),
                "name", account.getDisplayName(),
                "phone", profile.getPhone(),
                "email", account.getEmail()
        ), HttpStatus.CREATED, "Customer created successfully");
    }

    public record CustomerRow(
            Long id,
            String name,
            String email,
            String phone,
            String preferences,
            String internalNotes,
            long bookingsCount,
            long completedCount,
            BigDecimal totalSpent,
            String lastVisit
    ) {}
}
