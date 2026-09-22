# Payment

## Tables liên quan

```text
payments
sepay_transactions
bookings
booking_events
```

## Foreign Key

```text
payments.booking_id -> bookings.id
booking_events.booking_id -> bookings.id
sepay_transactions.matched_payment_id -> payments.id
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

**Quy tắc chính:** Xác nhận thủ công và webhook SePay cùng đi qua một luồng xác nhận. Sau khi thanh toán thành công, Booking chuyển từ `PENDING_PAYMENT` sang `CONFIRMED` và ghi `booking_events` với `PAYMENT_RECEIVED`.

---

## 4. Webhook SePay

**Endpoint public (xác thực bằng chữ ký HMAC, không dùng JWT)**

```text
POST /api/payments/sepay/webhook
```

Server kiểm tra `X-SePay-Timestamp`, `X-SePay-Signature`, tài khoản nhận, chiều tiền vào, mã giao dịch và đúng số tiền. Mỗi `sepay_id` chỉ được xử lý một lần. Giao dịch không thể khớp tự động được lưu ở trạng thái `MANUAL_REVIEW` để OWNER, MANAGER hoặc ACCOUNTANT xử lý.

Response nhận webhook thành công luôn là:

```json
{"success": true}
```

Các endpoint đối soát:

```text
GET  /api/payments/sepay/transactions?status=MANUAL_REVIEW
POST /api/payments/sepay/transactions/{sepayId}/reconcile
```

---

## 5. Refund Payment

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
