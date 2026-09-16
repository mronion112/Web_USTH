package com.kevin.lunaraspa.booking.repository;

import java.math.BigDecimal;

public interface ServiceSnapshotProjection {
    Long getId();

    String getName();

    BigDecimal getBasePrice();

    Integer getMinimumDurationMinutes();

    Boolean getDurationAdjustable();

    Integer getDurationStepMinutes();

    BigDecimal getPricePerDurationStep();

    Integer getPreparationBufferMinutes();

    Integer getCleanupBufferMinutes();
}
