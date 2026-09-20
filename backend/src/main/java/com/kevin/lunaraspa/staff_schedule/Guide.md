# Staff Schedule

## Tables liên quan

```text
staff_profiles
staff_working_hours
staff_time_off
accounts
```

## Foreign Key

```text
staff_profiles.account_id -> accounts.id
staff_working_hours.staff_account_id -> staff_profiles.account_id
staff_time_off.staff_account_id -> staff_profiles.account_id
```

---

## 1. Lấy lịch Staff

**Endpoint**

```text
/api/manager/staff/{staffId}/schedule
```

**Method**

```text
GET
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get staff schedule successfully",
  "data": {
    "staffId": 21,
    "workingHours": [
      {
        "id": 1,
        "dayOfWeek": 1,
        "startTime": "08:00:00",
        "endTime": "17:00:00",
        "isActive": true
      }
    ],
    "timeOff": [
      {
        "id": 5,
        "startAt": "2026-09-25T08:00:00",
        "endAt": "2026-09-25T17:00:00",
        "reason": "Nghỉ phép"
      }
    ],
    "bookingBlocks": [
      {
        "bookingId": 100,
        "bookingCode": "LNR-20260920-0100",
        "status": "CONFIRMED",
        "startAt": "2026-09-20T10:00:00",
        "endAt": "2026-09-20T11:30:00"
      }
    ]
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

Có thể truyền query `from` và `to` theo ISO date-time; khoảng tối đa 93 ngày.

---

## 2. Cập nhật Working Hours

**Endpoint**

```text
/api/manager/staff/{staffId}/working-hours
```

**Method**

```text
PUT
```

**Request JSON**

```json
{
  "workingHours": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00:00",
      "endTime": "17:00:00",
      "isActive": true
    }
  ]
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Update working hours successfully",
  "data": {
    "staffId": 21,
    "updated": true
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 3. Tạo Time-off

**Endpoint**

```text
/api/manager/staff/{staffId}/time-off
```

**Method**

```text
POST
```

**Request JSON**

```json
{
  "startAt": "2026-09-25T08:00:00",
  "endAt": "2026-09-25T17:00:00",
  "reason": "Nghỉ phép"
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Create time-off successfully",
  "data": {
    "id": 5,
    "staffId": 21,
    "startAt": "2026-09-25T08:00:00",
    "endAt": "2026-09-25T17:00:00"
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** `start_time < end_time`, `start_at < end_at`.
