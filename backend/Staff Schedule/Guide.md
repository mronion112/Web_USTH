# Staff Schedule

## 1. Lấy lịch Staff

**Endpoint**

```text
/api/manager/staff/{staffId}/schedule
```

**Method**

```text
GET
```

**Tables liên quan**

```text
staff_profiles, staff_working_hours, staff_time_off
```

**Mục đích**

Lấy lịch làm việc và thời gian nghỉ của Staff.

**Response JSON**

```json
{
  "success": true,
  "message": "Get staff schedule successfully",
  "data": {
    "staffId": 5,
    "workingHours": [
      {
        "dayOfWeek": 1,
        "startTime": "09:00:00",
        "endTime": "17:00:00",
        "isWorking": true
      }
    ],
    "timeOff": [
      {
        "id": 20,
        "startAt": "2026-09-25T09:00:00",
        "endAt": "2026-09-25T17:00:00",
        "reason": "Nghỉ phép"
      }
    ]
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 2. Cập nhật lịch Staff

**Endpoint**

```text
/api/manager/staff/{staffId}/schedule
```

**Method**

```text
PUT
```

**Tables liên quan**

```text
staff_working_hours, staff_time_off
```

**Request JSON**

```json
{
  "workingHours": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "isWorking": true
    }
  ]
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Staff schedule updated successfully",
  "data": {
    "staffId": 5
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** Khi phân Booking phải kiểm tra giờ làm, time-off và Booking bị trùng.
