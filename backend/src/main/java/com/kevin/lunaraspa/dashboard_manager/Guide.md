# Dashboard Manager

## Tables liên quan

```text
accounts
customer_profiles
staff_profiles
bookings
payments
feedback
services
```

## Foreign Key chính

```text
customer_profiles.account_id -> accounts.id
staff_profiles.account_id -> accounts.id
bookings.customer_account_id -> customer_profiles.account_id
bookings.staff_account_id -> staff_profiles.account_id
payments.booking_id -> bookings.id
feedback.booking_id -> bookings.id
```

---

## 1. Lấy dữ liệu Dashboard

**Endpoint**

```text
/api/manager/dashboard
```

**Method**

```text
GET
```

**Mục đích**

Lấy số liệu tổng quan cho Manager Dashboard.

**Response JSON**

```json
{
  "success": true,
  "message": "Get dashboard successfully",
  "data": {
    "totalCustomers": 350,
    "totalStaff": 12,
    "totalServices": 18,
    "totalBookings": 1250,
    "todayBookings": 28,
    "completedBookings": 980,
    "pendingPayments": 12,
    "todayRevenue": 12500000,
    "averageRating": 4.6
  },
  "timestamp": "2026-09-20T18:00:00"
}
```

**Quy tắc chính:** Đây là API tổng hợp dữ liệu, không cần bảng Dashboard riêng.
