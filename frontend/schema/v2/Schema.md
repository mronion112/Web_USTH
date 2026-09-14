# Database Schema v2

Schema lean cho Lunara Spa, được thiết kế mới chỉ từ `frontend/wireframe` và `frontend/FLOW.md`.

- Database target: **MySQL 8**.
- Authentication: **Google-only** cho mọi vai trò.
- Booking cancellation và OTP: **không tồn tại trong schema v2**.

## 1. Tổng quan

| Feature | Tables |
| --- | --- |
| Identity, Google Auth & RBAC | roles, permissions, role_permissions, accounts, customer_profiles, staff_profiles |
| Services & Staff Availability | services, staff_services, staff_working_hours, staff_time_off |
| Booking, Operations, Payment & Feedback | bookings, booking_items, booking_events, payments, feedback |

## 2. Authentication và phân quyền

- Không có `username`, `password_hash` hoặc bảng OAuth provider.
- Customer mới được tạo khi Google login lần đầu hoặc được Admin thêm trước bằng email.
- Staff/Admin được pre-provision bằng email và role; lần Google login đầu tiên bind `google_subject` khi email khớp.
- `google_subject` được phép null trong giai đoạn pre-provision nhưng phải unique sau khi bind.
- `/auth` và `/admin/login` dùng cùng Google Auth; role/permission quyết định route và sidebar.
- Role mặc định: `OWNER`, `MANAGER`, `RECEPTIONIST`, `THERAPIST`, `ACCOUNTANT`, `CUSTOMER`.

## 3. Chi tiết bảng

### Identity, Google Auth & RBAC

#### roles

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | tinyint | pk, increment |
| code | varchar(30) | not null, unique, note: 'OWNER / MANAGER / RECEPTIONIST / THERAPIST / ACCOUNTANT / CUSTOMER' |
| name | varchar(100) | not null |
| description | varchar(255) |  |

#### permissions

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | smallint | pk, increment |
| code | varchar(100) | not null, unique |
| module | varchar(50) | not null, note: 'BOOKINGS / CUSTOMERS / PAYMENTS / REPORTS / ADMINISTRATION' |
| description | varchar(255) |  |

#### role_permissions

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| role_id | tinyint | not null |
| permission_id | smallint | not null |

#### accounts

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| role_id | tinyint | not null |
| google_subject | varchar(255) | unique, note: 'Google sub; null until a pre-provisioned account signs in' |
| email | varchar(255) | not null, unique |
| display_name | varchar(150) | not null |
| avatar_url | varchar(500) |  |
| is_active | boolean | not null, default: true |
| provisioned_by_account_id | bigint |  |
| last_login_at | datetime |  |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |
| updated_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

#### customer_profiles

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| account_id | bigint | pk |
| phone | varchar(30) |  |
| preferences | text |  |
| internal_notes | text |  |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |
| updated_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

#### staff_profiles

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| account_id | bigint | pk |
| employee_code | varchar(50) | not null, unique |
| job_title | varchar(100) | not null, note: 'For example Senior Therapist / Therapist / Specialist' |
| is_bookable | boolean | not null, default: true |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |
| updated_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

### Services & Staff Availability

#### services

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| name | varchar(150) | not null, unique |
| category | varchar(100) | not null |
| description | text |  |
| image_url | varchar(500) |  |
| base_price | decimal(12,2) | not null, note: 'Price at minimum duration' |
| minimum_duration_minutes | int | not null |
| is_duration_adjustable | boolean | not null, default: false |
| duration_step_minutes | int | note: '30 for adjustable service; null for fixed duration' |
| price_per_duration_step | decimal(12,2) | note: 'Null for fixed duration' |
| preparation_buffer_minutes | int | not null, default: 0 |
| cleanup_buffer_minutes | int | not null, default: 0 |
| display_order | int | not null, default: 0 |
| is_active | boolean | not null, default: true |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |
| updated_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

#### staff_services

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| staff_account_id | bigint | not null |
| service_id | bigint | not null |

#### staff_working_hours

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| staff_account_id | bigint | not null |
| day_of_week | tinyint | not null, note: '1 = Monday ... 7 = Sunday' |
| start_time | time | not null |
| end_time | time | not null |
| is_active | boolean | not null, default: true |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |
| updated_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

#### staff_time_off

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| staff_account_id | bigint | not null |
| start_at | datetime | not null |
| end_at | datetime | not null |
| reason | varchar(500) |  |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

### Booking, Operations, Payment & Feedback

#### bookings

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_code | varchar(32) | not null, unique, note: 'Used by ticket, admin search, email, and Calendar link' |
| customer_account_id | bigint | not null |
| staff_account_id | bigint |  |
| status | booking_status | not null, default: 'PENDING_PAYMENT' |
| assignment_source | assignment_source | not null, default: 'SYSTEM' |
| customer_name_snapshot | varchar(150) | not null |
| customer_email_snapshot | varchar(255) | not null |
| customer_phone_snapshot | varchar(30) |  |
| booking_start | datetime | not null |
| booking_end | datetime | not null |
| customer_note | text |  |
| total_duration_minutes | int | not null |
| total_amount | decimal(12,2) | not null |
| checked_in_at | datetime |  |
| service_started_at | datetime |  |
| completed_at | datetime |  |
| created_by_account_id | bigint | not null, note: 'Customer self-booking or Admin/Receptionist creating a booking' |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |
| updated_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

#### booking_items

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_id | bigint | not null |
| service_id | bigint | not null |
| service_name_snapshot | varchar(150) | not null |
| duration_minutes | int | not null |
| base_price_snapshot | decimal(12,2) | not null |
| additional_duration_steps | int | not null, default: 0 |
| price_per_step_snapshot | decimal(12,2) | not null, default: 0 |
| line_amount | decimal(12,2) | not null |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

#### booking_events

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_id | bigint | not null |
| event_type | varchar(50) | not null, note: 'CREATED / PAYMENT_RECEIVED / EMAIL_SENT / RESCHEDULED / CHECKED_IN / SERVICE_STARTED / COMPLETED / STAFF_ASSIGNED' |
| actor_account_id | bigint |  |
| message | varchar(500) | not null |
| occurred_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

#### payments

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| transaction_code | varchar(32) | not null, unique |
| booking_id | bigint | not null, unique |
| status | payment_status | not null, default: 'UNPAID' |
| method | payment_method | not null |
| amount | decimal(12,2) | not null |
| qr_payload | text |  |
| paid_at | datetime |  |
| refunded_at | datetime |  |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |
| updated_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

#### feedback

| Trường | Kiểu dữ liệu | Ràng buộc / ghi chú |
| --- | --- | --- |
| id | bigint | pk, increment |
| booking_id | bigint | not null, unique |
| rating | tinyint | not null, note: '1 to 5 stars' |
| comment | text |  |
| created_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |
| updated_at | timestamp | not null, default: `CURRENT_TIMESTAMP` |

## 4. Enums

| Enum | Values |
| --- | --- |
| booking_status | PENDING_PAYMENT, PENDING, CONFIRMED, CHECKED_IN, IN_SERVICE, COMPLETED |
| payment_status | UNPAID, PAID, FAILED, REFUNDED |
| payment_method | QR, CARD, AT_SPA |
| assignment_source | SYSTEM, CUSTOMER, ADMIN |

`UPCOMING` và `NEED_STAFF` là trạng thái hiển thị suy ra từ thời gian/Staff assignment; không lưu thành status. Không có status `CANCELLED`.

## 5. Quan hệ

| Tên quan hệ | Cột nguồn | Cardinality | Cột đích | Referential actions |
| --- | --- | --- | --- | --- |
| fk_role_permissions_role | role_permissions.role_id | N:1 | roles.id | delete: cascade, update: cascade |
| fk_role_permissions_permission | role_permissions.permission_id | N:1 | permissions.id | delete: cascade, update: cascade |
| fk_accounts_role | accounts.role_id | N:1 | roles.id | delete: restrict, update: cascade |
| fk_accounts_provisioned_by | accounts.provisioned_by_account_id | N:1 | accounts.id | delete: set null, update: cascade |
| fk_customer_profiles_account | accounts.id | 1:1 | customer_profiles.account_id | delete: cascade, update: cascade |
| fk_staff_profiles_account | accounts.id | 1:1 | staff_profiles.account_id | delete: cascade, update: cascade |
| fk_staff_services_staff | staff_services.staff_account_id | N:1 | staff_profiles.account_id | delete: cascade, update: cascade |
| fk_staff_services_service | staff_services.service_id | N:1 | services.id | delete: cascade, update: cascade |
| fk_working_hours_staff | staff_working_hours.staff_account_id | N:1 | staff_profiles.account_id | delete: cascade, update: cascade |
| fk_time_off_staff | staff_time_off.staff_account_id | N:1 | staff_profiles.account_id | delete: cascade, update: cascade |
| fk_bookings_customer | bookings.customer_account_id | N:1 | customer_profiles.account_id | delete: restrict, update: cascade |
| fk_bookings_staff | bookings.staff_account_id | N:1 | staff_profiles.account_id | delete: set null, update: cascade |
| fk_bookings_created_by | bookings.created_by_account_id | N:1 | accounts.id | delete: restrict, update: cascade |
| fk_booking_items_booking | booking_items.booking_id | N:1 | bookings.id | delete: cascade, update: cascade |
| fk_booking_items_service | booking_items.service_id | N:1 | services.id | delete: restrict, update: cascade |
| fk_booking_events_booking | booking_events.booking_id | N:1 | bookings.id | delete: cascade, update: cascade |
| fk_booking_events_actor | booking_events.actor_account_id | N:1 | accounts.id | delete: set null, update: cascade |
| fk_payments_booking | bookings.id | 1:1 | payments.booking_id | delete: restrict, update: cascade |
| fk_feedback_booking | bookings.id | 1:1 | feedback.booking_id | delete: cascade, update: cascade |

## 6. Indexes và CHECK constraints

| Bảng | Loại | Khai báo DBML |
| --- | --- | --- |
| permissions | Index | module |
| role_permissions | Index | (role_id, permission_id) [pk] |
| role_permissions | Index | permission_id |
| accounts | Index | role_id |
| accounts | Index | is_active |
| customer_profiles | Index | phone |
| staff_profiles | Index | is_bookable |
| services | Index | (category, is_active, display_order) |
| services | CHECK | base_price >= 0 [name: 'chk_services_base_price'] |
| services | CHECK | minimum_duration_minutes > 0 [name: 'chk_services_minimum_duration'] |
| services | CHECK | preparation_buffer_minutes >= 0 AND cleanup_buffer_minutes >= 0 [name: 'chk_services_buffers'] |
| services | CHECK | (is_duration_adjustable = false AND duration_step_minutes IS NULL AND price_per_duration_step IS NULL) OR (is_duration_adjustable = true AND duration_step_minutes > 0 AND price_per_duration_step >= 0) [name: 'chk_services_duration_pricing'] |
| staff_services | Index | (staff_account_id, service_id) [pk] |
| staff_services | Index | service_id |
| staff_working_hours | Index | (staff_account_id, day_of_week, start_time) [unique] |
| staff_working_hours | Index | (staff_account_id, day_of_week, is_active) |
| staff_working_hours | CHECK | day_of_week BETWEEN 1 AND 7 [name: 'chk_working_hours_day'] |
| staff_working_hours | CHECK | start_time < end_time [name: 'chk_working_hours_range'] |
| staff_time_off | Index | (staff_account_id, start_at, end_at) |
| staff_time_off | CHECK | start_at < end_at [name: 'chk_staff_time_off_range'] |
| bookings | Index | (customer_account_id, booking_start) |
| bookings | Index | (staff_account_id, booking_start, booking_end) |
| bookings | Index | (status, booking_start) |
| bookings | CHECK | booking_start < booking_end [name: 'chk_bookings_time_range'] |
| bookings | CHECK | total_duration_minutes > 0 [name: 'chk_bookings_total_duration'] |
| bookings | CHECK | total_amount >= 0 [name: 'chk_bookings_total_amount'] |
| booking_items | Index | (booking_id, service_id) [unique] |
| booking_items | Index | service_id |
| booking_items | CHECK | duration_minutes > 0 [name: 'chk_booking_items_duration'] |
| booking_items | CHECK | base_price_snapshot >= 0 AND price_per_step_snapshot >= 0 [name: 'chk_booking_items_prices'] |
| booking_items | CHECK | additional_duration_steps >= 0 [name: 'chk_booking_items_steps'] |
| booking_items | CHECK | line_amount >= 0 [name: 'chk_booking_items_line_amount'] |
| booking_events | Index | (booking_id, occurred_at) |
| payments | Index | (status, method, created_at) |
| payments | CHECK | amount >= 0 [name: 'chk_payments_amount'] |
| feedback | Index | rating |
| feedback | CHECK | rating BETWEEN 1 AND 5 [name: 'chk_feedback_rating'] |

## 7. Business rules

- Mỗi booking có ít nhất một `booking_items` và không lặp cùng service.
- `duration_minutes = minimum_duration_minutes + additional_duration_steps × duration_step_minutes`.
- `line_amount = base_price_snapshot + additional_duration_steps × price_per_step_snapshot`.
- Tổng duration/amount của booking bằng tổng booking items.
- Khoảng giữ lịch gồm preparation buffer + service duration + cleanup buffer.
- Staff phải active/bookable, có toàn bộ skill, trong working hours, không time-off và không trùng booking.
- Lifecycle: `PENDING_PAYMENT → PENDING/CONFIRMED → CHECKED_IN → IN_SERVICE → COMPLETED`.
- Receptionist thực hiện check-in; Therapist chỉ bắt đầu và hoàn thành dịch vụ.
- Payment `PAID` và booking `CONFIRMED` được cập nhật trong cùng transaction. Một booking có tối đa một payment.
- Feedback chỉ được tạo một lần khi booking `COMPLETED`.
- Reschedule cập nhật thời gian và thêm `booking_events`; email/calendar update được ghi event.
- Dashboard, Live, Calendar, Customers, Staff utilization, Payments và Reports là truy vấn tổng hợp từ schema.
- Landing Page lấy Services từ `services` và Customer Reviews từ `feedback`; hero/about là nội dung frontend tĩnh.
- `booking_code` dùng cho ticket, admin search, email và Calendar link; không tạo bảng ticket.
