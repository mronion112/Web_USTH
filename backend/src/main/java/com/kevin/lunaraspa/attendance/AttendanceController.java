package com.kevin.lunaraspa.attendance;

import com.kevin.lunaraspa.core.http.ResponseBuilder;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    private static final String MESSAGE = "Attendance is not supported by current lunara_spa schema";

    @PostMapping("/check-in")
    public ResponseEntity<Object> checkIn() { return unsupported(); }

    @PostMapping("/check-out")
    public ResponseEntity<Object> checkOut() { return unsupported(); }

    @GetMapping("/my")
    public ResponseEntity<Object> myAttendance() { return unsupported(); }

    private ResponseEntity<Object> unsupported() {
        return ResponseBuilder.error(HttpStatus.NOT_IMPLEMENTED, MESSAGE, "ATTENDANCE_NOT_SUPPORTED");
    }
}
