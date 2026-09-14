# Database Schema v1

Schema v1 cho Lunara/Rosa Spa, được phát triển từ Schema v0 và các luồng giao diện trong frontend/wireframe cùng frontend/FLOW.md.

Database target: **MySQL 8**.

## 1. Tổng quan

| Feature | Tables |
| --- | --- |
| Authentication & Account | roles, users, oauth_providers, oauth_accounts |
| Profiles | customer_profiles, staff_profiles, manager_profiles |
| Spa Service | spa_packages, staff_package_skills |
| Staff Schedule & Attendance | staff_working_hours, staff_time_off, attendance |
| Booking & Cancellation | booking_statuses, bookings, booking_items, booking_status_history, cancellation_request_statuses, booking_cancellation_requests |
| Staff Task | task_statuses, staff_tasks |
| Payment | payment_statuses, payments, payment_status_history |
| Feedback & Landing Page | feedback_ratings, feedback, site_content |

## 2. Các thay đổi chính từ v0

- Chuẩn hóa các typo về tên cột, kiểu dữ liệu và status: date_of_birth, created_by, created_at, DECIMAL, TINYINT, IN_PROGRESS.
- Một booking có nhiều dịch vụ thông qua booking_items; giá, tên dịch vụ và thời lượng được snapshot tại thời điểm đặt.
- Dịch vụ hỗ trợ thời lượng cố định hoặc tăng theo từng bước; wireframe hiện dùng bước tăng 30 phút.
- Bổ sung payment đầy đủ, lịch sử payment, huỷ lịch bằng OTP và lịch sử trạng thái tương ứng.
- Bổ sung staff_id trực tiếp vào staff_tasks và sửa unique chấm công thành (staff_id, work_date).
- /ticket/{id} sử dụng bookings.booking_code; không cần bảng ticket riêng.

## 3. Chi tiết bảng

### Authentication & Account

#### roles

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | tinyint | pk, increment |
| name | varchar(30) | not null, unique, note: 'USER / STAFF / MANAGER' |
| description | varchar(255) |  |

#### users

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| role_id | tinyint | not null |
| email | varchar(255) | not null, unique |
| password_hash | varchar(255) | note: 'Nullable for OAuth-only accounts' |
| full_name | varchar(150) | not null |
| gender | varchar(30) |  |
| date_of_birth | date |  |
| created_by | bigint |  |
| is_active | boolean | not null, default: true |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### oauth_providers

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | tinyint | pk, increment |
| name | varchar(50) | not null, unique, note: 'GOOGLE / FACEBOOK' |

#### oauth_accounts

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| user_id | bigint | not null |
| provider_id | tinyint | not null |
| provider_user_id | varchar(255) | not null |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |

### Profiles

#### customer_profiles

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| user_id | bigint | pk |
| address | varchar(500) |  |
| note | text |  |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### staff_profiles

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| user_id | bigint | pk |
| employee_code | varchar(50) | not null, unique |
| is_available | boolean | not null, default: true |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### manager_profiles

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| user_id | bigint | pk |
| employee_code | varchar(50) | not null, unique |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

### Spa Service

#### spa_packages

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| name | varchar(150) | not null |
| description | text |  |
| base_price | decimal(12,2) | not null, note: 'Price at minimum duration' |
| minimum_duration_minutes | int | not null |
| is_duration_adjustable | boolean | not null, default: false |
| duration_step_minutes | int | note: 'For example 30; null for fixed-duration services' |
| additional_step_price | decimal(12,2) | note: 'Null for fixed-duration services' |
| is_active | boolean | not null, default: true |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### staff_package_skills

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| staff_id | bigint | not null |
| package_id | bigint | not null |

### Staff Schedule & Attendance

#### staff_working_hours

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| staff_id | bigint | not null |
| day_of_week | tinyint | not null, note: '1 = Monday ... 7 = Sunday' |
| start_time | time | not null |
| end_time | time | not null |
| is_working | boolean | not null, default: true |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### staff_time_off

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| staff_id | bigint | not null |
| start_at | datetime | not null |
| end_at | datetime | not null |
| reason | varchar(500) |  |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### attendance

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| staff_id | bigint | not null |
| work_date | date | not null |
| check_in | datetime |  |
| check_out | datetime |  |
| note | varchar(500) |  |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |

### Booking & Cancellation

#### booking_statuses

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | tinyint | pk, increment |
| name | varchar(50) | not null, unique, note: 'PENDING / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED / REJECTED' |
| description | varchar(255) |  |

#### bookings

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_code | varchar(32) | not null, unique, note: 'Public identifier used by /ticket/{id}' |
| customer_id | bigint | not null |
| staff_id | bigint |  |
| status_id | tinyint | not null |
| booking_start | datetime | not null |
| booking_end | datetime | not null |
| cancellation_deadline | datetime | not null, note: 'Defaults to five hours before booking_start' |
| customer_note | text |  |
| assignment_type | varchar(20) | not null, default: 'AUTO', note: 'AUTO / MANUAL / CUSTOMER' |
| assigned_by_manager_id | bigint |  |
| total_duration_minutes | int | not null |
| total_amount | decimal(12,2) | not null |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### booking_items

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_id | bigint | not null |
| package_id | bigint | not null |
| package_name_snapshot | varchar(150) | not null |
| duration_minutes | int | not null |
| unit_price | decimal(12,2) | not null, note: 'Catalog price snapshot' |
| line_amount | decimal(12,2) | not null |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### booking_status_history

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_id | bigint | not null |
| old_status_id | tinyint |  |
| new_status_id | tinyint | not null |
| changed_by | bigint |  |
| note | varchar(500) |  |
| changed_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### cancellation_request_statuses

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | tinyint | pk, increment |
| name | varchar(50) | not null, unique, note: 'PENDING / VERIFIED / EXPIRED / FAILED' |
| description | varchar(255) |  |

#### booking_cancellation_requests

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_id | bigint | not null |
| requested_by_user_id | bigint | not null |
| status_id | tinyint | not null |
| otp_hash | varchar(255) | not null |
| attempt_count | int | not null, default: 0 |
| expires_at | datetime | not null |
| verified_at | datetime |  |
| reason | varchar(500) |  |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

### Staff Task

#### task_statuses

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | tinyint | pk, increment |
| name | varchar(50) | not null, unique, note: 'ASSIGNED / ACCEPTED / IN_PROGRESS / COMPLETED / REJECTED' |
| description | varchar(255) |  |

#### staff_tasks

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_id | bigint | not null, unique |
| staff_id | bigint | not null |
| status_id | tinyint | not null |
| assigned_by_manager_id | bigint |  |
| accepted_at | datetime |  |
| started_at | datetime |  |
| completed_at | datetime |  |
| staff_note | text |  |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

### Payment

#### payment_statuses

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | tinyint | pk, increment |
| name | varchar(50) | not null, unique, note: 'PENDING / PAID / FAILED / CANCELLED / REFUNDED' |
| description | varchar(255) |  |

#### payments

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| payment_code | varchar(32) | not null, unique |
| booking_id | bigint | not null |
| status_id | tinyint | not null |
| method | varchar(30) | not null, default: 'QR_MOCK' |
| amount | decimal(12,2) | not null |
| qr_payload | text |  |
| provider_reference | varchar(255) |  |
| expires_at | datetime |  |
| paid_at | datetime |  |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### payment_status_history

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| payment_id | bigint | not null |
| old_status_id | tinyint |  |
| new_status_id | tinyint | not null |
| changed_by | bigint |  |
| note | varchar(500) |  |
| changed_at | timestamp | not null, default: CURRENT_TIMESTAMP |

### Feedback & Landing Page

#### feedback_ratings

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | tinyint | pk |
| name | varchar(50) | not null, unique, note: 'CỰC TỆ / TỆ / BÌNH THƯỜNG / TỐT / XUẤT SẮC' |

#### feedback

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_id | bigint | not null, unique |
| rating_id | tinyint | not null |
| comment | text |  |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

#### site_content

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| section_key | varchar(100) | not null, unique, note: 'For example HERO / ABOUT / CONTACT' |
| title | varchar(255) |  |
| content | text |  |
| media_url | varchar(500) |  |
| display_order | int | not null, default: 0 |
| is_active | boolean | not null, default: true |
| updated_by | bigint |  |
| created_at | timestamp | not null, default: CURRENT_TIMESTAMP |
| updated_at | timestamp | not null, default: CURRENT_TIMESTAMP |

## 4. Quan hệ

| Tên quan hệ | Cột nguồn | Cardinality | Cột đích | Referential actions |
| --- | --- | --- | --- | --- |
| fk_users_role | users.role_id | N:1 | roles.id | delete: restrict, update: cascade |
| fk_users_created_by | users.created_by | N:1 | users.id | delete: set null, update: cascade |
| fk_oauth_accounts_user | oauth_accounts.user_id | N:1 | users.id | delete: cascade, update: cascade |
| fk_oauth_accounts_provider | oauth_accounts.provider_id | N:1 | oauth_providers.id | delete: restrict, update: cascade |
| fk_customer_profiles_user | users.id | 1:1 | customer_profiles.user_id | delete: cascade, update: cascade |
| fk_staff_profiles_user | users.id | 1:1 | staff_profiles.user_id | delete: cascade, update: cascade |
| fk_manager_profiles_user | users.id | 1:1 | manager_profiles.user_id | delete: cascade, update: cascade |
| fk_staff_package_skills_staff | staff_package_skills.staff_id | N:1 | staff_profiles.user_id | delete: cascade, update: cascade |
| fk_staff_package_skills_package | staff_package_skills.package_id | N:1 | spa_packages.id | delete: cascade, update: cascade |
| fk_staff_working_hours_staff | staff_working_hours.staff_id | N:1 | staff_profiles.user_id | delete: cascade, update: cascade |
| fk_staff_time_off_staff | staff_time_off.staff_id | N:1 | staff_profiles.user_id | delete: cascade, update: cascade |
| fk_bookings_customer | bookings.customer_id | N:1 | customer_profiles.user_id | delete: restrict, update: cascade |
| fk_bookings_staff | bookings.staff_id | N:1 | staff_profiles.user_id | delete: set null, update: cascade |
| fk_bookings_status | bookings.status_id | N:1 | booking_statuses.id | delete: restrict, update: cascade |
| fk_bookings_manager | bookings.assigned_by_manager_id | N:1 | manager_profiles.user_id | delete: set null, update: cascade |
| fk_booking_items_booking | booking_items.booking_id | N:1 | bookings.id | delete: cascade, update: cascade |
| fk_booking_items_package | booking_items.package_id | N:1 | spa_packages.id | delete: restrict, update: cascade |
| fk_booking_history_booking | booking_status_history.booking_id | N:1 | bookings.id | delete: cascade, update: cascade |
| fk_booking_history_old_status | booking_status_history.old_status_id | N:1 | booking_statuses.id | delete: restrict, update: cascade |
| fk_booking_history_new_status | booking_status_history.new_status_id | N:1 | booking_statuses.id | delete: restrict, update: cascade |
| fk_booking_history_changed_by | booking_status_history.changed_by | N:1 | users.id | delete: set null, update: cascade |
| fk_staff_tasks_booking | bookings.id | 1:1 | staff_tasks.booking_id | delete: cascade, update: cascade |
| fk_staff_tasks_staff | staff_tasks.staff_id | N:1 | staff_profiles.user_id | delete: restrict, update: cascade |
| fk_staff_tasks_status | staff_tasks.status_id | N:1 | task_statuses.id | delete: restrict, update: cascade |
| fk_staff_tasks_manager | staff_tasks.assigned_by_manager_id | N:1 | manager_profiles.user_id | delete: set null, update: cascade |
| fk_feedback_booking | bookings.id | 1:1 | feedback.booking_id | delete: cascade, update: cascade |
| fk_feedback_rating | feedback.rating_id | N:1 | feedback_ratings.id | delete: restrict, update: cascade |
| fk_attendance_staff | attendance.staff_id | N:1 | staff_profiles.user_id | delete: cascade, update: cascade |
| fk_site_content_updated_by | site_content.updated_by | N:1 | users.id | delete: set null, update: cascade |
| fk_payments_booking | payments.booking_id | N:1 | bookings.id | delete: restrict, update: cascade |
| fk_payments_status | payments.status_id | N:1 | payment_statuses.id | delete: restrict, update: cascade |
| fk_payment_history_payment | payment_status_history.payment_id | N:1 | payments.id | delete: cascade, update: cascade |
| fk_payment_history_old_status | payment_status_history.old_status_id | N:1 | payment_statuses.id | delete: restrict, update: cascade |
| fk_payment_history_new_status | payment_status_history.new_status_id | N:1 | payment_statuses.id | delete: restrict, update: cascade |
| fk_payment_history_changed_by | payment_status_history.changed_by | N:1 | users.id | delete: set null, update: cascade |
| fk_cancellation_requests_booking | booking_cancellation_requests.booking_id | N:1 | bookings.id | delete: cascade, update: cascade |
| fk_cancellation_requests_user | booking_cancellation_requests.requested_by_user_id | N:1 | users.id | delete: restrict, update: cascade |
| fk_cancellation_requests_status | booking_cancellation_requests.status_id | N:1 | cancellation_request_statuses.id | delete: restrict, update: cascade |

## 5. Lookup values

| Bảng | Giá trị |
| --- | --- |
| roles | USER, STAFF, MANAGER |
| oauth_providers | GOOGLE, FACEBOOK |
| booking_statuses | PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED |
| task_statuses | ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, REJECTED |
| payment_statuses | PENDING, PAID, FAILED, CANCELLED, REFUNDED |
| cancellation_request_statuses | PENDING, VERIFIED, EXPIRED, FAILED |
| feedback_ratings | 1 CỰC TỆ, 2 TỆ, 3 BÌNH THƯỜNG, 4 TỐT, 5 XUẤT SẮC |

## 6. Business rules

- Mỗi booking phải có ít nhất một booking_items; (booking_id, package_id) là duy nhất.
- bookings.total_duration_minutes bằng tổng thời lượng item; bookings.total_amount bằng tổng line_amount.
- Staff được chọn phải có skill cho toàn bộ package trong booking, nằm trong giờ làm, không time-off và không trùng booking.
- Khi không chọn Staff, assignment_type = AUTO; chọn từ giao diện là CUSTOMER; Manager đổi thủ công là MANUAL.
- cancellation_deadline mặc định bằng booking_start - 5 giờ; sau thời điểm này không tạo/yêu cầu xác nhận huỷ.
- OTP chỉ lưu dạng hash. Chỉ request PENDING, chưa hết hạn và chưa vượt giới hạn thử mới được xác minh.
- Một booking có thể có nhiều payment attempt nhưng chỉ được có một payment thành công ở tầng nghiệp vụ.
- Feedback chỉ được tạo một lần sau khi booking ở trạng thái COMPLETED.
- Staff task là quan hệ 1:1 với booking; staff_tasks.staff_id phải khớp Staff đang được gán cho booking.
- Email xác nhận và liên kết Calendar được sinh từ booking, booking items và payment; không lưu thành bảng riêng.
- Dashboard, Live, Calendar, Customers và Reports là dữ liệu truy vấn/tổng hợp, không tạo bảng báo cáo riêng.

## 7. Indexes và CHECK constraints

Các unique constraint khai báo trực tiếp trên cột nằm trong bảng chi tiết; bảng dưới đây liệt kê composite/secondary index và CHECK constraint.

| Bảng | Loại | Khai báo DBML |
| --- | --- | --- |
| users | Index | role_id |
| users | Index | is_active |
| oauth_accounts | Index | (user_id, provider_id) [pk] |
| oauth_accounts | Index | (provider_id, provider_user_id) [unique] |
| staff_profiles | Index | is_available |
| spa_packages | Index | (name) [unique] |
| spa_packages | Index | is_active |
| spa_packages | CHECK | base_price >= 0 [name: 'chk_spa_packages_base_price'] |
| spa_packages | CHECK | minimum_duration_minutes > 0 [name: 'chk_spa_packages_min_duration'] |
| spa_packages | CHECK | (is_duration_adjustable = false AND duration_step_minutes IS NULL AND additional_step_price IS NULL) OR (is_duration_adjustable = true AND duration_step_minutes > 0 AND additional_step_price >= 0) [name: 'chk_spa_packages_duration_rule'] |
| staff_package_skills | Index | (staff_id, package_id) [pk] |
| staff_package_skills | Index | package_id |
| staff_working_hours | Index | (staff_id, day_of_week) [unique] |
| staff_working_hours | CHECK | day_of_week BETWEEN 1 AND 7 [name: 'chk_working_hours_day'] |
| staff_working_hours | CHECK | start_time < end_time [name: 'chk_working_hours_time'] |
| staff_time_off | Index | (staff_id, start_at, end_at) |
| staff_time_off | CHECK | start_at < end_at [name: 'chk_staff_time_off_range'] |
| bookings | Index | (customer_id, booking_start) |
| bookings | Index | (staff_id, booking_start, booking_end) |
| bookings | Index | (status_id, booking_start) |
| bookings | CHECK | booking_start < booking_end [name: 'chk_bookings_time_range'] |
| bookings | CHECK | total_duration_minutes > 0 [name: 'chk_bookings_duration'] |
| bookings | CHECK | total_amount >= 0 [name: 'chk_bookings_total_amount'] |
| bookings | CHECK | assignment_type IN ('AUTO', 'MANUAL', 'CUSTOMER') [name: 'chk_bookings_assignment_type'] |
| booking_items | Index | (booking_id, package_id) [unique] |
| booking_items | Index | package_id |
| booking_items | CHECK | duration_minutes > 0 [name: 'chk_booking_items_duration'] |
| booking_items | CHECK | unit_price >= 0 [name: 'chk_booking_items_unit_price'] |
| booking_items | CHECK | line_amount >= 0 [name: 'chk_booking_items_line_amount'] |
| booking_status_history | Index | (booking_id, changed_at) |
| staff_tasks | Index | (staff_id, status_id) |
| feedback_ratings | CHECK | id BETWEEN 1 AND 5 [name: 'chk_feedback_ratings_id'] |
| feedback | Index | rating_id |
| attendance | Index | (staff_id, work_date) [unique] |
| attendance | CHECK | check_out IS NULL OR check_in IS NULL OR check_in <= check_out [name: 'chk_attendance_time'] |
| site_content | Index | (is_active, display_order) |
| payments | Index | (booking_id, created_at) |
| payments | Index | (status_id, created_at) |
| payments | Index | provider_reference |
| payments | CHECK | amount >= 0 [name: 'chk_payments_amount'] |
| payments | CHECK | method IN ('QR_MOCK') [name: 'chk_payments_method'] |
| payment_status_history | Index | (payment_id, changed_at) |
| booking_cancellation_requests | Index | (booking_id, status_id) |
| booking_cancellation_requests | Index | (requested_by_user_id, created_at) |
| booking_cancellation_requests | Index | expires_at |
| booking_cancellation_requests | CHECK | attempt_count >= 0 [name: 'chk_cancellation_attempt_count'] |
