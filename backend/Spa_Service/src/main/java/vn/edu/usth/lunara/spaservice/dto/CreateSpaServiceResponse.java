package vn.edu.usth.lunara.spaservice.dto;

public record CreateSpaServiceResponse(
        Long id,
        String name,
        boolean isActive
) {
}
