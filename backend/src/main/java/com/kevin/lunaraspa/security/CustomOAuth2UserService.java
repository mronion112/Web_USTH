package com.kevin.lunaraspa.security;

import com.kevin.lunaraspa.entity.Account;
import com.kevin.lunaraspa.entity.CustomerProfile;
import com.kevin.lunaraspa.entity.Role;
import com.kevin.lunaraspa.repository.AccountRepository;
import com.kevin.lunaraspa.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = Optional.ofNullable(oAuth2User.getAttribute("email"))
                .map(Object::toString)
                .orElseThrow(() -> new OAuth2AuthenticationException("Email not found from OAuth2 provider"));
                
        String subject = oAuth2User.getAttribute("sub");
        String name = oAuth2User.getAttribute("name");
        String avatar = oAuth2User.getAttribute("picture");

        accountRepository.findByEmail(email).ifPresentOrElse(
            account -> updateExistingAccount(account, subject, avatar),
            () -> createNewCustomerAccount(email, subject, name, avatar)
        );

        return oAuth2User;
    }

    private void updateExistingAccount(Account account, String subject, String avatar) {
        boolean updated = false;
        if (account.getGoogleSubject() == null) {
            account.setGoogleSubject(subject);
            updated = true;
        }
        if (account.getAvatarUrl() == null && avatar != null) {
            account.setAvatarUrl(avatar);
            updated = true;
        }
        if (updated) {
            accountRepository.save(account);
        }
    }

    private void createNewCustomerAccount(String email, String subject, String name, String avatar) {
        Role customerRole = roleRepository.findByCode("ROLE_CUSTOMER")
                .orElseThrow(() -> new OAuth2AuthenticationException("ROLE_CUSTOMER not found"));

        Account account = Account.builder()
                .email(email)
                .googleSubject(subject)
                .displayName(name != null ? name : email)
                .avatarUrl(avatar)
                .role(customerRole)
                .isActive(true)
                .build();

        CustomerProfile profile = CustomerProfile.builder()
                .account(account)
                .phone("")
                .build();
                
        account.setCustomerProfile(profile);
        accountRepository.save(account);
    }
}
