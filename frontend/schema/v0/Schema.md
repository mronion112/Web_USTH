# Schema

Link Github nhóm : Web_USTH_Github

## 1, Các nhóm bảng trong database

| Feature | Table |
| --- | --- |
| Authentication/Authorization & Account | roles, users, oauth_providers, oauth_accounts |
| Profiles | customer_profiles, staff_profiles, manager_profiles |
| Spa Service ( các gói dịch vụ) | spa_packages, staff_package_skills |
| Staff Schedule ( Lịch nhân viên ) | Staff_working_hours, staff_time_off |
| Booking | Booking_statuses, bookings, bookings_status_history |
| Task | Task_statuses, staff_tasks |
| Feedback | Feedback_ratings, feedback |
| Attendance ( Cho nhân viên ) | Attendance |
| Landing Page | site_content |

## 2, Chi tiết các bảng trong database

### 2.1, Authentication & Account

#### roles :

Lưu 3 role cơ bản : USER, STAFF và MANAGER.

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | TINYINT | PK, AUTO_INCREMENT | ID của role |
| name | VARCHAR(30) | UNIQUE | Tên role : “USER”, “STAFF”, “MANAGER” |
| description | VARCHAR(255) |  | Mô tả vai trò Account |

Foreign Key : users.role_id → roles.id

#### users

Account chung cho toàn bộ USER / STAFF / MANAGER

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | ID tài khoản |
| role_id | TINYINT | FK | Role của tài khoản |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| password_hash | VARCHAR(255) |  | Mật khẩu đã được BCrypt, có thể null với OAuth Account |
| full_name | VARCHAR(150) | NOT NULL | Họ tên |
| gender | VARCHAR(150) |  | Giới tính |
| data_of_birth | DATE |  | Ngày sinh |
| create_by | BIGINT | FK, NULL | Account tạo user này, self-reference tới users.id |

Foreign Key : role_id → roles.id

created_by → users.id

Note : User sẽ tự tạo tài khoản của chính mình

STAFF / MANAGER sẽ được MANAGER hoặc hệ thống tạo tài khoản

#### oauth_providers

Danh sách OAuth2 : Facebook, Email, …

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | TINYINT | PK, AUTO_INCREMENT | ID provider |
| name | VARCHAR(50) | UNIQUE | Tên provider : Facebook, Email, … |

#### Oauth_accounts

Các tài khoản sử dụng OAuth : Google, Facebook, …

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| user_id | BIGINT | FK | id tài khoản |
| provider_id | TINYINT | FK | OAuth provider |
| provider_user_id | VARCHAR(255) | NOT NULL | ID User do provider trả về |
| create_at | TIMESTAMP |  | Thời điểm liên kết |

Foreign Key : user_id → users.id

provider_id → oauth_providers.id

### 2.2, Profiles

#### customer_profiles

Thông tin của user

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| user_id | BIGINT | PK, FK | ID user |
| address | VARCHAR(500) |  | Địa chỉ khách hàng |
| note | TEXT |  | Ghi chú |
| create_at | TIMESTAMP |  | Ngày tạo profile |

Foreign key : user_id → users.id

#### staff_profiles

Thông tin nhân viên Staff

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| user_id | BIGINT | PK, FK | ID user của staff |
| employee_code | VARCHAR(50) | UNIQUE | Mã nhân viên |
| is_available | BOOLEAN |  | Stage có thể nhận lịch |

Foreign Key : user_id → users.id

#### manager_profiles

Thông tin của Manager

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| user_id | BIGINT | PK, FK | ID user của Manager |
| employee_code | VARCHAR(50) | UNIQUE | Mã quản lý |
| create_at | TIMESTAMP |  | Ngày tạo profile |

Foreign Key : user_id → users.id

### 2.3, Spa Service

#### spa_packages

Danh sách các gói dịch vụ

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | ID gói dịch vụ |
| name | VARCHAR(150) | NOT NULL | Tên dịch vụ |
| description | TEXT |  | Mô tả |
| price | DEMICAL(12,2) |  | Giá dịch vụ |
| duration_minutes | INT | NOT NULL | Thời lượng dịch vụ theo phút |
| is_active | BOOLEAN |  | Gói còn hiển thị/cho phép booking không |

#### staff_package_skills

Bảng One-Many, Staff có thể làm được dịch vụ ( package ) nào

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| staff_id | BIGINT | PK, FK | id Staff |
| package_id | BIGINT | PK, FK | Package Staff có thể thực hiện |

Foreign Key : staff_id → staff_profile.user_id

package_id → spa_packages.id

### 2.4. Staff Schedule

#### staff_working_hours

Lịch làm việc trong 1 tuần của Staff

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | ID lịch làm |
| staff_id | BIGINT | FK | Staff |
| day_of_week | TINYINT | NOT NULL | 1 = Monday …. 7 = Sunday |
| start_time | TIME | NOT NULL | Giờ bắt đầu |
| end_time | TIME | NOT NULL | Giờ kết thúc |
| is_working | BOOLEAN |  | Ngày này có làm việc hay không ( Chấm công ) |

Foreign Key : staff_id → staff_profiles.user_id

#### staff_time_off

Khoảng thời gian Staff nghỉ/bận và không thể nhận Booking

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| Id | BIGINT | PK, AUTO_INCREMENT | Id time-off |
| staff_id | BIGINT | FK | Staff |
| start_at | DATETIME | NOT NULL | Bắt đầu nghỉ/bận |
| end_at | DATETIME | NOT NULL | Kêt thúc nghỉ/bận |
| reason | VARCHAR(500) |  | Lý do nghỉ/bận |
| create_at | TIMESTAMP |  | Ngày tạo |

Foreign Key : staff_id → staff_profiles.user_id

### 2.5, Booking

#### booking_statuses

Danh sách booking stage

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | TINYINT | PK, AUTO_INCREMENT | ID Stage |
| name | VARCHAR(50) | UNIQUE | PENDING / CONFIRMED / IN_PROCESS / COMPLETED / CANCELLED / REJECTED |
| description | VARCHAR(225) |  | Mô tả |

#### bookings

Booking DashBoard

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | Id booking |
| customer_id | BIGINT | FK | ID khách hàng đặt lịch |
| package_id | BIGINT | FK | ID gói dịch vụ |
| staff_id | BIGINT | FK, NULL | ID Staff giao việc. Có thể NULL trước khi được phân công |
| status_id | TINYINT | FK | Trạng thái booking |
| booking_start | DATETIME | NOT NULL | Thời điểm bắt đầu |
| booking_end | DATETIME | NOT NULL | Thời điểm kết thúc |
| customer_note | TEXT |  | Ghi chú từ khách |
| assignment_type | VARCHAR(20) |  | AUTO / MANUAL / CUSTOMER |
| assigned_by_manager_id | BIGINT | FK, NULL | Manager phân công ( nếu có, Type = Manual ) |
| create_at | TIMESTAMP |  | Ngày tạo |
| updated_at | TIMESTAMP |  | Ngày cập nhập |

Foreign Key : customer_id → customer_profiles.user_id

package_id → spa_packages.id

staff_id → staff_profiles.user_id

status.id → booking_statuses.id

assigned_by_manager_id → manager_profiles.user.id

#### booking_status_history :

Lưu lịch sử thay đổi của booking

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | ID lịch sử |
| booking_id | BIGINT | FK | Booking |
| old_status_id | TINYINT | FK, NULL | Trạng thái cũ |
| new_status_id | TINYINT | FK | Trạng thái mới |
| changed_by | BIGINT | FK, NULL | User thực hiện thay đổi |
| note | VARCHAR(500) |  | Ghi chú |
| changed_at | TIMESTAMP |  | Thời điểm thay đổi |

Foreign Key : booking_id → bookings.id

status IDs → booking_statuses.id

changed_by → users.id

### 2.6, Staff Task

#### task_statuses

Danh sách stage công việc của staff

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | TINYINIT | PK, AUTO_INCREMENT | ID stage task |
| name | VARCHAR(50) | UNIQUE | ASSIGNED / ACCEPTED / IN_PROCGRESS / COMPLETED / REJECTED |

#### staff_tasks

Các task của Staff

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | ID Task |
| booking_id | BIGINT | FK, UNIQUE | Booking ID |
| status_id | TINYINT | FK | Task Stage |
| assigned_by_manager_id | BIGINT | FK, NULL | Manager phân task ( nếu có ) |
| accepted_at | DATETIME |  | Thời điểm nhận task |
| started_at | DATETIME |  | Thời điểm bắt đầu |
| completed_at | DATETIME |  | Thời điểm hoàn thành |
| staff_note | TEXT |  | Ghi chú của Staff |
| created_ats | TIMESTAMP |  | Ngày tạo |
| updated_at | TIMESTAMP |  | Ngày cập nhập |

Foreign Key : booking_id → bookings.id

status_id → task_statuses.id

assigned_by_manager_id → manager_profiles.user_id

### 2.7, Feedback

#### feedback_ratings

5 mức đánh giá cố định : CỰC TỆ / TỆ / BÌNH THƯỜNG / TỐT / XUẤT SẮC

| Trường | Kiểu dữ liệu | Key | Ý Nghĩa |
| --- | --- | --- | --- |
| id | TINYINT | PK | 1…5 |
| name | VARCHAR(50) | UNIQUE | CỰC TỆ / TỆ / BÌNH THƯỜNG / TỐT / XUẤT SẮC |

#### feedback

Feedback của khách sau booking

| Trường | Kiểu dữ liệu | Key | Tác dụng |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | ID feedback |
| booking_id | BIGINT | FK, UNIQUE | Id Booking |
| rating_id | TINYINT | FK | Mức đánh giá |
| comment | TEXT |  | Nội dung nhận xét |
| created_at | TIMESTAMP |  | Ngày tạo |
| updated_at | TIMESTAMP |  | Ngày cập nhập |

Foreign Key : booking_id → bookings.id

rating_id → feedback_ratings.id

### 2.8, Attendance

#### attendance

Lưu chấm công vào/ra của Staff theo ngày

| Trường | Kiểu dữ liệu | Key | Ý nghĩa |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | ID Attendance |
| staff_id | BIGINT | FK | STAFF |
| work_date | DATE | UNIQUE | Ngày làm việc |
| check_in | DATETIME |  | Giờ checkin |
| check_out | DATETIME |  | Giờ checkout |
| note | VARCHAR(500) |  | Ghi chú |
| created_at | TIMESTAMP |  | Ngày tạo record |

Foreign Key : staff_id → staff_profiles.user_id
