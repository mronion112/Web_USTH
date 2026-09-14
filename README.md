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
