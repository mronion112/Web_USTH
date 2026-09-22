package com.kevin.lunaraspa.staff_schedule;

import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.core.http.ResponseBuilder;
import com.kevin.lunaraspa.profiles.repository.StaffProfileRepository;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.staff_schedule.dto.ScheduleDtos.*;
import com.kevin.lunaraspa.staff_schedule.entity.*;
import com.kevin.lunaraspa.staff_schedule.exception.ScheduleErrorCode;
import com.kevin.lunaraspa.staff_schedule.repository.*;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/manager/staff/{staffId}")
@RequiredArgsConstructor
public class StaffScheduleController {
    private final StaffProfileRepository staffRepository;
    private final StaffWorkingHourRepository workingHourRepository;
    private final StaffTimeOffRepository timeOffRepository;
    private final BookingRepository bookingRepository;
    private final RealtimeEventPublisher realtimeEventPublisher;

    @GetMapping("/schedule")
    @Transactional(readOnly = true)
    public ResponseEntity<Object> schedule(@PathVariable Long staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        ensureStaff(staffId);
        LocalDateTime rangeStart = from == null ? LocalDateTime.now().toLocalDate().atStartOfDay() : from;
        LocalDateTime rangeEnd = to == null ? rangeStart.plusDays(31) : to;
        if (!rangeStart.isBefore(rangeEnd) || rangeEnd.isAfter(rangeStart.plusDays(93)))
            throw new AppException(ScheduleErrorCode.INVALID_TIME_OFF, "Schedule range must be at most 93 days");
        var hours = workingHourRepository.findByStaffAccountIdOrderByDayOfWeekAscStartTimeAsc(staffId).stream()
                .map(this::hourResponse).toList();
        var timeOff = timeOffRepository.findByStaffAccountIdOrderByStartAtAsc(staffId).stream()
                .map(this::timeOffResponse).toList();
        var blocks = bookingRepository
                .findByStaffAccountIdAndBookingStartLessThanAndBookingEndGreaterThanOrderByBookingStartAsc(
                        staffId, rangeEnd, rangeStart).stream()
                .map(b -> new BookingBlock(b.getId(), b.getBookingCode(), b.getStatus().name(),
                        b.getBookingStart(), b.getBookingEnd())).toList();
        return ResponseBuilder.ok(new ScheduleResponse(staffId, hours, timeOff, blocks), "Get staff schedule successfully");
    }

    @PutMapping("/working-hours")
    @Transactional
    public ResponseEntity<Object> update(@PathVariable Long staffId, @RequestBody UpdateWorkingHoursRequest request) {
        ensureStaff(staffId);
        if (request == null || request.workingHours() == null) throw new AppException(ScheduleErrorCode.INVALID_WORKING_HOURS);
        Set<String> starts = new HashSet<>();
        for (WorkingHourRequest h : request.workingHours()) {
            if (h == null || h.dayOfWeek() == null || h.dayOfWeek() < 1 || h.dayOfWeek() > 7
                    || h.startTime() == null || h.endTime() == null || !h.startTime().isBefore(h.endTime())
                    || !starts.add(h.dayOfWeek() + ":" + h.startTime())) {
                throw new AppException(ScheduleErrorCode.INVALID_WORKING_HOURS);
            }
        }
        workingHourRepository.deleteByStaffAccountId(staffId);
        workingHourRepository.flush();
        workingHourRepository.saveAll(request.workingHours().stream().map(h -> StaffWorkingHour.builder()
                .staffAccountId(staffId).dayOfWeek(h.dayOfWeek()).startTime(h.startTime()).endTime(h.endTime())
                .active(h.isActive() == null || h.isActive()).build()).toList());
        realtimeEventPublisher.scheduleChanged(staffId, "WORKING_HOURS_CHANGED");
        return ResponseBuilder.ok(new UpdateResponse(staffId, true), "Update working hours successfully");
    }

    @PostMapping("/time-off")
    @Transactional
    public ResponseEntity<Object> createTimeOff(@PathVariable Long staffId, @RequestBody TimeOffRequest request) {
        ensureStaff(staffId);
        if (request == null || request.startAt() == null || request.endAt() == null
                || !request.startAt().isBefore(request.endAt())) throw new AppException(ScheduleErrorCode.INVALID_TIME_OFF);
        if (timeOffRepository.countOverlap(staffId, request.startAt(), request.endAt()) > 0)
            throw new AppException(ScheduleErrorCode.TIME_OFF_OVERLAP);
        StaffTimeOff saved = timeOffRepository.saveAndFlush(StaffTimeOff.builder().staffAccountId(staffId)
                .startAt(request.startAt()).endAt(request.endAt()).reason(trim(request.reason())).build());
        realtimeEventPublisher.scheduleChanged(staffId, "TIME_OFF_CREATED");
        return ResponseBuilder.ok(timeOffResponse(saved), HttpStatus.CREATED, "Create time-off successfully");
    }

    private void ensureStaff(Long id) {
        if (id == null || id <= 0 || !staffRepository.existsById(id)) throw new AppException(ScheduleErrorCode.STAFF_NOT_FOUND);
    }
    private WorkingHourResponse hourResponse(StaffWorkingHour h) {
        return new WorkingHourResponse(h.getId(), h.getDayOfWeek(), h.getStartTime(), h.getEndTime(), h.getActive());
    }
    private TimeOffResponse timeOffResponse(StaffTimeOff t) {
        return new TimeOffResponse(t.getId(), t.getStaffAccountId(), t.getStartAt(), t.getEndAt(), t.getReason());
    }
    private static String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
