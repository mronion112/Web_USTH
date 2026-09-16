# Attendance

## Trạng thái với schema hiện tại

Feature Attendance được giữ lại trong cấu trúc Backend theo yêu cầu project cũ.

Tuy nhiên schema `lunara_spa` hiện tại **không có bảng `attendance`** và cũng không có field tương đương để lưu:

```text
work_date
check_in
check_out
```

Vì vậy không thể triển khai đúng các API:

```text
POST /api/attendance/check-in
POST /api/attendance/check-out
GET  /api/attendance/my
```

mà vẫn bám 100% database hiện tại.

## Tables liên quan hiện tại

```text
Không có
```

## Foreign Key

```text
Không có
```

## Response nếu Endpoint chưa được hỗ trợ

```json
{
  "success": false,
  "message": "Attendance is not supported by current lunara_spa schema",
  "data": null,
  "timestamp": "2026-09-20T08:00:00"
}
```

## Ghi chú

Không dùng `staff_working_hours` thay cho Attendance:

- `staff_working_hours` = lịch làm việc dự kiến.
- Attendance = thời gian Staff thực tế check-in/check-out.

Muốn triển khai Attendance đúng nghĩa cần thay đổi database, vì vậy Guide này không tự thêm table mới.
