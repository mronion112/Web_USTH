# Lunara Spa Mock Database

Bộ mock data này bám theo schema `lunara_spa` gồm đúng 15 table:

1. roles
2. permissions
3. role_permissions
4. accounts
5. customer_profiles
6. staff_profiles
7. services
8. staff_services
9. staff_working_hours
10. staff_time_off
11. bookings
12. booking_items
13. booking_events
14. payments
15. feedback

## Folder

- `Production/`: dữ liệu lớn hơn để demo, benchmark API và kiểm thử luồng gần production.
- `Testing/`: dữ liệu nhỏ hơn, đủ case chính để dev/test nhanh.

## Snapshot logic

Mock data được thiết kế như trạng thái hệ thống tại:

`2026-09-15 15:00:00`

Vì vậy:
- `COMPLETED` nằm trong quá khứ.
- `PENDING_PAYMENT`, `PENDING`, `CONFIRMED` chủ yếu là lịch tương lai.
- `CHECKED_IN` và `IN_SERVICE` dùng các booking trong ngày snapshot.
- Feedback chỉ xuất hiện với booking `COMPLETED`.
- Payment `PAID` có `paid_at`.
- Payment `REFUNDED` có cả `paid_at` và `refunded_at`.
- Payment `UNPAID` / `FAILED` không có `paid_at`.
- QR payment có `qr_payload`, CARD / AT_SPA để NULL.
- `payments.amount = bookings.total_amount`.
- `bookings.total_amount = SUM(booking_items.line_amount)`.
- `bookings.total_duration_minutes = SUM(booking_items.duration_minutes)`.
- Staff được gán booking phải có skill trong `staff_services`.
- Mock generator tránh booking bị overlap trên cùng một Staff.
- Booking được đặt trong Working Hours và tránh các ngày `staff_time_off`.

## NULL trong CSV

Giá trị SQL NULL được ghi là:

```text
\N
```

Khi import bằng DBeaver/MySQL hãy cấu hình NULL marker là `\N`.

## Import order

Import theo thứ tự trong `IMPORT_ORDER.txt` để không lỗi Foreign Key.

## Encoding

CSV dùng UTF-8 để giữ đúng tiếng Việt.
