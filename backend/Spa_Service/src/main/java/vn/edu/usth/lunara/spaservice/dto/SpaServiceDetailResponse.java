package vn.edu.usth.lunara.spaservice.dto;

import java.math.BigDecimal;
import java.util.List;

public record SpaServiceDetailResponse(
        Long id,
        String name,
        String category,
        BigDecimal basePrice,
        Integer minimumDurationMinutes,
        Integer preparationBufferMinutes,
        Integer cleanupBufferMinutes,
        List<StaffSummaryResponse> staff
) {
}
