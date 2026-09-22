package com.kevin.lunaraspa.booking;

import com.kevin.lunaraspa.booking.dto.*;
import com.kevin.lunaraspa.booking.repository.*;
import com.kevin.lunaraspa.booking.service.impl.AvailabilityServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;

import java.time.*;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class AvailabilityServiceTest {
    @Mock BookingRepository repository;
    @InjectMocks AvailabilityServiceImpl service;

    @Test
    void returnsQualifiedFreeSlotsAndAppliesPreparationAndCleanupBuffers() {
        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
        ServiceSnapshotProjection snapshot = mock(ServiceSnapshotProjection.class);
        when(snapshot.getId()).thenReturn(1L);
        when(snapshot.getMinimumDurationMinutes()).thenReturn(60);
        when(snapshot.getDurationAdjustable()).thenReturn(false);
        when(snapshot.getPreparationBufferMinutes()).thenReturn(10);
        when(snapshot.getCleanupBufferMinutes()).thenReturn(15);
        when(repository.findActiveServicesByIds(java.util.Set.of(1L))).thenReturn(List.of(snapshot));
        when(repository.findBookableStaffIds()).thenReturn(List.of(21L));
        when(repository.countSupportedServices(21L, java.util.Set.of(1L))).thenReturn(1L);
        when(repository.countCoveringWorkingHours(eq(21L), anyInt(), any(), any())).thenReturn(1L);
        when(repository.findAccountDisplayName(21L)).thenReturn(java.util.Optional.of("Lan"));

        AvailabilityRequest request = AvailabilityRequest.builder()
                .items(List.of(BookingItemRequest.builder().serviceId(1L).durationMinutes(60).build()))
                .from(start).to(start.plusHours(1)).build();
        var result = service.findAvailability(request);

        assertEquals(1, result.getSlots().size());
        assertEquals(start, result.getSlots().getFirst().getBookingStart());
        verify(repository).countCoveringWorkingHours(
                21L,
                start.getDayOfWeek().getValue(),
                start.minusMinutes(10).toLocalTime(),
                start.plusMinutes(75).toLocalTime()
        );
        verify(repository).countOverlappingTimeOff(21L, start.minusMinutes(10), start.plusMinutes(75));
        verify(repository).countOverlappingBookings(21L, start.minusMinutes(10), start.plusMinutes(75), null);
    }
}
