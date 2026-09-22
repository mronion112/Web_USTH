-- LUNARA SPA DATABASE

DROP DATABASE IF EXISTS lunara_spa;

CREATE DATABASE lunara_spa
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE lunara_spa;


-- ============================================================
-- 1. ROLES
-- OWNER / MANAGER / RECEPTIONIST / THERAPIST /
-- ACCOUNTANT / CUSTOMER
-- ============================================================

CREATE TABLE roles (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(30) NOT NULL UNIQUE,

    name VARCHAR(100) NOT NULL,

    description VARCHAR(255)
);


-- ============================================================
-- 2. PERMISSIONS
-- ============================================================

CREATE TABLE permissions (
    id SMALLINT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(100) NOT NULL UNIQUE,

    module VARCHAR(50) NOT NULL,

    description VARCHAR(255)
);

CREATE INDEX idx_permissions_module
    ON permissions(module);


-- ============================================================
-- 3. ROLE PERMISSIONS
-- Many-to-Many: roles <-> permissions
-- ============================================================

CREATE TABLE role_permissions (
    role_id TINYINT NOT NULL,

    permission_id SMALLINT NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_permission
    ON role_permissions(permission_id);


-- ============================================================
-- 4. ACCOUNTS
-- Google-only authentication
-- ============================================================

CREATE TABLE accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    role_id TINYINT NOT NULL,

    google_subject VARCHAR(255) UNIQUE,

    email VARCHAR(255) NOT NULL UNIQUE,

    display_name VARCHAR(150) NOT NULL,

    avatar_url VARCHAR(500),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    provisioned_by_account_id BIGINT NULL,

    last_login_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounts_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_accounts_provisioned_by
        FOREIGN KEY (provisioned_by_account_id)
        REFERENCES accounts(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX idx_accounts_role
    ON accounts(role_id);

CREATE INDEX idx_accounts_is_active
    ON accounts(is_active);


-- ============================================================
-- 5. CUSTOMER PROFILES
-- ============================================================

CREATE TABLE customer_profiles (
    account_id BIGINT PRIMARY KEY,

    phone VARCHAR(30),

    preferences TEXT,

    internal_notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_profiles_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_customer_profiles_phone
    ON customer_profiles(phone);


-- ============================================================
-- 6. STAFF PROFILES
-- ============================================================

CREATE TABLE staff_profiles (
    account_id BIGINT PRIMARY KEY,

    employee_code VARCHAR(50) NOT NULL UNIQUE,

    job_title VARCHAR(100) NOT NULL,

    is_bookable BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_profiles_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_staff_profiles_is_bookable
    ON staff_profiles(is_bookable);


-- ============================================================
-- 7. SERVICES
-- ============================================================

CREATE TABLE services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL UNIQUE,

    category VARCHAR(100) NOT NULL,

    description TEXT,

    image_url VARCHAR(500),

    base_price DECIMAL(12,2) NOT NULL,

    minimum_duration_minutes INT NOT NULL,

    is_duration_adjustable BOOLEAN NOT NULL DEFAULT FALSE,

    duration_step_minutes INT NULL,

    price_per_duration_step DECIMAL(12,2) NULL,

    preparation_buffer_minutes INT NOT NULL DEFAULT 0,

    cleanup_buffer_minutes INT NOT NULL DEFAULT 0,

    display_order INT NOT NULL DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_services_base_price
        CHECK (base_price >= 0),

    CONSTRAINT chk_services_minimum_duration
        CHECK (minimum_duration_minutes > 0),

    CONSTRAINT chk_services_buffers
        CHECK (
            preparation_buffer_minutes >= 0
            AND cleanup_buffer_minutes >= 0
        ),

    CONSTRAINT chk_services_duration_pricing
        CHECK (
            (
                is_duration_adjustable = FALSE
                AND duration_step_minutes IS NULL
                AND price_per_duration_step IS NULL
            )
            OR
            (
                is_duration_adjustable = TRUE
                AND duration_step_minutes > 0
                AND price_per_duration_step >= 0
            )
        )
);

CREATE INDEX idx_services_catalog
    ON services(category, is_active, display_order);


-- ============================================================
-- 8. STAFF SERVICES
-- Staff nào có thể làm Service nào
-- ============================================================

CREATE TABLE staff_services (
    staff_account_id BIGINT NOT NULL,

    service_id BIGINT NOT NULL,

    PRIMARY KEY (staff_account_id, service_id),

    CONSTRAINT fk_staff_services_staff
        FOREIGN KEY (staff_account_id)
        REFERENCES staff_profiles(account_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_staff_services_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_staff_services_service
    ON staff_services(service_id);


-- ============================================================
-- 9. STAFF WORKING HOURS
--
-- day_of_week:
-- 1 = Monday
-- ...
-- 7 = Sunday
-- ============================================================

CREATE TABLE staff_working_hours (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    staff_account_id BIGINT NOT NULL,

    day_of_week TINYINT NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_working_hours_day
        CHECK (day_of_week BETWEEN 1 AND 7),

    CONSTRAINT chk_working_hours_range
        CHECK (start_time < end_time),

    CONSTRAINT uq_staff_working_hours
        UNIQUE (
            staff_account_id,
            day_of_week,
            start_time
        ),

    CONSTRAINT fk_working_hours_staff
        FOREIGN KEY (staff_account_id)
        REFERENCES staff_profiles(account_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_staff_working_hours_lookup
    ON staff_working_hours(
        staff_account_id,
        day_of_week,
        is_active
    );


-- ============================================================
-- 10. STAFF TIME OFF
-- ============================================================

CREATE TABLE staff_time_off (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    staff_account_id BIGINT NOT NULL,

    start_at DATETIME NOT NULL,

    end_at DATETIME NOT NULL,

    reason VARCHAR(500),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_staff_time_off_range
        CHECK (start_at < end_at),

    CONSTRAINT fk_time_off_staff
        FOREIGN KEY (staff_account_id)
        REFERENCES staff_profiles(account_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_staff_time_off_range
    ON staff_time_off(
        staff_account_id,
        start_at,
        end_at
    );


-- ============================================================
-- 11. BOOKINGS
--
-- booking_status:
-- PENDING_PAYMENT
-- PENDING
-- CONFIRMED
-- CHECKED_IN
-- IN_SERVICE
-- COMPLETED
--
-- assignment_source:
-- SYSTEM
-- CUSTOMER
-- ADMIN
-- ============================================================

CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    booking_code VARCHAR(32) NOT NULL UNIQUE,

    customer_account_id BIGINT NOT NULL,

    staff_account_id BIGINT NULL,

    status ENUM(
        'PENDING_PAYMENT',
        'PENDING',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_SERVICE',
        'COMPLETED'
    ) NOT NULL DEFAULT 'PENDING_PAYMENT',

    assignment_source ENUM(
        'SYSTEM',
        'CUSTOMER',
        'ADMIN'
    ) NOT NULL DEFAULT 'SYSTEM',

    customer_name_snapshot VARCHAR(150) NOT NULL,

    customer_email_snapshot VARCHAR(255) NOT NULL,

    customer_phone_snapshot VARCHAR(30),

    booking_start DATETIME NOT NULL,

    booking_end DATETIME NOT NULL,

    customer_note TEXT,

    total_duration_minutes INT NOT NULL,

    total_amount DECIMAL(12,2) NOT NULL,

    checked_in_at DATETIME NULL,

    service_started_at DATETIME NULL,

    completed_at DATETIME NULL,

    created_by_account_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_bookings_time_range
        CHECK (booking_start < booking_end),

    CONSTRAINT chk_bookings_total_duration
        CHECK (total_duration_minutes > 0),

    CONSTRAINT chk_bookings_total_amount
        CHECK (total_amount >= 0),

    CONSTRAINT fk_bookings_customer
        FOREIGN KEY (customer_account_id)
        REFERENCES customer_profiles(account_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_bookings_staff
        FOREIGN KEY (staff_account_id)
        REFERENCES staff_profiles(account_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_bookings_created_by
        FOREIGN KEY (created_by_account_id)
        REFERENCES accounts(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_bookings_customer_start
    ON bookings(
        customer_account_id,
        booking_start
    );

CREATE INDEX idx_bookings_staff_calendar
    ON bookings(
        staff_account_id,
        booking_start,
        booking_end
    );

CREATE INDEX idx_bookings_status_start
    ON bookings(
        status,
        booking_start
    );


-- ============================================================
-- 12. BOOKING ITEMS
-- Một Booking có thể chứa nhiều Service
-- ============================================================

CREATE TABLE booking_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    booking_id BIGINT NOT NULL,

    service_id BIGINT NOT NULL,

    service_name_snapshot VARCHAR(150) NOT NULL,

    duration_minutes INT NOT NULL,

    base_price_snapshot DECIMAL(12,2) NOT NULL,

    additional_duration_steps INT NOT NULL DEFAULT 0,

    price_per_step_snapshot DECIMAL(12,2)
        NOT NULL DEFAULT 0,

    line_amount DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_booking_items_booking_service
        UNIQUE (booking_id, service_id),

    CONSTRAINT chk_booking_items_duration
        CHECK (duration_minutes > 0),

    CONSTRAINT chk_booking_items_prices
        CHECK (
            base_price_snapshot >= 0
            AND price_per_step_snapshot >= 0
        ),

    CONSTRAINT chk_booking_items_steps
        CHECK (additional_duration_steps >= 0),

    CONSTRAINT chk_booking_items_line_amount
        CHECK (line_amount >= 0),

    CONSTRAINT fk_booking_items_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_items_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_booking_items_service
    ON booking_items(service_id);


-- ============================================================
-- 13. BOOKING EVENTS
--
-- event_type examples:
-- CREATED
-- PAYMENT_RECEIVED
-- EMAIL_SENT
-- RESCHEDULED
-- CHECKED_IN
-- SERVICE_STARTED
-- COMPLETED
-- STAFF_ASSIGNED
-- ============================================================

CREATE TABLE booking_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    booking_id BIGINT NOT NULL,

    event_type VARCHAR(50) NOT NULL,

    actor_account_id BIGINT NULL,

    message VARCHAR(500) NOT NULL,

    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_events_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_events_actor
        FOREIGN KEY (actor_account_id)
        REFERENCES accounts(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX idx_booking_events_booking_time
    ON booking_events(
        booking_id,
        occurred_at
    );


-- ============================================================
-- 14. PAYMENTS
--
-- payment_status:
-- UNPAID
-- PAID
-- FAILED
-- REFUNDED
--
-- payment_method:
-- QR
-- CARD
-- AT_SPA
-- ============================================================

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    transaction_code VARCHAR(32) NOT NULL UNIQUE,

    booking_id BIGINT NOT NULL UNIQUE,

    status ENUM(
        'UNPAID',
        'PAID',
        'FAILED',
        'REFUNDED'
    ) NOT NULL DEFAULT 'UNPAID',

    method ENUM(
        'QR',
        'CARD',
        'AT_SPA'
    ) NOT NULL,

    amount DECIMAL(12,2) NOT NULL,

    qr_payload TEXT,

    paid_at DATETIME NULL,

    refunded_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payments_amount
        CHECK (amount >= 0),

    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_payments_status_method_created
    ON payments(
        status,
        method,
        created_at
    );


-- ============================================================
-- 15. SEPAY TRANSACTIONS
-- Durable webhook inbox and reconciliation audit trail
-- ============================================================

CREATE TABLE sepay_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    sepay_id BIGINT NOT NULL UNIQUE,

    gateway VARCHAR(50) NOT NULL,

    transaction_date DATETIME NULL,

    account_number VARCHAR(100) NULL,

    sub_account VARCHAR(100) NULL,

    payment_code VARCHAR(100) NULL,

    content VARCHAR(500) NULL,

    transfer_type VARCHAR(10) NOT NULL,

    transfer_amount DECIMAL(15,2) NOT NULL,

    accumulated DECIMAL(15,2) NULL,

    reference_code VARCHAR(150) NULL,

    raw_payload LONGTEXT NOT NULL,

    matched_payment_id BIGINT NULL UNIQUE,

    status VARCHAR(30) NOT NULL,

    review_reason VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sepay_transactions_amount
        CHECK (transfer_amount > 0),

    CONSTRAINT fk_sepay_transactions_payment
        FOREIGN KEY (matched_payment_id)
        REFERENCES payments(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX idx_sepay_transactions_status_created
    ON sepay_transactions(status, created_at);

CREATE INDEX idx_sepay_transactions_code
    ON sepay_transactions(payment_code);


-- ============================================================
-- 16. FEEDBACK
-- Rating từ 1 đến 5
-- Một Booking có tối đa một Feedback
-- ============================================================

CREATE TABLE feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    booking_id BIGINT NOT NULL UNIQUE,

    rating TINYINT NOT NULL,

    comment TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_feedback_rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT fk_feedback_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_feedback_rating
    ON feedback(rating);


-- ============================================================
-- DATABASE CREATED
-- ============================================================

SELECT 'lunara_spa created successfully' AS message;
