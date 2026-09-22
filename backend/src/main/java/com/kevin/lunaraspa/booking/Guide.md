# Booking

## Tables liên quan

```text
bookings
booking_items
booking_events
services
accounts
customer_profiles
staff_profiles
staff_services
staff_working_hours
staff_time_off
```

## Foreign Key

```text
bookings.customer_account_id -> customer_profiles.account_id
bookings.staff_account_id -> staff_profiles.account_id
bookings.created_by_account_id -> accounts.id
booking_items.booking_id -> bookings.id
booking_items.service_id -> services.id
booking_events.booking_id -> bookings.id
booking_events.actor_account_id -> accounts.id
staff_services.staff_account_id -> staff_profiles.account_id
staff_services.service_id -> services.id
```

---

## 1. Tạo Booking

**Endpoint**

```text
/api/bookings
```

**Method**

```text
POST
```

**Mục đích**

Customer đặt một hoặc nhiều Service.

**Request JSON**

```json
{
  "staffAccountId": null,
  "bookingStart": "2026-09-20T10:00:00",
  "customerNote": "Da hơi nhạy cảm",
  "items": [
    {
      "serviceId": 1,
      "durationMinutes": 90
    }
  ]
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 100,
    "bookingCode": "LNR-20260920-0100",
    "status": "PENDING_PAYMENT",
    "assignmentSource": "SYSTEM",
    "staffAccountId": 21,
    "bookingStart": "2026-09-20T10:00:00",
    "bookingEnd": "2026-09-20T11:30:00",
    "totalDurationMinutes": 90,
    "totalAmount": 470000,
    "items": [
      {
        "serviceId": 1,
        "serviceName": "Facial Care",
        "durationMinutes": 90,
        "lineAmount": 470000
      }
    ]
  },
  "timestamp": "2026-09-20T09:00:00"
}
```

**Quy tắc chính:**
- Customer lấy từ JWT.
- `booking_items` lưu snapshot tên và giá Service tại thời điểm đặt.
- Nếu không chọn Staff, Backend chọn Staff phù hợp từ `staff_services`, lịch làm việc, time-off và Booking hiện tại.
- Schema hiện tại không có trạng thái `CANCELLED`.

---

## 2. Lấy Booking của Customer

**Endpoint**

```text
/api/bookings/my
```

**Method**

```text
GET
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get bookings successfully",
  "data": [
    {
      "id": 100,
      "bookingCode": "LNR-20260920-0100",
      "status": "CONFIRMED",
      "bookingStart": "2026-09-20T10:00:00",
      "bookingEnd": "2026-09-20T11:30:00",
      "totalAmount": 470000
    }
  ],
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 3. Lấy chi tiết Booking

**Endpoint**

```text
/api/bookings/{bookingCode}
```

**Method**

```text
GET
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get booking successfully",
  "data": {
    "id": 100,
    "bookingCode": "LNR-20260920-0100",
    "status": "CONFIRMED",
    "customerName": "Nguyen Van A",
    "customerEmail": "user@gmail.com",
    "staff": {
      "accountId": 21,
      "displayName": "Tran Thi Lan"
    },
    "items": [
      {
        "serviceId": 1,
        "serviceName": "Facial Care",
        "durationMinutes": 90,
        "lineAmount": 470000
      }
    ],
    "totalAmount": 470000
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 4. Manager phân Staff

**Endpoint**

```text
/api/manager/bookings/{bookingId}/assign
```

**Method**

```text
PATCH
```

**Request JSON**

```json
{
  "staffAccountId": 21
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Assign staff successfully",
  "data": {
    "bookingId": 100,
    "staffAccountId": 21,
    "assignmentSource": "ADMIN"
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** Staff phải làm được Service và không bị trùng lịch.

---

## 5. Kiểm tra lịch trống

`POST /api/availability`

```json
{
  "items": [{ "serviceId": 1, "durationMinutes": 60 }],
  "from": "2026-09-21T08:00:00",
  "to": "2026-09-21T18:00:00",
  "staffAccountId": null,
  "slotIntervalMinutes": 30
}
```

API chỉ trả Staff hỗ trợ toàn bộ dịch vụ và các slot phù hợp working hours, time-off,
booking hiện có, preparation buffer và cleanup buffer. Khoảng tìm kiếm tối đa 31 ngày.

## 6. Tìm Booking cho vận hành

`GET /api/manager/bookings?from=&to=&status=&staffId=&unassigned=&code=&page=0&size=20`

Chỉ Owner, Manager hoặc Receptionist. `size` tối đa 100; khoảng ngày tối đa 93 ngày.

## 7. Check-in Booking

`PATCH /api/manager/bookings/{bookingId}/check-in`

Chỉ cho phép `CONFIRMED -> CHECKED_IN`, ghi `checked_in_at` và event `CHECKED_IN`.
Gửi lại sau khi đã check-in trả cùng kết quả và không tạo event trùng.

## 8. Đổi lịch của Customer

`PATCH /api/bookings/{bookingCode}/reschedule`

```json
{
  "bookingStart": "2026-09-22T14:00:00",
  "staffAccountId": 21
}
```

Chỉ chủ Booking được đổi lịch trước khi check-in. Backend kiểm tra lại skill và lịch trống,
sau đó ghi event `RESCHEDULED`.
