package com.kevin.lunaraspa.core.validation;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class PhoneNumberValidatorTest {
    @ParameterizedTest
    @ValueSource(strings = {"0912345678", "0912 345 678", "0912-345-678", "+84 912 345 678", "+12025550123"})
    void acceptsSupportedLocalAndInternationalNumbers(String value) {
        String normalized = PhoneNumberValidator.normalize(value);
        assertThat(PhoneNumberValidator.isValid(normalized)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"123", "---12", "abc", "84912345678", "012345678901", "+0123456789"})
    void rejectsInvalidNumbers(String value) {
        String normalized = PhoneNumberValidator.normalize(value);
        assertThat(PhoneNumberValidator.isValid(normalized)).isFalse();
    }
}
