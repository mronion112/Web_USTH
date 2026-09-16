# Lunara Spa Backend API Guide

Tài liệu Backend API cho project **Lunara Spa** sử dụng database `lunara_spa`.

Mỗi feature nằm trong một folder riêng dưới `backend/` và có file `Guide.md` mô tả:
- Endpoint
- Method
- Tables liên quan
- Foreign Key
- Mục đích
- Request JSON
- Response JSON
- Quy tắc chính

## Quy chuẩn Response chung

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2026-09-20T10:00:00"
}
```

Response lỗi:

```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "timestamp": "2026-09-20T10:00:00"
}
```

## Authorization

Các API protected sử dụng:

```http
Authorization: Bearer <token>
```

Backend có thể dùng Google OAuth2 để xác thực, sau đó trả JWT cho Frontend.

## Swagger / OpenAPI

Backend đã tích hợp Swagger UI để tự động tổng hợp các API REST được khai báo trong các controller Java.
Sau khi chạy backend, truy cập:

- Swagger UI: `http://localhost:<BACKEND_PORT>/swagger-ui.html`
- OpenAPI JSON: `http://localhost:<BACKEND_PORT>/v3/api-docs`
- OpenAPI YAML: `http://localhost:<BACKEND_PORT>/v3/api-docs.yaml`

Trong Swagger UI, bấm **Authorize** và nhập JWT access token để gọi các API cần đăng nhập. Các URL tài liệu được mở trong `SecurityConfig`; dữ liệu API vẫn giữ cơ chế phân quyền hiện tại.

## Cấu trúc

```text
Lunara_Spa_API_Docs/
├── README.md
└── backend/
    ├── Authentication_Account/
    │   └── Guide.md
    ├── Profiles/
    │   └── Guide.md
    ├── Spa_Service/
    │   └── Guide.md
    ├── Staff_Schedule/
    │   └── Guide.md
    ├── Booking/
    │   └── Guide.md
    ├── Staff_Task/
    │   └── Guide.md
    ├── Feedback/
    │   └── Guide.md
    ├── Attendance/
    │   └── Guide.md
    ├── Payment/
    │   └── Guide.md
    └── Dashboard_Manager/
        └── Guide.md
```

## Database source of truth

Tài liệu này bám theo schema `lunara_spa` hiện tại gồm:

```text
roles
permissions
role_permissions
accounts
customer_profiles
staff_profiles
services
staff_services
staff_working_hours
staff_time_off
bookings
booking_items
booking_events
payments
feedback
```

## Lưu ý quan trọng

- `Staff_Task` vẫn giữ dưới dạng feature Backend, nhưng schema hiện tại **không có bảng `staff_tasks`**. Task của Staff được xem như các `bookings` đã được gán `staff_account_id`, kết hợp với `booking_events`.
- `Attendance` vẫn giữ folder để không thay đổi cấu trúc feature cũ, nhưng schema `lunara_spa` hiện tại **không có bảng attendance**, vì vậy chưa thể lưu check-in/check-out của Staff mà không thay đổi database.
- Booking hiện tại không có trạng thái `CANCELLED`.
- Payment sử dụng bảng `payments` và liên kết 1-1 với `bookings`.
