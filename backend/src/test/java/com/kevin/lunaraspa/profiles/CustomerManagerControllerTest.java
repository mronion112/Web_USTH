package com.kevin.lunaraspa.profiles;

import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.repository.RoleRepository;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.profiles.repository.CustomerProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class CustomerManagerControllerTest {
    @Test
    void createRejectsMalformedPhoneBeforeWritingCustomerData() {
        NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
        CustomerProfileRepository profiles = mock(CustomerProfileRepository.class);
        AccountRepository accounts = mock(AccountRepository.class);
        RoleRepository roles = mock(RoleRepository.class);
        CustomerManagerController controller = new CustomerManagerController(jdbc, profiles, accounts, roles);

        assertThatThrownBy(() -> controller.create(Map.of("name", "Customer", "phone", "123")))
                .isInstanceOf(AppException.class)
                .hasMessage("Invalid phone number");

        verifyNoInteractions(profiles, accounts, roles);
    }
}
