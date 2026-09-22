package com.kevin.lunaraspa.booking.service.impl;

import com.kevin.lunaraspa.booking.dto.*;
import com.kevin.lunaraspa.booking.dto.AvailabilityResponse.AvailableSlot;
import com.kevin.lunaraspa.booking.exception.BookingFeatureErrorCode;
import com.kevin.lunaraspa.booking.repository.*;
import com.kevin.lunaraspa.booking.service.AvailabilityService;
import com.kevin.lunaraspa.core.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityServiceImpl implements AvailabilityService {
    private static final int DEFAULT_INTERVAL = 30;
    private static final int MAX_RANGE_DAYS = 31;
    private final BookingRepository repository;

    @Override
    @Transactional(readOnly = true)
    public AvailabilityResponse findAvailability(AvailabilityRequest request) {
        validateBase(request);
        Set<Long> serviceIds = request.getItems().stream().map(BookingItemRequest::getServiceId)
                .collect(Collectors.toSet());
        if (serviceIds.size() != request.getItems().size())
            throw new AppException(BookingFeatureErrorCode.DUPLICATE_SERVICE);
        Map<Long, ServiceSnapshotProjection> services = repository.findActiveServicesByIds(serviceIds).stream()
                .collect(Collectors.toMap(ServiceSnapshotProjection::getId, Function.identity()));
        if (services.size() != serviceIds.size()) throw new AppException(BookingFeatureErrorCode.SERVICE_NOT_FOUND);

        int duration = 0, preparation = 0, cleanup = 0;
        for (BookingItemRequest item : request.getItems()) {
            ServiceSnapshotProjection service = services.get(item.getServiceId());
            validateDuration(item, service);
            duration += item.getDurationMinutes();
            preparation += value(service.getPreparationBufferMinutes());
            cleanup += value(service.getCleanupBufferMinutes());
        }
        int interval = request.getSlotIntervalMinutes() == null ? DEFAULT_INTERVAL : request.getSlotIntervalMinutes();
        if (interval < 15 || interval > 120 || interval % 5 != 0)
            throw new AppException(BookingFeatureErrorCode.INVALID_BOOKING_START, "Slot interval must be 15-120 minutes in 5-minute steps");
        List<Long> staffIds = request.getStaffAccountId() == null
                ? repository.findBookableStaffIds() : List.of(request.getStaffAccountId());
        List<AvailableSlot> slots = new ArrayList<>();
        for (Long staffId : staffIds) {
            if (repository.countSupportedServices(staffId, serviceIds) != serviceIds.size()) continue;
            for (LocalDateTime start = request.getFrom(); !start.plusMinutes(duration).isAfter(request.getTo());
                 start = start.plusMinutes(interval)) {
                LocalDateTime end = start.plusMinutes(duration);
                if (!start.toLocalDate().equals(end.toLocalDate())) continue;
                LocalDateTime occupiedStart = start.minusMinutes(preparation);
                LocalDateTime occupiedEnd = end.plusMinutes(cleanup);
                if (!occupiedStart.toLocalDate().equals(occupiedEnd.toLocalDate())) continue;
                if (repository.countCoveringWorkingHours(staffId, start.getDayOfWeek().getValue(),
                        occupiedStart.toLocalTime(), occupiedEnd.toLocalTime()) == 0) continue;
                if (repository.countOverlappingTimeOff(staffId, occupiedStart, occupiedEnd) > 0
                        || repository.countOverlappingBookings(staffId, occupiedStart, occupiedEnd, null) > 0) continue;
                slots.add(AvailableSlot.builder().staffAccountId(staffId)
                        .staffName(repository.findAccountDisplayName(staffId).orElse(null))
                        .bookingStart(start).bookingEnd(end).build());
            }
        }
        return AvailabilityResponse.builder().totalDurationMinutes(duration).slots(slots).build();
    }

    private void validateBase(AvailabilityRequest r) {
        if (r == null || r.getItems() == null || r.getItems().isEmpty())
            throw new AppException(BookingFeatureErrorCode.ITEMS_REQUIRED);
        if (r.getFrom() == null || r.getTo() == null || !r.getFrom().isBefore(r.getTo())
                || r.getFrom().isBefore(LocalDateTime.now())
                || r.getTo().isAfter(r.getFrom().plusDays(MAX_RANGE_DAYS)))
            throw new AppException(BookingFeatureErrorCode.INVALID_BOOKING_START,
                    "Availability range must be future-facing and no longer than 31 days");
        if (r.getStaffAccountId() != null && r.getStaffAccountId() <= 0)
            throw new AppException(BookingFeatureErrorCode.INVALID_STAFF_ID);
        for (BookingItemRequest item : r.getItems()) {
            if (item == null || item.getServiceId() == null || item.getServiceId() <= 0
                    || item.getDurationMinutes() == null || item.getDurationMinutes() <= 0)
                throw new AppException(BookingFeatureErrorCode.INVALID_SERVICE_DURATION);
        }
    }
    private void validateDuration(BookingItemRequest item, ServiceSnapshotProjection service) {
        int requested = item.getDurationMinutes(), minimum = service.getMinimumDurationMinutes();
        if (!Boolean.TRUE.equals(service.getDurationAdjustable()) && requested != minimum)
            throw new AppException(BookingFeatureErrorCode.INVALID_SERVICE_DURATION);
        if (Boolean.TRUE.equals(service.getDurationAdjustable())) {
            Integer step = service.getDurationStepMinutes();
            if (requested < minimum || step == null || step <= 0 || (requested - minimum) % step != 0)
                throw new AppException(BookingFeatureErrorCode.INVALID_SERVICE_DURATION);
        }
    }
    private static int value(Integer value) { return value == null ? 0 : value; }
}
