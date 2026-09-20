package com.kevin.lunaraspa.authentication_account.security;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.entity.Role;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private RoleRepository roleRepository;

    @Test
    void createsNewGoogleAccountWithCustomerRoleCode() {
        OAuth2User oauthUser = mock(OAuth2User.class);
        Role customerRole = Role.builder().code("CUSTOMER").name("Customer").build();
        when(oauthUser.getAttribute("email")).thenReturn("new.customer@example.com");
        when(oauthUser.getAttribute("sub")).thenReturn("google-subject");
        when(oauthUser.getAttribute("name")).thenReturn("New Customer");
        when(oauthUser.getAttribute("picture")).thenReturn("https://example.com/avatar.png");
        when(accountRepository.findByEmail("new.customer@example.com")).thenReturn(Optional.empty());
        when(roleRepository.findByCode("CUSTOMER")).thenReturn(Optional.of(customerRole));

        CustomOAuth2UserService service = new CustomOAuth2UserService(accountRepository, roleRepository);
        service.upsertAccount(oauthUser);

        ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
        verify(roleRepository).findByCode("CUSTOMER");
        verify(accountRepository).save(accountCaptor.capture());
        assertEquals("CUSTOMER", accountCaptor.getValue().getRole().getCode());
        assertNotNull(accountCaptor.getValue().getCustomerProfile());
    }
}
