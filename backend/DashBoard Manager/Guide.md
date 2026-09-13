# Manager

## 1. Lấy Dashboard

**Endpoint**

```text
/api/manager/dashboard
```

**Method**

```text
GET
```

**Tables liên quan**

```text
users, staff_profiles, bookings, booking_statuses, feedback, attendance
```

**Mục đích**

Trả dữ liệu tổng hợp cho Dashboard Manager.

**Response JSON**

```json
{
  "success": true,
  "message": "Get dashboard successfully",
  "data": {
    "totalCustomers": 350,
    "totalStaff": 12,
    "totalBookings": 125,
    "completedBookings": 85,
    "averageRating": 4.6
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 2. Lấy danh sách Staff

**Endpoint**

```text
/api/manager/staff
```

**Method**

```text
GET
```

**Tables liên quan**

```text
users, staff_profiles
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get staff successfully",
  "data": [
    {
      "id": 5,
      "employeeCode": "STAFF001",
      "fullName": "Tran Thi Lan",
      "email": "lan@rosaspa.vn",
      "isAvailable": true
    }
  ],
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 3. Phân Staff cho Booking

**Endpoint**

```text
/api/manager/bookings/{bookingId}/assign
```

**Method**

```text
PATCH
```

**Tables liên quan**

```text
bookings, staff_profiles, staff_tasks, booking_status_history
```

**Mục đích**

Manager tự chọn Staff cho Booking.

**Request JSON**

```json
{
  "staffId": 8
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Staff assigned successfully",
  "data": {
    "bookingId": 100,
    "staffId": 8,
    "staffName": "Nguyen Thi Hoa",
    "assignmentType": "MANUAL"
  },
  "timestamp": "2026-09-20T10:10:00"
}
```

**Quy tắc chính:** Kiểm tra Staff có skill phù hợp và không bị trùng lịch.
