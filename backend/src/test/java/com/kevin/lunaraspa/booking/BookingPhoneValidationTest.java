package com.kevin.lunaraspa.booking;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.entity.Role;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.repository.RoleRepository;
import com.kevin.lunaraspa.booking.dto.BookingItemRequest;
import com.kevin.lunaraspa.booking.dto.CreateBookingRequest;
import com.kevin.lunaraspa.booking.dto.ManagerCreateBookingRequest;
import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.exception.BookingFeatureErrorCode;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.booking.repository.ServiceSnapshotProjection;
import com.kevin.lunaraspa.booking.service.impl.BookingServiceImpl;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.profiles.entity.CustomerProfile;
import com.kevin.lunaraspa.profiles.repository.CustomerProfileRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BookingPhoneValidationTest {
    private BookingRepository bookings;
    private AccountRepository accounts;
    private CustomerProfileRepository profiles;
    private BookingServiceImpl service;

    @BeforeEach
    void setUp() {
        bookings = mock(BookingRepository.class);
        accounts = mock(AccountRepository.class);
        profiles = mock(CustomerProfileRepository.class);
        service = new BookingServiceImpl(bookings, accounts, mock(RoleRepository.class), profiles,
                mock(RealtimeEventPublisher.class));
    }

    @Test
    void rejectsMalformedCustomerPhoneBeforeCreatingBooking() {
        CreateBookingRequest request = validRequest("123");

        assertThatThrownBy(() -> service.createBooking(request, "customer@example.com"))
                .isInstanceOfSatisfying(AppException.class, error ->
                        assertThat(error.getErrorCode()).isEqualTo(BookingFeatureErrorCode.INVALID_CUSTOMER_PHONE));
        verifyNoInteractions(accounts, bookings);
    }

    @Test
    void managerBookingAlsoRejectsMalformedCustomerPhone() {
        Account manager = Account.builder().id(2L).email("manager@example.com").displayName("Manager")
                .isActive(true).role(Role.builder().code("MANAGER").build()).build();
        when(accounts.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        ManagerCreateBookingRequest request = ManagerCreateBookingRequest.builder()
                .customerName("Customer").customerPhone("---12")
                .bookingStart(LocalDateTime.now().plusDays(2))
                .items(List.of(BookingItemRequest.builder().serviceId(1L).durationMinutes(60).build()))
                .build();

        assertThatThrownBy(() -> service.createManagerBooking(request, "manager@example.com"))
                .isInstanceOfSatisfying(AppException.class, error ->
                        assertThat(error.getErrorCode()).isEqualTo(BookingFeatureErrorCode.INVALID_CUSTOMER_PHONE));
        verifyNoInteractions(bookings);
    }

    @Test
    void normalizesPhoneAndStoresItInProfileAndBookingSnapshot() {
        CustomerProfile profile = CustomerProfile.builder().phone("0900000000").build();
        Account customer = Account.builder().id(8L).email("customer@example.com").displayName("Customer")
                .isActive(true).role(Role.builder().code("CUSTOMER").build()).customerProfile(profile).build();
        profile.setAccount(customer);
        when(accounts.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));

        ServiceSnapshotProjection snapshot = mock(ServiceSnapshotProjection.class);
        when(snapshot.getId()).thenReturn(1L);
        when(snapshot.getName()).thenReturn("Massage");
        when(snapshot.getBasePrice()).thenReturn(new BigDecimal("350000.00"));
        when(snapshot.getMinimumDurationMinutes()).thenReturn(60);
        when(snapshot.getDurationAdjustable()).thenReturn(false);
        when(snapshot.getPreparationBufferMinutes()).thenReturn(0);
        when(snapshot.getCleanupBufferMinutes()).thenReturn(0);
        when(bookings.findActiveServicesByIds(Set.of(1L))).thenReturn(List.of(snapshot));
        when(bookings.lockStaff(21L)).thenReturn(Optional.of(21L));
        when(bookings.countSupportedServices(21L, Set.of(1L))).thenReturn(1L);
        when(bookings.countCoveringWorkingHours(eq(21L), anyInt(), any(), any())).thenReturn(1L);
        when(bookings.saveAndFlush(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            if (booking.getId() == null) booking.setId(77L);
            return booking;
        });

        service.createBooking(validRequest("0912 345-678"), "customer@example.com");

        assertThat(profile.getPhone()).isEqualTo("0912345678");
        verify(profiles).saveAndFlush(profile);
        verify(bookings, atLeastOnce()).saveAndFlush(argThat(booking ->
                "0912345678".equals(booking.getCustomerPhoneSnapshot())));
    }

    private CreateBookingRequest validRequest(String phone) {
        return CreateBookingRequest.builder()
                .customerPhone(phone)
                .staffAccountId(21L)
                .bookingStart(LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0))
                .items(List.of(BookingItemRequest.builder().serviceId(1L).durationMinutes(60).build()))
                .build();
    }
}
