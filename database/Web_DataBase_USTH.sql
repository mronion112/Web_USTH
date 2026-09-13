DROP DATABASE IF EXISTS rosa_spa;

CREATE DATABASE rosa_spa;

USE rosa_spa;


-- ============================================================
-- 1. ROLES
-- USER | STAFF | MANAGER
-- ============================================================

CREATE TABLE roles (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255)
);

INSERT INTO roles (name, description)
VALUES
    ('USER', 'Khách hàng của Rosa Spa'),
    ('STAFF', 'Nhân viên Rosa Spa'),
    ('MANAGER', 'Quản lý Rosa Spa');


-- ============================================================
-- 2. USERS
-- Account chung cho USER / STAFF / MANAGER
-- ============================================================

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    role_id TINYINT NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),

    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE,

    gender VARCHAR(20),
    date_of_birth DATE,

    created_by BIGINT NULL,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_users_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX idx_users_role
    ON users(role_id);

CREATE INDEX idx_users_email
    ON users(email);


-- ============================================================
-- 3. OAUTH PROVIDERS
-- Google / Facebook
-- ============================================================

CREATE TABLE oauth_providers (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO oauth_providers (name)
VALUES
    ('GOOGLE'),
    ('FACEBOOK');


-- ============================================================
-- 4. OAUTH ACCOUNTS
-- Một account có thể liên kết Google / Facebook
-- ============================================================

CREATE TABLE oauth_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    provider_id TINYINT NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_oauth_provider_account
        UNIQUE (provider_id, provider_user_id),

    CONSTRAINT uq_user_provider
        UNIQUE (user_id, provider_id),

    CONSTRAINT fk_oauth_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_oauth_provider
        FOREIGN KEY (provider_id)
        REFERENCES oauth_providers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 5. CUSTOMER PROFILE
-- Profile dành cho USER
-- ============================================================

CREATE TABLE customer_profiles (
    user_id BIGINT PRIMARY KEY,

    address VARCHAR(500),
    note TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 6. STAFF PROFILE
-- Profile dành cho STAFF
-- ============================================================

CREATE TABLE staff_profiles (
    user_id BIGINT PRIMARY KEY,

    employee_code VARCHAR(50) NOT NULL UNIQUE,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_staff_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 7. MANAGER PROFILE
-- Profile dành cho MANAGER
-- ============================================================

CREATE TABLE manager_profiles (
    user_id BIGINT PRIMARY KEY,

    employee_code VARCHAR(50) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_manager_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 8. SPA PACKAGES
-- Các gói dịch vụ của Rosa Spa
-- ============================================================

CREATE TABLE spa_packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    description TEXT,

    price DECIMAL(12,2) NOT NULL,
    duration_minutes INT NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_spa_package_price
        CHECK (price >= 0),

    CONSTRAINT chk_spa_package_duration
        CHECK (duration_minutes > 0)
);


-- ============================================================
-- 9. STAFF PACKAGE SKILLS
-- Staff nào có thể thực hiện gói dịch vụ nào
-- ============================================================

CREATE TABLE staff_package_skills (
    staff_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,

    PRIMARY KEY (staff_id, package_id),

    CONSTRAINT fk_staff_skill_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff_profiles(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_staff_skill_package
        FOREIGN KEY (package_id)
        REFERENCES spa_packages(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_staff_skill_package
    ON staff_package_skills(package_id);


-- ============================================================
-- 10. STAFF WORKING HOURS
-- Lịch làm việc mặc định của Staff
--
-- day_of_week:
-- 1 = Monday
-- 2 = Tuesday
-- ...
-- 7 = Sunday
-- ============================================================

CREATE TABLE staff_working_hours (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    staff_id BIGINT NOT NULL,

    day_of_week TINYINT NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    is_working BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_working_day
        CHECK (day_of_week BETWEEN 1 AND 7),

    CONSTRAINT chk_working_time
        CHECK (start_time < end_time),

    CONSTRAINT fk_working_hours_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff_profiles(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_working_hours_staff_day
    ON staff_working_hours(staff_id, day_of_week);


-- ============================================================
-- 11. STAFF TIME OFF
-- Thời gian Staff nghỉ / bận
-- ============================================================

CREATE TABLE staff_time_off (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    staff_id BIGINT NOT NULL,

    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,

    reason VARCHAR(500),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_time_off
        CHECK (start_at < end_at),

    CONSTRAINT fk_time_off_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff_profiles(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_staff_time_off
    ON staff_time_off(staff_id, start_at, end_at);


-- ============================================================
-- 12. BOOKING STATUS
-- ============================================================

CREATE TABLE booking_statuses (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

INSERT INTO booking_statuses (name, description)
VALUES
    ('PENDING', 'Đang chờ xác nhận'),
    ('CONFIRMED', 'Booking đã được xác nhận'),
    ('IN_PROGRESS', 'Staff đang thực hiện'),
    ('COMPLETED', 'Đã hoàn thành'),
    ('CANCELLED', 'Khách hàng hủy'),
    ('REJECTED', 'Booking bị từ chối');


-- ============================================================
-- 13. BOOKINGS
-- Bảng chính quản lý lịch đặt Spa
-- ============================================================

CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,

    -- Có thể NULL khi chưa phân Staff
    staff_id BIGINT NULL,

    status_id TINYINT NOT NULL,

    booking_start DATETIME NOT NULL,
    booking_end DATETIME NOT NULL,

    customer_note TEXT,

    -- AUTO     = Greedy Algorithm
    -- MANUAL   = Manager phân công
    -- CUSTOMER = Khách hàng tự chọn Staff
    assignment_type VARCHAR(20),

    assigned_by_manager_id BIGINT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_booking_time
        CHECK (booking_start < booking_end),

    CONSTRAINT chk_assignment_type
        CHECK (
            assignment_type IS NULL
            OR assignment_type IN ('AUTO', 'MANUAL', 'CUSTOMER')
        ),

    CONSTRAINT fk_booking_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer_profiles(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_package
        FOREIGN KEY (package_id)
        REFERENCES spa_packages(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff_profiles(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_booking_status
        FOREIGN KEY (status_id)
        REFERENCES booking_statuses(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_manager
        FOREIGN KEY (assigned_by_manager_id)
        REFERENCES manager_profiles(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX idx_booking_customer
    ON bookings(customer_id);

CREATE INDEX idx_booking_staff
    ON bookings(staff_id);

CREATE INDEX idx_booking_package
    ON bookings(package_id);

CREATE INDEX idx_booking_status
    ON bookings(status_id);

CREATE INDEX idx_booking_time
    ON bookings(booking_start, booking_end);

CREATE INDEX idx_booking_staff_calendar
    ON bookings(staff_id, booking_start, booking_end);


-- ============================================================
-- 14. BOOKING STATUS HISTORY
-- Lưu lịch sử thay đổi trạng thái Booking
-- ============================================================

CREATE TABLE booking_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    booking_id BIGINT NOT NULL,

    old_status_id TINYINT NULL,
    new_status_id TINYINT NOT NULL,

    changed_by BIGINT NULL,

    note VARCHAR(500),

    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_history_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_history_old_status
        FOREIGN KEY (old_status_id)
        REFERENCES booking_statuses(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_history_new_status
        FOREIGN KEY (new_status_id)
        REFERENCES booking_statuses(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_history_user
        FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX idx_booking_history_booking
    ON booking_status_history(booking_id);


-- ============================================================
-- 15. TASK STATUS
-- ============================================================

CREATE TABLE task_statuses (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO task_statuses (name)
VALUES
    ('ASSIGNED'),
    ('ACCEPTED'),
    ('IN_PROGRESS'),
    ('COMPLETED'),
    ('REJECTED');


-- ============================================================
-- 16. STAFF TASKS
-- Task được giao cho Staff từ Booking
-- ============================================================

CREATE TABLE staff_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    booking_id BIGINT NOT NULL UNIQUE,

    status_id TINYINT NOT NULL,

    assigned_by_manager_id BIGINT NULL,

    accepted_at DATETIME NULL,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,

    staff_note TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_task_status
        FOREIGN KEY (status_id)
        REFERENCES task_statuses(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_task_manager
        FOREIGN KEY (assigned_by_manager_id)
        REFERENCES manager_profiles(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- ============================================================
-- 17. FEEDBACK RATINGS
-- 5 mức đánh giá
-- ============================================================

CREATE TABLE feedback_ratings (
    id TINYINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO feedback_ratings (id, name)
VALUES
    (1, 'CỰC TỆ'),
    (2, 'TỆ'),
    (3, 'BÌNH THƯỜNG'),
    (4, 'TỐT'),
    (5, 'XUẤT SẮC');


-- ============================================================
-- 18. FEEDBACK
-- Mỗi Booking được Feedback tối đa 1 lần
-- ============================================================

CREATE TABLE feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    booking_id BIGINT NOT NULL UNIQUE,

    rating_id TINYINT NOT NULL,

    comment TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_feedback_rating
        FOREIGN KEY (rating_id)
        REFERENCES feedback_ratings(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_feedback_rating
    ON feedback(rating_id);


-- ============================================================
-- 19. ATTENDANCE
-- Staff chấm công
-- ============================================================

CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    staff_id BIGINT NOT NULL,

    work_date DATE NOT NULL,

    check_in DATETIME NULL,
    check_out DATETIME NULL,

    note VARCHAR(500),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_attendance_staff_date
        UNIQUE (staff_id, work_date),

    CONSTRAINT chk_attendance_time
        CHECK (
            check_out IS NULL
            OR check_in IS NULL
            OR check_out >= check_in
        ),

    CONSTRAINT fk_attendance_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff_profiles(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_attendance_date
    ON attendance(work_date);


-- ============================================================
-- 20. SITE CONTENT
-- Nội dung Landing Page
-- MySQL lưu dữ liệu chính, Redis dùng để Cache
-- ============================================================

-- CREATE TABLE site_content (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,

--     section_key VARCHAR(100) NOT NULL UNIQUE,

--     title VARCHAR(255),
--     content TEXT,
--     image_url VARCHAR(500),

--     is_active BOOLEAN NOT NULL DEFAULT TRUE,

--     updated_by BIGINT NULL,

--     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

--     updated_at TIMESTAMP NOT NULL
--         DEFAULT CURRENT_TIMESTAMP
--         ON UPDATE CURRENT_TIMESTAMP,

--     CONSTRAINT fk_site_content_manager
--         FOREIGN KEY (updated_by)
--         REFERENCES manager_profiles(user_id)
--         ON UPDATE CASCADE
--         ON DELETE SET NULL
-- );


-- ============================================================
-- DEFAULT LANDING PAGE CONTENT
-- ============================================================

INSERT INTO site_content (section_key, title, content)
VALUES
    (
        'ABOUT',
        'Về Rosa',
        'Giới thiệu về Rosa Spa'
    ),
    (
        'TEAM',
        'Đội ngũ',
        'Đội ngũ chuyên viên của Rosa Spa'
    ),
    (
        'FEEDBACK',
        'Feedback',
        'Đánh giá của khách hàng'
    ),
    (
        'CONTACT',
        'Liên hệ',
        'Thông tin liên hệ Rosa Spa'

    );