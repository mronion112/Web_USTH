# Booking

## 1. Tạo Booking

**Endpoint**

```text
/api/bookings
```

**Method**

```text
POST
```

**Tables liên quan**

```text
bookings, booking_statuses, spa_packages, customer_profiles, staff_profiles
```

**Mục đích**

Khách hàng tạo lịch Booking.

**Request JSON**

```json
{
  "packageId": 2,
  "staffId": null,
  "bookingStart": "2026-09-20T10:00:00",
  "customerNote": "Da hơi nhạy cảm"
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 100,
    "package": {
      "id": 2,
      "name": "Chăm sóc da mặt"
    },
    "staff": {
      "id": 5,
      "fullName": "Tran Thi Lan"
    },
    "status": "CONFIRMED",
    "bookingStart": "2026-09-20T10:00:00",
    "bookingEnd": "2026-09-20T10:45:00",
    "assignmentType": "AUTO"
  },
  "timestamp": "2026-09-20T09:00:00"
}
```

**Quy tắc chính:**
- `customerId` lấy từ JWT.
- Backend tự tính `bookingEnd`.
- Nếu `staffId = null` thì chạy Greedy để chọn Staff.

---

## 2. Lấy Booking của User

**Endpoint**

```text
/api/bookings/my
```

**Method**

```text
GET
```

**Tables liên quan**

```text
bookings, spa_packages, staff_profiles, booking_statuses
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get my bookings successfully",
  "data": [
    {
      "id": 100,
      "packageName": "Chăm sóc da mặt",
      "staffName": "Tran Thi Lan",
      "status": "CONFIRMED",
      "bookingStart": "2026-09-20T10:00:00",
      "bookingEnd": "2026-09-20T10:45:00"
    }
  ],
  "timestamp": "2026-09-20T09:00:00"
}
```

---

## 3. Lấy chi tiết Booking

**Endpoint**

```text
/api/bookings/{id}
```

**Method**

```text
GET
```

**Tables liên quan**

```text
bookings, spa_packages, staff_profiles, booking_statuses
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get booking successfully",
  "data": {
    "id": 100,
    "packageName": "Chăm sóc da mặt",
    "staffName": "Tran Thi Lan",
    "status": "CONFIRMED",
    "bookingStart": "2026-09-20T10:00:00",
    "bookingEnd": "2026-09-20T10:45:00",
    "customerNote": "Da hơi nhạy cảm"
  },
  "timestamp": "2026-09-20T09:00:00"
}
```

---

## 4. Hủy Booking

**Endpoint**

```text
/api/bookings/{id}/cancel
```

**Method**

```text
PATCH
```

**Tables liên quan**

```text
bookings, booking_statuses, booking_status_history
```

**Response JSON**

```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "bookingId": 100,
    "status": "CANCELLED"
  },
  "timestamp": "2026-09-20T09:10:00"
}
```
