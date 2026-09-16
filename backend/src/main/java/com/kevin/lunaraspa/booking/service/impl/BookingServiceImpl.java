package com.kevin.lunaraspa.booking.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.booking.dto.AssignStaffRequest;
import com.kevin.lunaraspa.booking.dto.AssignStaffResponse;
import com.kevin.lunaraspa.booking.dto.BookingDetailResponse;
import com.kevin.lunaraspa.booking.dto.BookingItemRequest;
import com.kevin.lunaraspa.booking.dto.BookingItemResponse;
import com.kevin.lunaraspa.booking.dto.BookingSummaryResponse;
import com.kevin.lunaraspa.booking.dto.CreateBookingRequest;
import com.kevin.lunaraspa.booking.dto.CreateBookingResponse;
import com.kevin.lunaraspa.booking.dto.StaffSummaryResponse;
import com.kevin.lunaraspa.booking.entity.AssignmentSource;
import com.kevin.lunaraspa.booking.entity.Booking;
import com.kevin.lunaraspa.booking.entity.BookingEvent;
import com.kevin.lunaraspa.booking.entity.BookingItem;
import com.kevin.lunaraspa.booking.entity.BookingStatus;
import com.kevin.lunaraspa.booking.exception.BookingFeatureErrorCode;
import com.kevin.lunaraspa.booking.repository.BookingRepository;
import com.kevin.lunaraspa.booking.repository.ServiceSnapshotProjection;
import com.kevin.lunaraspa.booking.service.BookingService;
import com.kevin.lunaraspa.core.exception.AppException;
import com.kevin.lunaraspa.profiles.entity.CustomerProfile;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final DateTimeFormatter BOOKING_CODE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final Set<String> BOOKING_MANAGEMENT_ROLES = Set.of(
            "OWNER", "MANAGER", "RECEPTIONIST"
    );

    private final BookingRepository bookingRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional
    public CreateBookingResponse createBooking(CreateBookingRequest request, String currentUserEmail) {
        validateCreateRequest(request);
        Account customer = getActiveAccount(currentUserEmail);
        CustomerProfile customerProfile = customer.getCustomerProfile();
        if (customerProfile == null) {
            throw new AppException(BookingFeatureErrorCode.CUSTOMER_ACCOUNT_REQUIRED);
        }

        List<PricedItem> pricedItems = priceItems(request.getItems());
        int totalDuration = pricedItems.stream()
                .mapToInt(item -> item.request().getDurationMinutes())
                .sum();
        BigDecimal totalAmount = pricedItems.stream()
                .map(PricedItem::lineAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDateTime bookingEnd = request.getBookingStart().plusMinutes(totalDuration);
        Set<Long> serviceIds = collectServiceIds(request.getItems());

        AssignmentSource assignmentSource = request.getStaffAccountId() == null
                ? AssignmentSource.SYSTEM
                : AssignmentSource.CUSTOMER;
        Long staffAccountId = selectAndLockStaff(
                request.getStaffAccountId(),
                serviceIds,
                request.getBookingStart(),
                bookingEnd,
                null
        );

        Booking booking = Booking.builder()
                .bookingCode(createTemporaryBookingCode())
                .customerAccountId(customer.getId())
                .staffAccountId(staffAccountId)
                .status(BookingStatus.PENDING_PAYMENT)
                .assignmentSource(assignmentSource)
                .customerNameSnapshot(customer.getDisplayName())
                .customerEmailSnapshot(customer.getEmail())
                .customerPhoneSnapshot(normalizeText(customerProfile.getPhone()))
                .bookingStart(request.getBookingStart())
                .bookingEnd(bookingEnd)
                .customerNote(normalizeText(request.getCustomerNote()))
                .totalDurationMinutes(totalDuration)
                .totalAmount(totalAmount)
                .createdByAccountId(customer.getId())
                .build();

        pricedItems.forEach(pricedItem -> booking.addItem(toEntity(pricedItem)));

        bookingRepository.saveAndFlush(booking);
        String bookingCode = generateBookingCode(booking);
        booking.setBookingCode(bookingCode);
        booking.addEvent(buildEvent(
                "CREATED",
                customer.getId(),
                "Booking " + bookingCode + " was created."
        ));
        booking.addEvent(buildEvent(
                "STAFF_ASSIGNED",
                customer.getId(),
                "Assigned staff account #" + staffAccountId + "."
        ));
        bookingRepository.saveAndFlush(booking);

        return toCreateResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponse> getMyBookings(String currentUserEmail) {
        Account customer = getActiveAccount(currentUserEmail);
        if (customer.getCustomerProfile() == null) {
            throw new AppException(BookingFeatureErrorCode.CUSTOMER_ACCOUNT_REQUIRED);
        }

        return bookingRepository.findByCustomerAccountIdOrderByBookingStartDesc(customer.getId())
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDetailResponse getBookingByCode(String bookingCode, String currentUserEmail) {
        if (bookingCode == null || bookingCode.isBlank()) {
            throw new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND);
        }

        Account account = getActiveAccount(currentUserEmail);
        Booking booking = bookingRepository.findByBookingCode(bookingCode.trim())
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND));

        if (!canViewBooking(account, booking)) {
            throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        }

        return toDetailResponse(booking);
    }

    @Override
    @Transactional
    public AssignStaffResponse assignStaff(
            Long bookingId,
            AssignStaffRequest request,
            String currentUserEmail
    ) {
        if (bookingId == null || bookingId <= 0) {
            throw new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND);
        }
        if (request == null || request.getStaffAccountId() == null || request.getStaffAccountId() <= 0) {
            throw new AppException(BookingFeatureErrorCode.INVALID_STAFF_ID);
        }

        Account actor = getActiveAccount(currentUserEmail);
        if (!isManagementRole(actor)) {
            throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        }

        Booking booking = bookingRepository.findByIdWithItems(bookingId)
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() == BookingStatus.CHECKED_IN
                || booking.getStatus() == BookingStatus.IN_SERVICE
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new AppException(BookingFeatureErrorCode.BOOKING_NOT_ASSIGNABLE);
        }

        Set<Long> serviceIds = booking.getItems().stream()
                .map(BookingItem::getServiceId)
                .collect(java.util.stream.Collectors.toSet());
        Long staffAccountId = selectAndLockStaff(
                request.getStaffAccountId(),
                serviceIds,
                booking.getBookingStart(),
                booking.getBookingEnd(),
                booking.getId()
        );

        booking.setStaffAccountId(staffAccountId);
        booking.setAssignmentSource(AssignmentSource.ADMIN);
        booking.addEvent(buildEvent(
                "STAFF_ASSIGNED",
                actor.getId(),
                "Assigned staff account #" + staffAccountId + " by manager."
        ));
        bookingRepository.saveAndFlush(booking);

        return AssignStaffResponse.builder()
                .bookingId(booking.getId())
                .staffAccountId(staffAccountId)
                .assignmentSource(booking.getAssignmentSource().name())
                .build();
    }

    private void validateCreateRequest(CreateBookingRequest request) {
        if (request == null || request.getBookingStart() == null
                || !request.getBookingStart().isAfter(LocalDateTime.now())) {
            throw new AppException(BookingFeatureErrorCode.INVALID_BOOKING_START);
        }
        if (request.getStaffAccountId() != null && request.getStaffAccountId() <= 0) {
            throw new AppException(BookingFeatureErrorCode.INVALID_STAFF_ID);
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException(BookingFeatureErrorCode.ITEMS_REQUIRED);
        }

        Set<Long> serviceIds = new HashSet<>();
        for (BookingItemRequest item : request.getItems()) {
            if (item == null || item.getServiceId() == null || item.getServiceId() <= 0
                    || item.getDurationMinutes() == null || item.getDurationMinutes() <= 0) {
                throw new AppException(BookingFeatureErrorCode.INVALID_SERVICE_DURATION);
            }
            if (!serviceIds.add(item.getServiceId())) {
                throw new AppException(BookingFeatureErrorCode.DUPLICATE_SERVICE);
            }
        }
    }

    private List<PricedItem> priceItems(List<BookingItemRequest> requests) {
        Set<Long> serviceIds = collectServiceIds(requests);
        Map<Long, ServiceSnapshotProjection> services = new HashMap<>();
        bookingRepository.findActiveServicesByIds(serviceIds)
                .forEach(service -> services.put(service.getId(), service));
        if (services.size() != serviceIds.size()) {
            throw new AppException(BookingFeatureErrorCode.SERVICE_NOT_FOUND);
        }

        List<PricedItem> pricedItems = new ArrayList<>();
        for (BookingItemRequest request : requests) {
            ServiceSnapshotProjection service = services.get(request.getServiceId());
            int duration = request.getDurationMinutes();
            int minimum = service.getMinimumDurationMinutes();
            boolean adjustable = Boolean.TRUE.equals(service.getDurationAdjustable());
            int additionalSteps = 0;

            if (!adjustable) {
                if (duration != minimum) {
                    throw new AppException(
                            BookingFeatureErrorCode.INVALID_SERVICE_DURATION,
                            "Service " + service.getName() + " requires exactly " + minimum + " minutes"
                    );
                }
            } else {
                Integer step = service.getDurationStepMinutes();
                if (duration < minimum || step == null || step <= 0 || (duration - minimum) % step != 0) {
                    throw new AppException(
                            BookingFeatureErrorCode.INVALID_SERVICE_DURATION,
                            "Invalid duration for service " + service.getName()
                    );
                }
                additionalSteps = (duration - minimum) / step;
            }

            BigDecimal pricePerStep = service.getPricePerDurationStep() == null
                    ? BigDecimal.ZERO
                    : service.getPricePerDurationStep();
            BigDecimal lineAmount = service.getBasePrice()
                    .add(pricePerStep.multiply(BigDecimal.valueOf(additionalSteps)));
            pricedItems.add(new PricedItem(request, service, additionalSteps, pricePerStep, lineAmount));
        }
        return pricedItems;
    }

    private Long selectAndLockStaff(
            Long requestedStaffId,
            Set<Long> serviceIds,
            LocalDateTime bookingStart,
            LocalDateTime bookingEnd,
            Long excludedBookingId
    ) {
        if (requestedStaffId != null) {
            bookingRepository.lockStaff(requestedStaffId)
                    .orElseThrow(() -> new AppException(BookingFeatureErrorCode.STAFF_UNAVAILABLE));
            ensureStaffQualified(requestedStaffId, serviceIds);
            if (!isStaffAvailable(requestedStaffId, bookingStart, bookingEnd, excludedBookingId)) {
                throw new AppException(BookingFeatureErrorCode.STAFF_UNAVAILABLE);
            }
            return requestedStaffId;
        }

        for (Long staffId : bookingRepository.findBookableStaffIds()) {
            if (!supportsAllServices(staffId, serviceIds)
                    || !isStaffAvailable(staffId, bookingStart, bookingEnd, excludedBookingId)) {
                continue;
            }
            if (bookingRepository.lockStaff(staffId).isPresent()
                    && isStaffAvailable(staffId, bookingStart, bookingEnd, excludedBookingId)) {
                return staffId;
            }
        }
        throw new AppException(BookingFeatureErrorCode.STAFF_UNAVAILABLE);
    }

    private void ensureStaffQualified(Long staffId, Set<Long> serviceIds) {
        if (!supportsAllServices(staffId, serviceIds)) {
            throw new AppException(BookingFeatureErrorCode.STAFF_NOT_QUALIFIED);
        }
    }

    private boolean supportsAllServices(Long staffId, Set<Long> serviceIds) {
        return bookingRepository.countSupportedServices(staffId, serviceIds) == serviceIds.size();
    }

    private boolean isStaffAvailable(
            Long staffId,
            LocalDateTime bookingStart,
            LocalDateTime bookingEnd,
            Long excludedBookingId
    ) {
        if (!bookingStart.toLocalDate().equals(bookingEnd.toLocalDate())) {
            return false;
        }
        int dayOfWeek = bookingStart.getDayOfWeek().getValue();
        if (bookingRepository.countCoveringWorkingHours(
                staffId,
                dayOfWeek,
                bookingStart.toLocalTime(),
                bookingEnd.toLocalTime()
        ) == 0) {
            return false;
        }
        if (bookingRepository.countOverlappingTimeOff(staffId, bookingStart, bookingEnd) > 0) {
            return false;
        }
        return bookingRepository.countOverlappingBookings(
                staffId,
                bookingStart,
                bookingEnd,
                excludedBookingId
        ) == 0;
    }

    private Account getActiveAccount(String email) {
        if (email == null || email.isBlank()) {
            throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        }
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.ACCESS_DENIED));
        if (!Boolean.TRUE.equals(account.getIsActive())) {
            throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        }
        return account;
    }

    private boolean canViewBooking(Account account, Booking booking) {
        return account.getId().equals(booking.getCustomerAccountId())
                || account.getId().equals(booking.getStaffAccountId())
                || isManagementRole(account);
    }

    private boolean isManagementRole(Account account) {
        String roleCode = account.getRole().getCode().toUpperCase(Locale.ROOT);
        if (roleCode.startsWith("ROLE_")) {
            roleCode = roleCode.substring("ROLE_".length());
        }
        return BOOKING_MANAGEMENT_ROLES.contains(roleCode);
    }

    private Set<Long> collectServiceIds(List<BookingItemRequest> items) {
        return items.stream()
                .map(BookingItemRequest::getServiceId)
                .collect(java.util.stream.Collectors.toCollection(HashSet::new));
    }

    private BookingItem toEntity(PricedItem item) {
        return BookingItem.builder()
                .serviceId(item.service().getId())
                .serviceNameSnapshot(item.service().getName())
                .durationMinutes(item.request().getDurationMinutes())
                .basePriceSnapshot(item.service().getBasePrice())
                .additionalDurationSteps(item.additionalSteps())
                .pricePerStepSnapshot(item.pricePerStep())
                .lineAmount(item.lineAmount())
                .build();
    }

    private BookingEvent buildEvent(String eventType, Long actorAccountId, String message) {
        return BookingEvent.builder()
                .eventType(eventType)
                .actorAccountId(actorAccountId)
                .message(message)
                .occurredAt(LocalDateTime.now())
                .build();
    }

    private String createTemporaryBookingCode() {
        return "TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
    }

    private String generateBookingCode(Booking booking) {
        if (booking.getId() == null) {
            throw new AppException(BookingFeatureErrorCode.BOOKING_CODE_GENERATION_FAILED);
        }
        return "LNR-" + booking.getBookingStart().format(BOOKING_CODE_DATE)
                + "-" + String.format("%05d", booking.getId());
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private CreateBookingResponse toCreateResponse(Booking booking) {
        return CreateBookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .status(booking.getStatus().name())
                .assignmentSource(booking.getAssignmentSource().name())
                .staffAccountId(booking.getStaffAccountId())
                .bookingStart(booking.getBookingStart())
                .bookingEnd(booking.getBookingEnd())
                .totalDurationMinutes(booking.getTotalDurationMinutes())
                .totalAmount(booking.getTotalAmount())
                .items(booking.getItems().stream().map(this::toItemResponse).toList())
                .build();
    }

    private BookingSummaryResponse toSummaryResponse(Booking booking) {
        return BookingSummaryResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .status(booking.getStatus().name())
                .bookingStart(booking.getBookingStart())
                .bookingEnd(booking.getBookingEnd())
                .totalAmount(booking.getTotalAmount())
                .build();
    }

    private BookingDetailResponse toDetailResponse(Booking booking) {
        StaffSummaryResponse staff = null;
        if (booking.getStaffAccountId() != null) {
            staff = StaffSummaryResponse.builder()
                    .accountId(booking.getStaffAccountId())
                    .displayName(bookingRepository.findAccountDisplayName(booking.getStaffAccountId()).orElse(null))
                    .build();
        }
        return BookingDetailResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .status(booking.getStatus().name())
                .customerName(booking.getCustomerNameSnapshot())
                .customerEmail(booking.getCustomerEmailSnapshot())
                .staff(staff)
                .items(booking.getItems().stream().map(this::toItemResponse).toList())
                .totalAmount(booking.getTotalAmount())
                .build();
    }

    private BookingItemResponse toItemResponse(BookingItem item) {
        return BookingItemResponse.builder()
                .serviceId(item.getServiceId())
                .serviceName(item.getServiceNameSnapshot())
                .durationMinutes(item.getDurationMinutes())
                .lineAmount(item.getLineAmount())
                .build();
    }

    private record PricedItem(
            BookingItemRequest request,
            ServiceSnapshotProjection service,
            int additionalSteps,
            BigDecimal pricePerStep,
            BigDecimal lineAmount
    ) {
    }
}
