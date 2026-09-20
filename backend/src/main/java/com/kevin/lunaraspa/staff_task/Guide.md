# Staff Task

## Lưu ý

Schema `lunara_spa` hiện tại **không có bảng `staff_tasks` hoặc `task_statuses`**.

Feature Staff Task được triển khai như một API view trên Booking đã được gán cho Staff.

## Tables liên quan

```text
bookings
booking_items
booking_events
services
staff_profiles
```

## Foreign Key

```text
bookings.staff_account_id -> staff_profiles.account_id
booking_items.booking_id -> bookings.id
booking_items.service_id -> services.id
booking_events.booking_id -> bookings.id
```

---

## 1. Lấy Task của Staff

**Endpoint**

```text
/api/staff/tasks
```

**Method**

```text
GET
```

**Mục đích**

Lấy các Booking được gán cho Staff hiện tại.

Có thể truyền query `date=YYYY-MM-DD` để lấy agenda của một ngày.

**Response JSON**

```json
{
  "success": true,
  "message": "Get staff tasks successfully",
  "data": [
    {
      "bookingId": 100,
      "bookingCode": "LNR-20260920-0100",
      "status": "CONFIRMED",
      "bookingStart": "2026-09-20T10:00:00",
      "bookingEnd": "2026-09-20T11:30:00",
      "customerName": "Nguyen Van A",
      "services": [
        {
          "name": "Facial Care",
          "durationMinutes": 90
        }
      ]
    }
  ],
  "timestamp": "2026-09-20T09:00:00"
}
```

---

## 2. Bắt đầu Service

**Endpoint**

```text
/api/staff/tasks/{bookingId}/start
```

**Method**

```text
PATCH
```

**Mục đích**

Chuyển Booking sang `IN_SERVICE`.

**Request JSON**

Không cần Body.

**Response JSON**

```json
{
  "success": true,
  "message": "Service started successfully",
  "data": {
    "bookingId": 100,
    "status": "IN_SERVICE",
    "serviceStartedAt": "2026-09-20T10:03:00"
  },
  "timestamp": "2026-09-20T10:03:00"
}
```

**Quy tắc chính:** Ghi thêm `booking_events` với `event_type = SERVICE_STARTED`.

---

## 3. Hoàn thành Service

**Endpoint**

```text
/api/staff/tasks/{bookingId}/complete
```

**Method**

```text
PATCH
```

**Response JSON**

```json
{
  "success": true,
  "message": "Service completed successfully",
  "data": {
    "bookingId": 100,
    "status": "COMPLETED",
    "completedAt": "2026-09-20T11:25:00"
  },
  "timestamp": "2026-09-20T11:25:00"
}
```

**Quy tắc chính:** Ghi `booking_events` với `event_type = COMPLETED`.
