package com.kevin.lunaraspa.profiles.service.impl;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.exception.AuthErrorCode;
import com.kevin.lunaraspa.core.exception.ProfileErrorCode;
import com.kevin.lunaraspa.core.validation.PhoneNumberValidator;
import com.kevin.lunaraspa.profiles.dto.ProfileResponseDTO;
import com.kevin.lunaraspa.profiles.dto.ProfileUpdateRequest;
import com.kevin.lunaraspa.profiles.entity.CustomerProfile;
import com.kevin.lunaraspa.profiles.repository.CustomerProfileRepository;
import com.kevin.lunaraspa.profiles.repository.StaffProfileRepository;
import com.kevin.lunaraspa.profiles.service.ProfileService;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {
    private final AccountRepository accountRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final StaffProfileRepository staffProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public ProfileResponseDTO getMyProfile(String email) {
        return response(activeAccount(email));
    }

    @Override
    @Transactional
    public ProfileResponseDTO updateMyProfile(String email, ProfileUpdateRequest request) {
        Account account = activeAccount(email);
        if (!"CUSTOMER".equals(account.getRole().getCode())) {
            throw new AppException(ProfileErrorCode.PROFILE_FORBIDDEN);
        }
        if (request == null || !(request.isDisplayNamePresent() || request.isPhonePresent() || request.isPreferencesPresent())) {
            throw new AppException(ProfileErrorCode.INVALID_PROFILE_DATA);
        }
        String name = normalize(request.getDisplayName());
        String phone = PhoneNumberValidator.normalize(request.getPhone());
        String preferences = normalize(request.getPreferences());
        if (request.isDisplayNamePresent() && (name == null || name.codePointCount(0, name.length()) > 150)) {
            throw new AppException(ProfileErrorCode.INVALID_PROFILE_DATA);
        }
        if (phone != null && !PhoneNumberValidator.isValid(phone)) {
            throw new AppException(ProfileErrorCode.INVALID_PROFILE_DATA);
        }
        if (preferences != null && preferences.getBytes(StandardCharsets.UTF_8).length > 65535) {
            throw new AppException(ProfileErrorCode.INVALID_PROFILE_DATA);
        }
        // Validate all input before mutating managed entities.
        if (request.isDisplayNamePresent()) {
            account.setDisplayName(name);
            accountRepository.save(account);
        }
        CustomerProfile profile = customerProfileRepository.findById(account.getId())
                .orElseGet(() -> CustomerProfile.builder().account(account).build());
        if (request.isPhonePresent()) profile.setPhone(phone);
        if (request.isPreferencesPresent()) profile.setPreferences(preferences);
        customerProfileRepository.save(profile);
        return baseResponse(account).phone(profile.getPhone()).preferences(profile.getPreferences()).build();
    }

    private Account activeAccount(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AuthErrorCode.ACCOUNT_NOT_FOUND));
        if (!Boolean.TRUE.equals(account.getIsActive())) throw new AppException(ProfileErrorCode.ACCOUNT_INACTIVE);
        return account;
    }

    private ProfileResponseDTO response(Account account) {
        var result = baseResponse(account);
        if ("CUSTOMER".equals(account.getRole().getCode())) {
            customerProfileRepository.findById(account.getId()).ifPresent(profile ->
                    result.phone(profile.getPhone()).preferences(profile.getPreferences()));
        } else {
            staffProfileRepository.findById(account.getId()).ifPresent(profile -> result
                    .employeeCode(profile.getEmployeeCode()).jobTitle(profile.getJobTitle())
                    .isBookable(profile.getIsBookable()));
        }
        return result.build();
    }

    private ProfileResponseDTO.ProfileResponseDTOBuilder baseResponse(Account account) {
        // Retain id for existing clients; accountId matches the Guide.
        return ProfileResponseDTO.builder().id(account.getId()).accountId(account.getId())
                .displayName(account.getDisplayName()).email(account.getEmail()).role(account.getRole().getCode());
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
