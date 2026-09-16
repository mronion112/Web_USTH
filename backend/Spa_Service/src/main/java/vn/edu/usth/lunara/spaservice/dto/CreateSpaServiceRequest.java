package vn.edu.usth.lunara.spaservice.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateSpaServiceRequest(
        @NotBlank(message = "must not be blank")
        @Size(max = 150, message = "must not exceed 150 characters")
        String name,

        @NotBlank(message = "must not be blank")
        @Size(max = 100, message = "must not exceed 100 characters")
        String category,

        String description,

        @NotNull(message = "is required")
        @DecimalMin(value = "0.00", message = "must be greater than or equal to 0")
        BigDecimal basePrice,

        @NotNull(message = "is required")
        @Positive(message = "must be greater than 0")
        Integer minimumDurationMinutes,

        boolean isDurationAdjustable,

        @Positive(message = "must be greater than 0")
        Integer durationStepMinutes,

        @DecimalMin(value = "0.00", message = "must be greater than or equal to 0")
        BigDecimal pricePerDurationStep,

        @NotNull(message = "is required")
        @PositiveOrZero(message = "must be greater than or equal to 0")
        Integer preparationBufferMinutes,

        @NotNull(message = "is required")
        @PositiveOrZero(message = "must be greater than or equal to 0")
        Integer cleanupBufferMinutes
) {
    @AssertTrue(message = "duration step and price must be null when duration is fixed, or valid when adjustable")
    public boolean isDurationConfigurationValid() {
        if (isDurationAdjustable) {
            return durationStepMinutes != null
                    && durationStepMinutes > 0
                    && pricePerDurationStep != null
                    && pricePerDurationStep.signum() >= 0;
        }
        return durationStepMinutes == null && pricePerDurationStep == null;
    }
}
