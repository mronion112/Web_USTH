# Kiến trúc và mô hình nghiệp vụ

## Sơ đồ chạy

```text
Browser (React SPA :5173 / Nginx :80)
  ├─ Google OAuth redirect ─────────────────────► Spring Boot :8080
  ├─ REST + Bearer JWT ─────────────────────────► Spring Boot :8080 ─► MySQL
  ├─ GET /api/events (SSE, Bearer JWT) ◄──────── Spring SSE hub ◄─ Kafka consumer
  └─ polling fallback ◄───────────────────────── REST API

Spring Boot ──transaction commit──► Kafka: booking.events/payment.events/schedule.events
Spring Boot ──optional──► Gmail API (OAuth refresh token) ──► email + .ics
Spring Boot ◄──signed webhook───── SePay
Spring chatbot ──optional───────── Gemini API + Chroma vector DB

Agent v0 :8090 ──JWT-forwarded REST──► Spring Boot (not wired to SPA/Compose)
```

## Các vùng chức năng

| Vùng | Người dùng | Trách nhiệm chính |
| --- | --- | --- |
| Public/customer | Khách chưa/đã đăng nhập | xem catalogue và nhân viên, kiểm tra slot, Google sign-in, tự đặt lịch, QR checkout, xem ticket, đổi lịch, feedback |
| Operations | Owner/manager/receptionist | live board, tra cứu/tạo/sửa lịch, check-in, phân công, khách hàng và notification |
| Management | Owner/manager; accountant một phần | nhân viên/lịch làm, dịch vụ, tài khoản-role, payment/refund/SePay reconciliation, dashboard/report |
| Therapist | Therapist | ca của mình, chuyển `CHECKED_IN → IN_SERVICE → COMPLETED`, xem lịch ngày |
| Intelligence | Public RAG chatbot hoặc agent có JWT | chatbot RAG trả lời từ Markdown; agent v0 chỉ đọc dữ liệu được role cho phép |

## Vòng đời booking và payment

```text
customer/receptionist tạo booking
  → PENDING_PAYMENT + CREATED + STAFF_ASSIGNED
  → tạo payment UNPAID (QR/CARD/AT_SPA)
  → payment PAID (SePay hoặc xác nhận tay)
  → CONFIRMED + PAYMENT_RECEIVED
  → lễ tân check-in: CHECKED_IN
  → therapist start: IN_SERVICE
  → therapist complete: COMPLETED
  → customer có thể để lại tối đa một feedback
```

`PENDING` có trong enum/schema nhưng backend không gán. Không có `CANCELLED` trong enum booking hiện tại. Refund đổi payment sang `REFUNDED`; nó không có một booking status hoàn/hủy tương ứng.

### Quy tắc giữ slot

- Một booking chứa một hay nhiều service, nhưng một `service_id` không lặp trong cùng booking.
- Giá, tên service, thời lượng và giá tăng thêm được snapshot vào `booking_items`; frontend không quyết định amount cuối cùng.
- `booking_end = booking_start + tổng duration`; buffer chuẩn bị/dọn dẹp chỉ dùng khi phát hiện overlap.
- Backend chỉ chọn/gán therapist đang active, bookable, có skill cho **tất cả** service, trong giờ làm, không time-off và không giao với booking khác kể cả buffer.
- Khách không chọn therapist → `assignment_source=SYSTEM`; khách chọn → `CUSTOMER`; bàn vận hành tạo/gán → `ADMIN`.

## Tính nhất quán và state nguồn

MySQL là nguồn state nghiệp vụ. Mỗi thay đổi booking/payment/schedule được ghi trong transaction trước, sau commit mới publish Kafka. SSE không chuyển object dữ liệu hoàn chỉnh: nó chỉ gửi “invalidation envelope”, và SPA gọi lại REST để lấy state mới. Vì vậy mất Kafka/SSE không làm mất dữ liệu; client vẫn polling theo topic.

## Điểm cần lưu ý khi phát triển

- Backend có nhiều `SecurityFilterChain` theo path. Không được suy ra quyền chỉ từ màn hình React.
- `booking_events` là audit timeline nghiệp vụ; SePay có inbox/audit riêng `sepay_transactions` để chống xử lý webhook lặp.
- Compose mặc định chỉ chạy MySQL, Redis, Kafka; dùng profile `app` để khởi động backend/frontend và profile `chroma` nếu bật vector DB.
- Credentials (Google OAuth JSON, token refresh, JWT secret, SePay secret) không nên nằm trong repo hoặc tài liệu quan sát.
