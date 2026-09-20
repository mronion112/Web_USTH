package com.kevin.lunaraspa.staff_schedule.exception;

import com.kevin.lunaraspa.core.exception.BaseErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter @RequiredArgsConstructor
public enum ScheduleErrorCode implements BaseErrorCode {
    STAFF_NOT_FOUND("SCH_001", "Staff not found", HttpStatus.NOT_FOUND),
    INVALID_WORKING_HOURS("SCH_002", "Invalid working hours", HttpStatus.BAD_REQUEST),
    INVALID_TIME_OFF("SCH_003", "Time-off start must be before end", HttpStatus.BAD_REQUEST),
    TIME_OFF_OVERLAP("SCH_004", "Time-off overlaps an existing entry", HttpStatus.CONFLICT);
    private final String code; private final String message; private final HttpStatus status;
}
