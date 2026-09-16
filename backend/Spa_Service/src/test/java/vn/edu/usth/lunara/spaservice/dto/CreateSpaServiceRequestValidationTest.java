package vn.edu.usth.lunara.spaservice.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CreateSpaServiceRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsValidAdjustableDuration() {
        CreateSpaServiceRequest request = new CreateSpaServiceRequest(
                "Facial Care",
                "FACIAL",
                "Sensitive skin treatment",
                new BigDecimal("350000"),
                60,
                true,
                30,
                new BigDecimal("120000"),
                10,
                10
        );

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void rejectsDurationStepForFixedDurationService() {
        CreateSpaServiceRequest request = new CreateSpaServiceRequest(
                "Facial Care",
                "FACIAL",
                null,
                new BigDecimal("350000"),
                60,
                false,
                30,
                new BigDecimal("120000"),
                10,
                10
        );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getMessage())
                .contains("duration step and price must be null when duration is fixed, or valid when adjustable");
    }

    @Test
    void rejectsNegativeMoneyDurationAndBuffers() {
        CreateSpaServiceRequest request = new CreateSpaServiceRequest(
                " ",
                " ",
                null,
                new BigDecimal("-1"),
                0,
                true,
                null,
                null,
                -1,
                -1
        );

        assertThat(validator.validate(request)).hasSizeGreaterThanOrEqualTo(7);
    }
}
