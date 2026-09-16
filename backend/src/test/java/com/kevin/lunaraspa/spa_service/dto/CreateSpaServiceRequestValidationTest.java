package com.kevin.lunaraspa.spa_service.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CreateSpaServiceRequestValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidatorFactory() {
        validatorFactory.close();
    }

    @Test
    void acceptsFixedDurationConfiguration() {
        CreateSpaServiceRequest request = validFixedDurationRequest();

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void acceptsAdjustableDurationConfiguration() {
        CreateSpaServiceRequest request = new CreateSpaServiceRequest(
                "Swedish Massage",
                "Massage",
                null,
                new BigDecimal("500000.00"),
                60,
                true,
                15,
                new BigDecimal("100000.00"),
                10,
                10
        );

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void rejectsInvalidDurationConfiguration() {
        CreateSpaServiceRequest request = new CreateSpaServiceRequest(
                "Swedish Massage",
                "Massage",
                null,
                new BigDecimal("500000.00"),
                60,
                true,
                null,
                null,
                10,
                10
        );

        Set<ConstraintViolation<CreateSpaServiceRequest>> violations = validator.validate(request);

        assertEquals(1, violations.size());
        assertEquals("durationConfigurationValid", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void rejectsBlankNameAndNegativeValues() {
        CreateSpaServiceRequest request = new CreateSpaServiceRequest(
                " ",
                "Massage",
                null,
                new BigDecimal("-1.00"),
                0,
                false,
                null,
                null,
                -1,
                -1
        );

        Set<ConstraintViolation<CreateSpaServiceRequest>> violations = validator.validate(request);

        assertEquals(5, violations.size());
    }

    private CreateSpaServiceRequest validFixedDurationRequest() {
        return new CreateSpaServiceRequest(
                "Swedish Massage",
                "Massage",
                "Relaxing full-body massage",
                new BigDecimal("500000.00"),
                60,
                false,
                null,
                null,
                10,
                10
        );
    }
}
