# Feedback

## Tables liên quan

```text
feedback
bookings
```

## Foreign Key

```text
feedback.booking_id -> bookings.id
```

---

## 1. Tạo Feedback

**Endpoint**

```text
/api/feedback
```

**Method**

```text
POST
```

**Request JSON**

```json
{
  "bookingId": 100,
  "rating": 5,
  "comment": "Dịch vụ rất tốt"
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Create feedback successfully",
  "data": {
    "id": 25,
    "bookingId": 100,
    "rating": 5,
    "comment": "Dịch vụ rất tốt"
  },
  "timestamp": "2026-09-20T12:00:00"
}
```

**Quy tắc chính:**
- Rating từ `1` đến `5`.
- Một Booking có tối đa một Feedback.
- Chỉ nên Feedback sau khi Booking `COMPLETED`.

---

## 2. Lấy Feedback theo Booking

**Endpoint**

```text
/api/feedback/booking/{bookingId}
```

**Method**

```text
GET
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get feedback successfully",
  "data": {
    "id": 25,
    "bookingId": 100,
    "rating": 5,
    "comment": "Dịch vụ rất tốt"
  },
  "timestamp": "2026-09-20T12:00:00"
}
```
