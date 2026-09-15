package com.kevin.lunaraspa.service.impl;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.dto.profile.ProfileResponseDTO;
import com.kevin.lunaraspa.dto.profile.ProfileUpdateRequest;
import com.kevin.lunaraspa.entity.Account;
import com.kevin.lunaraspa.entity.CustomerProfile;
import com.kevin.lunaraspa.repository.AccountRepository;
import com.kevin.lunaraspa.repository.CustomerProfileRepository;
import com.kevin.lunaraspa.core.exception.AuthErrorCode;
import com.kevin.lunaraspa.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final AccountRepository accountRepository;
    private final CustomerProfileRepository customerProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public ProfileResponseDTO getMyProfile(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AuthErrorCode.ACCOUNT_NOT_FOUND));

        String phone = null;
        String preferences = null;

        if ("CUSTOMER".equals(account.getRole().getCode())) {
            CustomerProfile profile = customerProfileRepository.findById(account.getId()).orElse(null);
            if (profile != null) {
                phone = profile.getPhone();
                preferences = profile.getPreferences();
            }
        }

        return ProfileResponseDTO.builder()
                .id(account.getId())
                .displayName(account.getDisplayName())
                .email(account.getEmail())
                .phone(phone)
                .preferences(preferences)
                .role(account.getRole().getCode())
                .build();
    }

    @Override
    @Transactional
    public ProfileResponseDTO updateMyProfile(String email, ProfileUpdateRequest request) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AuthErrorCode.ACCOUNT_NOT_FOUND));

        if (request.getDisplayName() != null) {
            account.setDisplayName(request.getDisplayName());
            accountRepository.save(account);
        }

        String phone = null;
        String preferences = null;

        if ("CUSTOMER".equals(account.getRole().getCode())) {
            CustomerProfile profile = customerProfileRepository.findById(account.getId())
                    .orElseGet(() -> {
                        CustomerProfile p = CustomerProfile.builder().account(account).build();
                        return p;
                    });
            
            if (request.getPhone() != null) {
                profile.setPhone(request.getPhone());
            }
            if (request.getPreferences() != null) {
                profile.setPreferences(request.getPreferences());
            }
            customerProfileRepository.save(profile);
            
            phone = profile.getPhone();
            preferences = profile.getPreferences();
        }

        return ProfileResponseDTO.builder()
                .id(account.getId())
                .displayName(account.getDisplayName())
                .email(account.getEmail())
                .phone(phone)
                .preferences(preferences)
                .role(account.getRole().getCode())
                .build();
    }
}
