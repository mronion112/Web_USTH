# Rosa Spa Backend API Guide

Mỗi feature được tách thành một folder riêng, trong đó có file `Guide.md` mô tả:
- Endpoint
- Method
- Tables liên quan
- Mục đích
- Request JSON
- Response JSON
- Quy tắc chính

## Quy chuẩn Response chung

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2026-09-20T10:00:00"
}
```

Response lỗi:

```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "timestamp": "2026-09-20T10:00:00"
}
```

## Authorization

Các API protected sử dụng:

```http
Authorization: Bearer <token>
```

## Cấu trúc

```text
Backend_API/
├── Authentication_Account/
│   └── Guide.md
├── Profiles/
│   └── Guide.md
├── Spa_Service/
│   └── Guide.md
├── Staff_Schedule/
│   └── Guide.md
├── Booking/
│   └── Guide.md
├── Staff_Task/
│   └── Guide.md
├── Feedback/
│   └── Guide.md
├── Attendance/
│   └── Guide.md
└── DashBoard Manager/
    └── Guide.md
```
