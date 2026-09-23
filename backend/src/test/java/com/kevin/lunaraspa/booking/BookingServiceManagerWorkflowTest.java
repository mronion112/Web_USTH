package com.kevin.lunaraspa.booking;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.entity.Role;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.repository.RoleRepository;
import com.kevin.lunaraspa.booking.dto.RescheduleBookingRequest;
import com.kevin.lunaraspa.booking.dto.BookingSortField;
import com.kevin.lunaraspa.booking.entity.AssignmentSource;
import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.entity.BookingItem;
import com.kevin.lunaraspa.booking.entity.BookingStatus;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.booking.repository.ServiceSnapshotProjection;
import com.kevin.lunaraspa.booking.service.impl.BookingServiceImpl;
import com.kevin.lunaraspa.profiles.repository.CustomerProfileRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.ArgumentCaptor;

class BookingServiceManagerWorkflowTest {
    private BookingRepository bookings;
    private AccountRepository accounts;
    private RealtimeEventPublisher events;
    private BookingServiceImpl service;

    @BeforeEach
    void setUp() {
        bookings = mock(BookingRepository.class);
        accounts = mock(AccountRepository.class);
        events = mock(RealtimeEventPublisher.class);
        service = new BookingServiceImpl(bookings, accounts, mock(RoleRepository.class),
                mock(CustomerProfileRepository.class), events);
    }

    @Test
    void managerRescheduleUsesAvailabilityChecksAndRecordsAdminAssignment() {
        Account manager = manager("MANAGER");
        Booking booking = booking("customer@example.com");
        LocalDateTime newStart = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
        ServiceSnapshotProjection snapshot = mock(ServiceSnapshotProjection.class);
        when(snapshot.getId()).thenReturn(5L);
        when(snapshot.getPreparationBufferMinutes()).thenReturn(10);
        when(snapshot.getCleanupBufferMinutes()).thenReturn(10);
        when(accounts.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(bookings.findByIdForUpdateWithItems(42L)).thenReturn(Optional.of(booking));
        when(bookings.findActiveServicesByIds(any())).thenReturn(List.of(snapshot));
        when(bookings.lockStaff(12L)).thenReturn(Optional.of(12L));
        when(bookings.countSupportedServices(12L, java.util.Set.of(5L))).thenReturn(1L);
        when(bookings.countCoveringWorkingHours(anyLong(), any(Integer.class), any(), any())).thenReturn(1L);
        when(bookings.saveAndFlush(booking)).thenReturn(booking);

        var response = service.rescheduleByManager(42L,
                RescheduleBookingRequest.builder().bookingStart(newStart).staffAccountId(12L).build(),
                "manager@example.com");

        assertThat(response.getBookingStart()).isEqualTo(newStart);
        assertThat(booking.getBookingEnd()).isEqualTo(newStart.plusMinutes(60));
        assertThat(booking.getStaffAccountId()).isEqualTo(12L);
        assertThat(booking.getAssignmentSource()).isEqualTo(AssignmentSource.ADMIN);
        assertThat(booking.getEvents()).anySatisfy(event -> {
            assertThat(event.getEventType()).isEqualTo("RESCHEDULED");
            assertThat(event.getActorAccountId()).isEqualTo(2L);
        });
        verify(events).bookingChanged(booking, "RESCHEDULED");
    }

    @Test
    void resendQueuesASeparateEmailEvent() {
        when(accounts.findByEmail("owner@example.com")).thenReturn(Optional.of(manager("OWNER")));
        Booking booking = booking("customer@example.com");
        when(bookings.findById(42L)).thenReturn(Optional.of(booking));

        var response = service.resendBookingEmail(42L, "owner@example.com");

        assertThat(response.getStatus()).isEqualTo("QUEUED");
        verify(events).bookingEmailRequested(booking);
    }

    @Test
    void managerSearchCanPutNewestCreatedBookingOnTheFirstPage() {
        when(accounts.findByEmail("owner@example.com")).thenReturn(Optional.of(manager("OWNER")));
        when(bookings.findAll(any(Specification.class), any(Pageable.class))).thenAnswer(invocation -> {
            Pageable pageable = invocation.getArgument(1);
            return new PageImpl<Booking>(List.of(), pageable, 0);
        });

        service.searchBookings(null, null, null, null, null, null, 0, 50,
                BookingSortField.CREATED_AT, Sort.Direction.DESC, "owner@example.com");

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(bookings).findAll(any(Specification.class), pageable.capture());
        assertThat(pageable.getValue().getSort().getOrderFor("createdAt").getDirection())
                .isEqualTo(Sort.Direction.DESC);
        assertThat(pageable.getValue().getSort().getOrderFor("id").getDirection())
                .isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void managerSearchReturnsCustomerPhoneSnapshot() {
        when(accounts.findByEmail("owner@example.com")).thenReturn(Optional.of(manager("OWNER")));
        Booking booking = booking("customer@example.com");
        booking.setCustomerPhoneSnapshot("0912345678");
        when(bookings.findAll(any(Specification.class), any(Pageable.class))).thenAnswer(invocation -> {
            Pageable pageable = invocation.getArgument(1);
            return new PageImpl<>(List.of(booking), pageable, 1);
        });

        var response = service.searchBookings(null, null, null, null, null, null, 0, 50,
                BookingSortField.CREATED_AT, Sort.Direction.DESC, "owner@example.com");

        assertThat(response.getContent()).singleElement()
                .satisfies(item -> assertThat(item.getCustomerPhone()).isEqualTo("0912345678"));
    }

    private Account manager(String role) {
        return Account.builder().id(2L).email(role.toLowerCase() + "@example.com").displayName(role)
                .isActive(true).role(Role.builder().code(role).name(role).build()).build();
    }

    private Booking booking(String customerEmail) {
        Booking booking = Booking.builder().id(42L).bookingCode("LNR-42").customerAccountId(8L)
                .customerNameSnapshot("Customer").customerEmailSnapshot(customerEmail)
                .bookingStart(LocalDateTime.now().plusDays(1)).bookingEnd(LocalDateTime.now().plusDays(1).plusHours(1))
                .totalDurationMinutes(60).status(BookingStatus.CONFIRMED).staffAccountId(11L)
                .assignmentSource(AssignmentSource.CUSTOMER).build();
        booking.addItem(BookingItem.builder().serviceId(5L).serviceNameSnapshot("Massage")
                .durationMinutes(60).build());
        return booking;
    }
}
