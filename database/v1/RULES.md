# Luật dữ liệu cho dataset v1

Nguồn của mọi luật dưới đây là **schema** (`database/lunara_spa_v2.dbml`, `database/Web_DataBase_USTH.sql`) và
**code backend** (`backend/src/main/java/com/kevin/lunaraspa/**`). Generator và bộ kiểm phải cùng đọc file này;
khi code đổi luật thì sửa ở đây trước.

Quy ước: "snapshot" = `2026-09-15 15:00:00` (thời điểm hệ thống được chụp lại). Mọi mốc thời gian dùng
`Asia/Ho_Chi_Minh` và **không** vượt snapshot, trừ `booking_start` của booking tương lai.

## I. Tham chiếu

- I1. Mọi FK hợp lệ (`booking_items.service_id`, `bookings.customer_account_id`, `bookings.staff_account_id`,
  `booking_events.actor_account_id`, `accounts.provisioned_by_account_id`, `payments.booking_id`, `feedback.booking_id`).
- I2. `customer_profiles` chỉ chứa tài khoản role `CUSTOMER`; mọi tài khoản `CUSTOMER` đều có profile.
- I3. `staff_profiles` chỉ chứa tài khoản role `THERAPIST`; mọi tài khoản `THERAPIST` đều có profile.
- I4. `payments.booking_id` và `feedback.booking_id` là 1-1 với `bookings`; `booking_items(booking_id, service_id)` không trùng.

## II. Số học

- II1. `duration_minutes = minimum_duration_minutes + additional_duration_steps × duration_step_minutes`.
  Dịch vụ không điều chỉnh thời lượng ⇒ `additional_duration_steps = 0` và `price_per_step_snapshot = 0`.
- II2. `line_amount = base_price_snapshot + additional_duration_steps × price_per_step_snapshot`.
- II3. `Σ items.line_amount = bookings.total_amount`; `Σ items.duration_minutes = bookings.total_duration_minutes`.
- II4. `booking_end = booking_start + total_duration_minutes` (buffer **không** nằm trong `booking_end`;
  xem `BookingServiceImpl.java:136`).
- II5. `payments.amount = bookings.total_amount`.
- II6. Snapshot giá/tên trong `booking_items` phải bằng giá trị của `services` tại thời điểm `created_at`;
  nếu mô phỏng đổi giá thì `services.updated_at > booking.created_at` và snapshot **nhỏ hơn** giá hiện tại.

## III. Vòng đời booking & thanh toán

- III1. Chỉ dùng `PENDING_PAYMENT, CONFIRMED, CHECKED_IN, IN_SERVICE, COMPLETED`.
  `PENDING` không được xuất hiện vì code không bao giờ gán (`BookingServiceImpl.java:158`, `PaymentController.java:143`).
- III2. Thứ tự mốc: `created_at ≤ paid_at ≤ checked_in_at ≤ service_started_at ≤ completed_at ≤ snapshot`.
- III3. `PENDING_PAYMENT` ⇒ payment `UNPAID` hoặc `FAILED`; không có `checked_in_at/service_started_at/completed_at`.
- III4. `CONFIRMED` ⇒ payment `PAID`, hoặc `AT_SPA` + `UNPAID` khi `booking_start ≥ snapshot` (khách trả tại spa).
- III5. `CHECKED_IN` ⇒ có `checked_in_at`, chưa có `service_started_at`; `booking_start` cùng ngày snapshot.
- III6. `IN_SERVICE` ⇒ có `service_started_at`, chưa có `completed_at`; `booking_start` cùng ngày snapshot.
- III7. `COMPLETED` ⇒ có `completed_at` và `booking_start < snapshot`.
- III8. Payment: `PAID ⇒ paid_at NOT NULL`, `UNPAID|FAILED ⇒ paid_at NULL`,
  `REFUNDED ⇒ paid_at NOT NULL AND refunded_at ≥ paid_at`.
- III9. `AT_SPA` không bao giờ `FAILED`; `QR ⇒ qr_payload NOT NULL`; `CARD|AT_SPA ⇒ qr_payload NULL`.
- III10. `feedback` chỉ cho booking `COMPLETED`, `feedback.created_at ≥ completed_at`, `rating ∈ 1..5`.

## IV. Lịch & phân công

- IV1. Booking nằm trong `staff_working_hours` của đúng `day_of_week` với `is_active = 1`.
- IV2. Booking không giao với `staff_time_off` của staff đó.
- IV3. Hai booking cùng staff không giao nhau **kể cả buffer**:
  `[start - prep, end + cleanup]` của hai booking phải rời nhau.
- IV4. Một khách không có hai booking giao nhau.
- IV5. Staff của booking phải `is_bookable = 1` và có skill trong `staff_services` cho **mọi** dịch vụ của booking.
- IV6. Chỉ dùng dịch vụ `is_active = 1`.
- IV7. `assignment_source = SYSTEM` khi người đặt không chọn staff, `CUSTOMER` khi khách chọn staff,
  `ADMIN` khi booking do lễ tân/quản lý tạo (`BookingServiceImpl.java:143` + endpoint assign).
- IV8. `created_by_account_id`: khách tự đặt ⇒ bằng chính `customer_account_id`; ngược lại phải là tài khoản
  `RECEPTIONIST|MANAGER|OWNER`.

## V. Định danh & hồ sơ

- V1. `accounts.email` unique, đúng tiền tố theo role (`owner|manager|reception|therapist|accountant|customer`).
- V2. `accounts.display_name` không trùng nhau.
- V3. `google_subject` là chuỗi số unique; `last_login_at NOT NULL ⇔ google_subject NOT NULL`.
- V4. `provisioned_by_account_id` trỏ tới tài khoản được tạo **trước** tài khoản đang xét.
- V5. `staff_profiles.employee_code` unique theo `LNR-TH-###`; `job_title` không mâu thuẫn với nhóm dịch vụ
  mà staff có skill (ví dụ `Facial Specialist` phải có ít nhất một dịch vụ `FACIAL`).
- V6. `customer_profiles.phone` đúng định dạng VN (`0xxxxxxxxx`), unique, và bằng `customer_phone_snapshot`
  của booking gần nhất do khách đó tạo.

## VI. Thời gian

- VI1. Mọi `created_at/updated_at/occurred_at ≤ snapshot`.
- VI2. `updated_at ≥ created_at` trên mọi bảng.
- VI3. `staff_working_hours.created_at ≥ staff_profiles.created_at` (giờ làm việc không thể có trước nhân viên).
- VI4. Không có chênh lệch múi giờ: không xuất hiện cặp mốc lệch đúng bội số 7 giờ một cách hệ thống
  (lỗi cũ: `feedback.updated_at = created_at - 7h`).

## VII. Booking events

- VII1. `id` tăng đơn điệu theo `occurred_at` trong cùng một booking.
- VII2. Mỗi booking có `CREATED` đầu tiên; `occurred_at(CREATED) = bookings.created_at`.
- VII3. `PAYMENT_RECEIVED` ⇔ payment `PAID` hoặc `REFUNDED` (đã từng thu tiền); `CHECKED_IN` ⇔ status ∈ {CHECKED_IN, IN_SERVICE, COMPLETED};
  `SERVICE_STARTED` ⇔ status ∈ {IN_SERVICE, COMPLETED}; `COMPLETED` ⇔ status = COMPLETED.
- VII4. `STAFF_ASSIGNED` ⇔ `staff_account_id NOT NULL` (+ có thể có event đổi staff khi `assignment_source = ADMIN`).
- VII5. Actor đúng vai trò: `CREATED` bởi `created_by_account_id`; `CHECKED_IN` bởi lễ tân;
  `SERVICE_STARTED`/`COMPLETED` bởi chính staff của booking; `PAYMENT_RECEIVED` không cần actor.

## VIII. Chất lượng & độ phủ

- VIII1. Toàn bộ nội dung tiếng Việt; danh mục dịch vụ thuộc đúng ba mã mà UI đang lọc: `MASSAGE`, `FACIAL`, `BODY`
  (`frontend/lunara/src/components/landing/ServicesCollection.tsx`), vì UI lọc `s.category === activeCategory`.
- VIII2. `services.image_url` để NULL khi chưa có ảnh thật; UI đã có ảnh mặc định theo category.
- VIII3. Pool ghi chú khách ≥ 12 câu; mỗi booking có ghi chú phải dùng câu khác nhau khi pool còn chỗ
  (không lặp lại cho tới khi hết pool). Comment feedback: mỗi mức rating dùng ≥ 4 câu khác nhau và
  không lặp liền tiếp theo thời gian.
- VIII4. Mã sinh theo quy tắc, không tuần tự lộ liễu: `booking_code = LNR-YYYYMMDD-#####`,
  `transaction_code = PAY-YYYYMMDD-#####`, phone không tăng dần theo id tài khoản.
- VIII5. Độ phủ bắt buộc trong mỗi dataset:
  ≥ 1 booking 3 dịch vụ · ≥ 2 booking có `RESCHEDULED` · ≥ 1 ca snapshot giá cũ < giá hiện tại ·
  ≥ 1 refund kèm feedback 1–2 sao · ≥ 1 booking `AT_SPA` chưa trả · ≥ 1 khách có 2 booking cùng ngày khác staff.
