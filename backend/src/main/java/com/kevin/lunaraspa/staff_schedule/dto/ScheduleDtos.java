package com.kevin.lunaraspa.staff_schedule.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public final class ScheduleDtos {
    private ScheduleDtos() {}
    public record WorkingHourRequest(Integer dayOfWeek, LocalTime startTime, LocalTime endTime, Boolean isActive) {}
    public record UpdateWorkingHoursRequest(List<WorkingHourRequest> workingHours) {}
    public record WorkingHourResponse(Long id, Integer dayOfWeek, LocalTime startTime, LocalTime endTime, Boolean isActive) {}
    public record TimeOffRequest(LocalDateTime startAt, LocalDateTime endAt, String reason) {}
    public record TimeOffResponse(Long id, Long staffId, LocalDateTime startAt, LocalDateTime endAt, String reason) {}
    public record BookingBlock(Long bookingId, String bookingCode, String status,
                               LocalDateTime startAt, LocalDateTime endAt) {}
    public record ScheduleResponse(Long staffId, List<WorkingHourResponse> workingHours,
                                   List<TimeOffResponse> timeOff, List<BookingBlock> bookingBlocks) {}
    public record UpdateResponse(Long staffId, boolean updated) {}
}
