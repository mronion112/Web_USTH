# Feedback

## 1. Tạo Feedback

**Endpoint**

```text
/api/feedback
```

**Method**

```text
POST
```

**Tables liên quan**

```text
feedback, feedback_ratings, bookings
```

**Mục đích**

User đánh giá dịch vụ sau khi Booking hoàn thành.

**Request JSON**

```json
{
  "bookingId": 100,
  "ratingId": 5,
  "comment": "Nhân viên nhiệt tình."
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": 15,
    "bookingId": 100,
    "rating": {
      "id": 5,
      "name": "XUẤT SẮC"
    },
    "comment": "Nhân viên nhiệt tình."
  },
  "timestamp": "2026-09-20T11:00:00"
}
```

**Quy tắc chính:**
- Chỉ Booking `COMPLETED` mới được Feedback.
- Một Booking chỉ Feedback một lần.

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

**Tables liên quan**

```text
feedback, feedback_ratings
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get feedback successfully",
  "data": {
    "id": 15,
    "bookingId": 100,
    "rating": 5,
    "ratingName": "XUẤT SẮC",
    "comment": "Nhân viên nhiệt tình."
  },
  "timestamp": "2026-09-20T11:00:00"
}
```
