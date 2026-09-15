# Payment

## Tables liên quan

```text
payments
bookings
booking_events
```

## Foreign Key

```text
payments.booking_id -> bookings.id
booking_events.booking_id -> bookings.id
```

Quan hệ `bookings` và `payments` là 1-1 vì `payments.booking_id` là UNIQUE.

---

## 1. Tạo Payment

**Endpoint**

```text
/api/payments
```

**Method**

```text
POST
```

**Request JSON**

```json
{
  "bookingId": 100,
  "method": "QR"
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "id": 50,
    "transactionCode": "PAY-20260920-0050",
    "bookingId": 100,
    "status": "UNPAID",
    "method": "QR",
    "amount": 470000,
    "qrPayload": "000201010212..."
  },
  "timestamp": "2026-09-20T09:05:00"
}
```

**Quy tắc chính:** `amount` lấy từ `bookings.total_amount`, không lấy trực tiếp từ Frontend.

---

## 2. Lấy Payment của Booking

**Endpoint**

```text
/api/payments/booking/{bookingId}
```

**Method**

```text
GET
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get payment successfully",
  "data": {
    "id": 50,
    "transactionCode": "PAY-20260920-0050",
    "bookingId": 100,
    "status": "PAID",
    "method": "QR",
    "amount": 470000,
    "paidAt": "2026-09-20T09:10:00"
  },
  "timestamp": "2026-09-20T09:10:00"
}
```

---

## 3. Xác nhận Payment thành công

**Endpoint**

```text
/api/payments/{paymentId}/paid
```

**Method**

```text
PATCH
```

**Request JSON**

```json
{
  "transactionCode": "PAY-20260920-0050"
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "id": 50,
    "status": "PAID",
    "paidAt": "2026-09-20T09:10:00"
  },
  "timestamp": "2026-09-20T09:10:00"
}
```

**Quy tắc chính:** Sau khi thanh toán thành công có thể cập nhật Booking từ `PENDING_PAYMENT` sang `PENDING` và ghi `booking_events` với `PAYMENT_RECEIVED`.

---

## 4. Refund Payment

**Endpoint**

```text
/api/payments/{paymentId}/refund
```

**Method**

```text
POST
```

**Response JSON**

```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "data": {
    "id": 50,
    "status": "REFUNDED",
    "refundedAt": "2026-09-21T09:00:00"
  },
  "timestamp": "2026-09-21T09:00:00"
}
```
