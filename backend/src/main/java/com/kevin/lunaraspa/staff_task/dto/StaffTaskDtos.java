package com.kevin.lunaraspa.staff_task.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class StaffTaskDtos {
    private StaffTaskDtos() {}
    public record TaskService(String name, Integer durationMinutes) {}
    public record TaskResponse(Long bookingId, String bookingCode, String status,
                               LocalDateTime bookingStart, LocalDateTime bookingEnd,
                               String customerName, List<TaskService> services) {}
    public record TransitionResponse(Long bookingId, String status,
                                     LocalDateTime serviceStartedAt, LocalDateTime completedAt) {}
}
