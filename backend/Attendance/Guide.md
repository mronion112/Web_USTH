# Attendance

## 1. Check-in

**Endpoint**

```text
/api/attendance/check-in
```

**Method**

```text
POST
```

**Tables liên quan**

```text
attendance, staff_profiles
```

**Mục đích**

Staff chấm công bắt đầu ngày làm việc.

**Request JSON**

Không cần Body. Staff lấy từ JWT.

**Response JSON**

```json
{
  "success": true,
  "message": "Check-in successfully",
  "data": {
    "id": 20,
    "staffId": 5,
    "workDate": "2026-09-20",
    "checkIn": "2026-09-20T08:02:13",
    "checkOut": null
  },
  "timestamp": "2026-09-20T08:02:13"
}
```

---

## 2. Check-out

**Endpoint**

```text
/api/attendance/check-out
```

**Method**

```text
POST
```

**Tables liên quan**

```text
attendance
```

**Response JSON**

```json
{
  "success": true,
  "message": "Check-out successfully",
  "data": {
    "id": 20,
    "staffId": 5,
    "workDate": "2026-09-20",
    "checkIn": "2026-09-20T08:02:13",
    "checkOut": "2026-09-20T17:05:20"
  },
  "timestamp": "2026-09-20T17:05:20"
}
```

---

## 3. Lấy lịch sử chấm công của Staff

**Endpoint**

```text
/api/attendance/my
```

**Method**

```text
GET
```

**Tables liên quan**

```text
attendance
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get attendance successfully",
  "data": [
    {
      "workDate": "2026-09-20",
      "checkIn": "2026-09-20T08:02:13",
      "checkOut": "2026-09-20T17:05:20"
    }
  ],
  "timestamp": "2026-09-20T18:00:00"
}
```
