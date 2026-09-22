package com.kevin.lunaraspa;

import com.kevin.lunaraspa.attendance.AttendanceController;
import com.kevin.lunaraspa.dashboard_manager.DashboardController;
import com.kevin.lunaraspa.dashboard_manager.ReportController;
import com.kevin.lunaraspa.booking.BookingController;
import com.kevin.lunaraspa.payment.PaymentController;
import com.kevin.lunaraspa.payment.sepay.SepayController;
import com.kevin.lunaraspa.spa_service.SpaServiceController;
import com.kevin.lunaraspa.staff_schedule.StaffScheduleController;
import com.kevin.lunaraspa.staff_task.StaffTaskController;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

class MissingEndpointContractTest {
    @Test
    void exposesEveryEndpointDeclaredByTheFeatureGuides() throws Exception {
        endpoint(SpaServiceController.class, "list", GetMapping.class, "/services");
        endpoint(SpaServiceController.class, "detail", GetMapping.class, "/services/{id}");
        endpoint(SpaServiceController.class, "create", PostMapping.class, "/manager/services");
        endpoint(StaffScheduleController.class, "schedule", GetMapping.class, "/schedule");
        endpoint(StaffScheduleController.class, "update", PutMapping.class, "/working-hours");
        endpoint(StaffScheduleController.class, "createTimeOff", PostMapping.class, "/time-off");
        endpoint(StaffTaskController.class, "tasks", GetMapping.class, "");
        endpoint(StaffTaskController.class, "start", PatchMapping.class, "/{bookingId}/start");
        endpoint(StaffTaskController.class, "complete", PatchMapping.class, "/{bookingId}/complete");
        endpoint(PaymentController.class, "create", PostMapping.class, "");
        endpoint(PaymentController.class, "getForBooking", GetMapping.class, "/booking/{bookingId}");
        endpoint(PaymentController.class, "paid", PatchMapping.class, "/{paymentId}/paid");
        endpoint(PaymentController.class, "refund", PostMapping.class, "/{paymentId}/refund");
        endpoint(SepayController.class, "webhook", PostMapping.class, "/webhook");
        endpoint(SepayController.class, "transactions", GetMapping.class, "/transactions");
        endpoint(SepayController.class, "reconcile", PostMapping.class, "/transactions/{sepayId}/reconcile");
        endpoint(DashboardController.class, "dashboard", GetMapping.class, "");
        endpoint(AttendanceController.class, "checkIn", PostMapping.class, "/check-in");
        endpoint(AttendanceController.class, "checkOut", PostMapping.class, "/check-out");
        endpoint(AttendanceController.class, "myAttendance", GetMapping.class, "/my");
        endpoint(BookingController.class, "availability", PostMapping.class, "/availability");
        endpoint(BookingController.class, "searchBookings", GetMapping.class, "/manager/bookings");
        endpoint(BookingController.class, "checkIn", PatchMapping.class, "/manager/bookings/{bookingId}/check-in");
        endpoint(BookingController.class, "reschedule", PatchMapping.class, "/bookings/{bookingCode}/reschedule");
        endpoint(BookingController.class, "rescheduleByManager", PatchMapping.class,
                "/manager/bookings/{bookingId}/reschedule");
        endpoint(BookingController.class, "resendBookingEmail", PostMapping.class,
                "/manager/bookings/{bookingId}/email/resend");
        endpoint(ReportController.class, "summary", GetMapping.class, "/summary");
    }

    @Test
    void attendanceExplicitlyReturnsNotImplementedUntilSchemaSupportsIt() {
        var response = new AttendanceController().checkIn();
        assertEquals(HttpStatus.NOT_IMPLEMENTED, response.getStatusCode());
    }

    private static void endpoint(Class<?> controller, String methodName,
                                 Class<? extends Annotation> annotation, String path) throws Exception {
        Method method = java.util.Arrays.stream(controller.getDeclaredMethods())
                .filter(candidate -> candidate.getName().equals(methodName)).findFirst().orElseThrow();
        Annotation mapping = method.getAnnotation(annotation);
        assertNotNull(mapping, () -> controller.getSimpleName() + "." + methodName + " lacks " + annotation.getSimpleName());
        String[] values = (String[]) annotation.getMethod("value").invoke(mapping);
        if (path.isEmpty()) assertEquals(0, values.length);
        else assertArrayEquals(new String[]{path}, values);
    }
}
