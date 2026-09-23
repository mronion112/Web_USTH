package com.kevin.lunaraspa.booking.service.impl;

import com.kevin.lunaraspa.authentication_account.entity.Account;
import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;
import com.kevin.lunaraspa.authentication_account.repository.RoleRepository;
import com.kevin.lunaraspa.booking.dto.AssignStaffRequest;
import com.kevin.lunaraspa.booking.dto.AssignStaffResponse;
import com.kevin.lunaraspa.booking.dto.BookingDetailResponse;
import com.kevin.lunaraspa.booking.dto.BookingItemRequest;
import com.kevin.lunaraspa.booking.dto.BookingItemResponse;
import com.kevin.lunaraspa.booking.dto.BookingSummaryResponse;
import com.kevin.lunaraspa.booking.dto.BookingSearchResponse;
import com.kevin.lunaraspa.booking.dto.BookingSortField;
import com.kevin.lunaraspa.booking.dto.CheckInResponse;
import com.kevin.lunaraspa.booking.dto.EmailDispatchResponse;
import com.kevin.lunaraspa.booking.dto.RescheduleBookingRequest;
import com.kevin.lunaraspa.booking.dto.RescheduleBookingResponse;
import com.kevin.lunaraspa.booking.dto.ManagerCreateBookingRequest;
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
import com.kevin.lunaraspa.core.common.model.response.PageableResponse;
import com.kevin.lunaraspa.core.validation.PhoneNumberValidator;
import com.kevin.lunaraspa.profiles.entity.CustomerProfile;
import com.kevin.lunaraspa.profiles.repository.CustomerProfileRepository;
import com.kevin.lunaraspa.realtime.RealtimeEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final DateTimeFormatter BOOKING_CODE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final Set<String> BOOKING_MANAGEMENT_ROLES = Set.of(
            "OWNER", "MANAGER", "RECEPTIONIST"
    );

    private final BookingRepository bookingRepository;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final RealtimeEventPublisher realtimeEventPublisher;

    @Override
    @Transactional
    public CreateBookingResponse createBooking(CreateBookingRequest request, String currentUserEmail) {
        validateCreateRequest(request);
        Account customer = getActiveAccount(currentUserEmail);
        CustomerProfile customerProfile = customer.getCustomerProfile();
        if (customerProfile == null) {
            throw new AppException(BookingFeatureErrorCode.CUSTOMER_ACCOUNT_REQUIRED);
        }

        String phone = requireValidPhone(request.getCustomerPhone() == null
                ? customerProfile.getPhone() : request.getCustomerPhone());
        request.setCustomerPhone(phone);
        if (!phone.equals(customerProfile.getPhone())) {
            customerProfile.setPhone(phone);
            customerProfileRepository.saveAndFlush(customerProfile);
        }

        return persistBooking(request, customer, customer.getId());
    }

    @Override
    @Transactional
    public CreateBookingResponse createManagerBooking(ManagerCreateBookingRequest request, String currentUserEmail) {
        Account actor = getActiveAccount(currentUserEmail);
        if (!isManagementRole(actor)) throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        if (request == null || normalizeText(request.getCustomerName()) == null
                || normalizeText(request.getCustomerPhone()) == null) {
            throw new AppException(BookingFeatureErrorCode.CUSTOMER_ACCOUNT_REQUIRED,
                    "Customer name and phone are required");
        }
        String phone = requireValidPhone(request.getCustomerPhone());
        request.setCustomerPhone(phone);
        CreateBookingRequest bookingRequest = CreateBookingRequest.builder()
                .customerPhone(phone)
                .bookingStart(request.getBookingStart()).staffAccountId(request.getStaffAccountId())
                .customerNote(request.getCustomerNote()).items(request.getItems()).build();
        validateCreateRequest(bookingRequest);
        Account customer = findOrCreateCustomer(request, actor);
        return persistBooking(bookingRequest, customer, actor.getId());
    }

    private Account findOrCreateCustomer(ManagerCreateBookingRequest request, Account actor) {
        String email = normalizeText(request.getCustomerEmail());
        String phone = normalizeText(request.getCustomerPhone());
        Account customer = email == null ? null : accountRepository.findByEmailIgnoreCase(email).orElse(null);
        if (customer == null) {
            customer = customerProfileRepository.findFirstByPhone(phone).map(CustomerProfile::getAccount).orElse(null);
        }
        if (customer != null) {
            if (customer.getCustomerProfile() == null) {
                throw new AppException(BookingFeatureErrorCode.CUSTOMER_ACCOUNT_REQUIRED,
                        "The matched account is not a customer");
            }
            CustomerProfile profile = customer.getCustomerProfile();
            if (!phone.equals(profile.getPhone())) {
                profile.setPhone(phone);
                customerProfileRepository.saveAndFlush(profile);
            }
            return customer;
        }
        var customerRole = roleRepository.findByCodeIgnoreCase("CUSTOMER")
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.CUSTOMER_ACCOUNT_REQUIRED));
        String resolvedEmail = email != null ? email
                : "walkin-" + UUID.randomUUID().toString().substring(0, 12) + "@local.lunara";
        customer = Account.builder().email(resolvedEmail).displayName(request.getCustomerName().trim())
                .role(customerRole).isActive(true).provisionedByAccount(actor).build();
        accountRepository.saveAndFlush(customer);
        CustomerProfile profile = CustomerProfile.builder().account(customer).phone(phone).build();
        customerProfileRepository.saveAndFlush(profile);
        customer.setCustomerProfile(profile);
        return customer;
    }

    private CreateBookingResponse persistBooking(CreateBookingRequest request, Account customer, Long creatorId) {
        List<PricedItem> pricedItems = priceItems(request.getItems());
        int totalDuration = pricedItems.stream()
                .mapToInt(item -> item.request().getDurationMinutes())
                .sum();
        BigDecimal totalAmount = pricedItems.stream()
                .map(PricedItem::lineAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDateTime bookingEnd = request.getBookingStart().plusMinutes(totalDuration);
        int preparationMinutes = pricedItems.stream()
                .mapToInt(item -> defaultZero(item.service().getPreparationBufferMinutes())).sum();
        int cleanupMinutes = pricedItems.stream()
                .mapToInt(item -> defaultZero(item.service().getCleanupBufferMinutes())).sum();
        Set<Long> serviceIds = collectServiceIds(request.getItems());

        AssignmentSource assignmentSource = request.getStaffAccountId() == null
                ? AssignmentSource.SYSTEM
                : AssignmentSource.CUSTOMER;
        Long staffAccountId = selectAndLockStaff(
                request.getStaffAccountId(),
                serviceIds,
                request.getBookingStart().minusMinutes(preparationMinutes),
                bookingEnd.plusMinutes(cleanupMinutes),
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
                .customerPhoneSnapshot(requireValidPhone(request.getCustomerPhone()))
                .bookingStart(request.getBookingStart())
                .bookingEnd(bookingEnd)
                .customerNote(normalizeText(request.getCustomerNote()))
                .totalDurationMinutes(totalDuration)
                .totalAmount(totalAmount)
                .createdByAccountId(creatorId)
                .build();

        pricedItems.forEach(pricedItem -> booking.addItem(toEntity(pricedItem)));

        bookingRepository.saveAndFlush(booking);
        String bookingCode = generateBookingCode(booking);
        booking.setBookingCode(bookingCode);
        booking.addEvent(buildEvent(
                "CREATED",
                creatorId,
                "Booking " + bookingCode + " was created."
        ));
        booking.addEvent(buildEvent(
                "STAFF_ASSIGNED",
                creatorId,
                "Assigned staff account #" + staffAccountId + "."
        ));
        bookingRepository.saveAndFlush(booking);
        realtimeEventPublisher.bookingChanged(booking, "CREATED");

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
                || booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new AppException(BookingFeatureErrorCode.BOOKING_NOT_ASSIGNABLE);
        }

        Set<Long> serviceIds = booking.getItems().stream()
                .map(BookingItem::getServiceId)
                .collect(java.util.stream.Collectors.toSet());
        Map<Long, ServiceSnapshotProjection> serviceSnapshots = bookingRepository.findActiveServicesByIds(serviceIds)
                .stream().collect(java.util.stream.Collectors.toMap(ServiceSnapshotProjection::getId, item -> item));
        if (serviceSnapshots.size() != serviceIds.size()) {
            throw new AppException(BookingFeatureErrorCode.SERVICE_NOT_FOUND);
        }
        int preparationMinutes = serviceSnapshots.values().stream()
                .mapToInt(item -> defaultZero(item.getPreparationBufferMinutes())).sum();
        int cleanupMinutes = serviceSnapshots.values().stream()
                .mapToInt(item -> defaultZero(item.getCleanupBufferMinutes())).sum();
        Long staffAccountId = selectAndLockStaff(
                request.getStaffAccountId(),
                serviceIds,
                booking.getBookingStart().minusMinutes(preparationMinutes),
                booking.getBookingEnd().plusMinutes(cleanupMinutes),
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
        realtimeEventPublisher.bookingChanged(booking, "STAFF_ASSIGNED");

        return AssignStaffResponse.builder()
                .bookingId(booking.getId())
                .staffAccountId(staffAccountId)
                .assignmentSource(booking.getAssignmentSource().name())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageableResponse<BookingSearchResponse> searchBookings(LocalDateTime from, LocalDateTime to,
            BookingStatus status, Long staffId, Boolean unassigned, String code, int page, int size,
            BookingSortField sortBy, Sort.Direction sortDirection, String currentUserEmail) {
        Account actor = getActiveAccount(currentUserEmail);
        if (!isManagementRole(actor)) throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        if (page < 0 || size < 1 || size > 100 || (from != null && to != null
                && (!from.isBefore(to) || to.isAfter(from.plusDays(93))))) {
            throw new AppException(BookingFeatureErrorCode.INVALID_BOOKING_START, "Invalid pagination or date range");
        }
        if (staffId != null && staffId <= 0) throw new AppException(BookingFeatureErrorCode.INVALID_STAFF_ID);
        Specification<Booking> specification = (root, query, cb) -> cb.conjunction();
        if (from != null) specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("bookingStart"), from));
        if (to != null) specification = specification.and((root, query, cb) -> cb.lessThan(root.get("bookingStart"), to));
        if (status != null) specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        if (staffId != null) specification = specification.and((root, query, cb) -> cb.equal(root.get("staffAccountId"), staffId));
        if (Boolean.TRUE.equals(unassigned)) specification = specification.and((root, query, cb) -> cb.isNull(root.get("staffAccountId")));
        if (code != null && !code.isBlank()) {
            String pattern = "%" + code.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("bookingCode")), pattern),
                    cb.like(cb.lower(root.get("customerNameSnapshot")), pattern),
                    cb.like(cb.lower(root.get("customerPhoneSnapshot")), pattern)));
        }
        BookingSortField safeSortBy = sortBy == null ? BookingSortField.BOOKING_START : sortBy;
        Sort.Direction safeDirection = sortDirection == null ? Sort.Direction.DESC : sortDirection;
        Sort sort = Sort.by(safeDirection, safeSortBy.property()).and(Sort.by(safeDirection, "id"));
        var result = bookingRepository.findAll(specification, PageRequest.of(page, size, sort));
        var content = result.getContent().stream().map(this::toSearchResponse).toList();
        return PageableResponse.<BookingSearchResponse>builder().content(content).pageNumber(result.getNumber())
                .pageSize(result.getSize()).totalPages(result.getTotalPages()).totalElements(result.getTotalElements())
                .numberOfElements(result.getNumberOfElements()).build();
    }

    @Override
    @Transactional
    public CheckInResponse checkIn(Long bookingId, String currentUserEmail) {
        Account actor = getActiveAccount(currentUserEmail);
        if (!isManagementRole(actor)) throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() == BookingStatus.CHECKED_IN) {
            return CheckInResponse.builder().bookingId(booking.getId()).status(booking.getStatus().name())
                    .checkedInAt(booking.getCheckedInAt()).build();
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED)
            throw new AppException(BookingFeatureErrorCode.INVALID_STATUS_TRANSITION);
        LocalDateTime now = LocalDateTime.now();
        booking.setStatus(BookingStatus.CHECKED_IN);
        booking.setCheckedInAt(now);
        booking.addEvent(buildEvent("CHECKED_IN", actor.getId(), "Customer checked in."));
        bookingRepository.saveAndFlush(booking);
        realtimeEventPublisher.bookingChanged(booking, "CHECKED_IN");
        return CheckInResponse.builder().bookingId(booking.getId()).status(booking.getStatus().name())
                .checkedInAt(now).build();
    }

    @Override
    @Transactional
    public RescheduleBookingResponse reschedule(String bookingCode, RescheduleBookingRequest request,
                                                String currentUserEmail) {
        validateRescheduleRequest(request);
        Account customer = getActiveAccount(currentUserEmail);
        Booking booking = bookingRepository.findByBookingCodeForUpdateWithItems(bookingCode)
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND));
        if (!customer.getId().equals(booking.getCustomerAccountId()))
            throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        return applyReschedule(booking, request, customer.getId(), AssignmentSource.CUSTOMER);
    }

    @Override
    @Transactional
    public RescheduleBookingResponse rescheduleByManager(Long bookingId, RescheduleBookingRequest request,
                                                         String currentUserEmail) {
        validateRescheduleRequest(request);
        Account actor = getActiveAccount(currentUserEmail);
        if (!isManagementRole(actor)) throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        Booking booking = bookingRepository.findByIdForUpdateWithItems(bookingId)
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND));
        return applyReschedule(booking, request, actor.getId(), AssignmentSource.ADMIN);
    }

    @Override
    @Transactional
    public EmailDispatchResponse resendBookingEmail(Long bookingId, String currentUserEmail) {
        Account actor = getActiveAccount(currentUserEmail);
        if (!isManagementRole(actor)) throw new AppException(BookingFeatureErrorCode.ACCESS_DENIED);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(BookingFeatureErrorCode.BOOKING_NOT_FOUND));
        if (normalizeText(booking.getCustomerEmailSnapshot()) == null
                || booking.getCustomerEmailSnapshot().endsWith("@local.lunara")) {
            throw new AppException(BookingFeatureErrorCode.BOOKING_EMAIL_UNAVAILABLE);
        }
        realtimeEventPublisher.bookingEmailRequested(booking);
        return EmailDispatchResponse.builder().bookingId(booking.getId()).bookingCode(booking.getBookingCode())
                .status("QUEUED").build();
    }

    private void validateRescheduleRequest(RescheduleBookingRequest request) {
        if (request == null || request.getBookingStart() == null
                || !request.getBookingStart().isAfter(LocalDateTime.now()))
            throw new AppException(BookingFeatureErrorCode.INVALID_BOOKING_START);
        if (request.getStaffAccountId() != null && request.getStaffAccountId() <= 0)
            throw new AppException(BookingFeatureErrorCode.INVALID_STAFF_ID);
    }

    private RescheduleBookingResponse applyReschedule(Booking booking, RescheduleBookingRequest request,
                                                      Long actorAccountId, AssignmentSource explicitSource) {
        if (booking.getStatus() == BookingStatus.CHECKED_IN || booking.getStatus() == BookingStatus.IN_SERVICE
                || booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.CANCELLED)
            throw new AppException(BookingFeatureErrorCode.INVALID_STATUS_TRANSITION);
        Set<Long> serviceIds = booking.getItems().stream().map(BookingItem::getServiceId).collect(java.util.stream.Collectors.toSet());
        Map<Long, ServiceSnapshotProjection> snapshots = bookingRepository.findActiveServicesByIds(serviceIds)
                .stream().collect(java.util.stream.Collectors.toMap(ServiceSnapshotProjection::getId, item -> item));
        if (snapshots.size() != serviceIds.size()) throw new AppException(BookingFeatureErrorCode.SERVICE_NOT_FOUND);
        LocalDateTime newEnd = request.getBookingStart().plusMinutes(booking.getTotalDurationMinutes());
        Long previousStaff = booking.getStaffAccountId();
        Long requestedStaff = request.getStaffAccountId() == null ? previousStaff : request.getStaffAccountId();
        if (request.getBookingStart().equals(booking.getBookingStart())
                && Objects.equals(requestedStaff, booking.getStaffAccountId())) return toRescheduleResponse(booking);
        int prep = snapshots.values().stream().mapToInt(item -> defaultZero(item.getPreparationBufferMinutes())).sum();
        int cleanup = snapshots.values().stream().mapToInt(item -> defaultZero(item.getCleanupBufferMinutes())).sum();
        Long selectedStaff = selectAndLockStaff(requestedStaff, serviceIds,
                request.getBookingStart().minusMinutes(prep), newEnd.plusMinutes(cleanup), booking.getId());
        booking.setBookingStart(request.getBookingStart());
        booking.setBookingEnd(newEnd);
        booking.setStaffAccountId(selectedStaff);
        if (request.getStaffAccountId() != null) booking.setAssignmentSource(explicitSource);
        else if (previousStaff == null) booking.setAssignmentSource(AssignmentSource.SYSTEM);
        booking.addEvent(buildEvent("RESCHEDULED", actorAccountId,
                "Booking rescheduled to " + request.getBookingStart() + "."));
        Booking saved = bookingRepository.saveAndFlush(booking);
        realtimeEventPublisher.bookingChanged(saved, "RESCHEDULED");
        return toRescheduleResponse(saved);
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
        if (request.getCustomerPhone() != null) {
            request.setCustomerPhone(requireValidPhone(request.getCustomerPhone()));
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

    private String requireValidPhone(String value) {
        String phone = PhoneNumberValidator.normalize(value);
        if (!PhoneNumberValidator.isValid(phone)) {
            throw new AppException(BookingFeatureErrorCode.INVALID_CUSTOMER_PHONE);
        }
        return phone;
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

    private int defaultZero(Integer value) {
        return value == null ? 0 : value;
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

    private BookingSearchResponse toSearchResponse(Booking booking) {
        return BookingSearchResponse.builder().id(booking.getId()).bookingCode(booking.getBookingCode())
                .status(booking.getStatus().name()).customerAccountId(booking.getCustomerAccountId())
                .customerName(booking.getCustomerNameSnapshot()).customerPhone(booking.getCustomerPhoneSnapshot())
                .staffAccountId(booking.getStaffAccountId())
                .staffName(booking.getStaffAccountId() == null ? null
                        : bookingRepository.findAccountDisplayName(booking.getStaffAccountId()).orElse(null))
                .serviceNames(booking.getItems().stream().map(BookingItem::getServiceNameSnapshot).toList())
                .bookingStart(booking.getBookingStart()).bookingEnd(booking.getBookingEnd())
                .totalAmount(booking.getTotalAmount()).build();
    }

    private RescheduleBookingResponse toRescheduleResponse(Booking booking) {
        return RescheduleBookingResponse.builder().bookingId(booking.getId()).bookingCode(booking.getBookingCode())
                .staffAccountId(booking.getStaffAccountId()).bookingStart(booking.getBookingStart())
                .bookingEnd(booking.getBookingEnd()).build();
    }

    private BookingDetailResponse toDetailResponse(Booking booking) {
        StaffSummaryResponse staff = null;
        if (booking.getStaffAccountId() != null) {
            staff = StaffSummaryResponse.builder()
                    .accountId(booking.getStaffAccountId())
                    .displayName(bookingRepository.findAccountDisplayName(booking.getStaffAccountId()).orElse(null))
                    .build();
        }
        LocalDateTime holdExpiresAt = booking.getCreatedAt() != null ? booking.getCreatedAt().plusMinutes(15) : null;
        return BookingDetailResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .status(booking.getStatus().name())
                .customerName(booking.getCustomerNameSnapshot())
                .customerEmail(booking.getCustomerEmailSnapshot())
                .staff(staff)
                .bookingStart(booking.getBookingStart())
                .bookingEnd(booking.getBookingEnd())
                .totalDurationMinutes(booking.getTotalDurationMinutes())
                .holdExpiresAt(holdExpiresAt)
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
