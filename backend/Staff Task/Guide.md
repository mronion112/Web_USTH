# Staff Task

## 1. Lấy danh sách Task của Staff

**Endpoint**

```text
/api/staff/tasks
```

**Method**

```text
GET
```

**Tables liên quan**

```text
staff_tasks, task_statuses, bookings, spa_packages
```

**Mục đích**

Staff xem danh sách công việc được giao.

**Response JSON**

```json
{
  "success": true,
  "message": "Get staff tasks successfully",
  "data": [
    {
      "taskId": 50,
      "bookingId": 100,
      "customerName": "Nguyen Van A",
      "packageName": "Chăm sóc da mặt",
      "status": "ASSIGNED",
      "bookingStart": "2026-09-20T10:00:00",
      "bookingEnd": "2026-09-20T10:45:00"
    }
  ],
  "timestamp": "2026-09-20T09:00:00"
}
```

---

## 2. Nhận Task

**Endpoint**

```text
/api/staff/tasks/{taskId}/accept
```

**Method**

```text
PATCH
```

**Tables liên quan**

```text
staff_tasks, task_statuses
```

**Response JSON**

```json
{
  "success": true,
  "message": "Task accepted successfully",
  "data": {
    "taskId": 50,
    "status": "ACCEPTED",
    "acceptedAt": "2026-09-20T09:55:00"
  },
  "timestamp": "2026-09-20T09:55:00"
}
```

---

## 3. Bắt đầu Task

**Endpoint**

```text
/api/staff/tasks/{taskId}/start
```

**Method**

```text
PATCH
```

**Tables liên quan**

```text
staff_tasks, task_statuses, bookings, booking_statuses
```

**Response JSON**

```json
{
  "success": true,
  "message": "Task started successfully",
  "data": {
    "taskId": 50,
    "status": "IN_PROGRESS",
    "startedAt": "2026-09-20T10:00:00"
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 4. Hoàn thành Task

**Endpoint**

```text
/api/staff/tasks/{taskId}/complete
```

**Method**

```text
PATCH
```

**Tables liên quan**

```text
staff_tasks, task_statuses, bookings, booking_statuses
```

**Response JSON**

```json
{
  "success": true,
  "message": "Task completed successfully",
  "data": {
    "taskId": 50,
    "status": "COMPLETED",
    "completedAt": "2026-09-20T10:45:00"
  },
  "timestamp": "2026-09-20T10:45:00"
}
```
