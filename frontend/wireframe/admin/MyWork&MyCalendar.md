# FRAME MỚI — `/staff/my-work` — Công việc của tôi

Đây là màn hình chính khi kỹ thuật viên đăng nhập.



```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Lunara                                         Công việc của tôi              Linh ▼     │
├───────────────────┬──────────────────────────────────────────────────────────────────────┤
│                   │                                                                      │
│ CÔNG VIỆC         │  Công việc hôm nay                                  14 Sep 2026     │
│                   │                                                                      │
│ Công việc của tôi │  [ Tất cả ] [ Sắp tới ] [ Đang thực hiện ] [ Hoàn thành ]          │
│ Lịch của tôi      │                                                                      │
│ Dịch vụ           │  ┌───────────────────────────────────────────────────────────────┐   │
│                   │  │ 09:00 - 10:00                                                 │   │
│                   │  │ Massage thư giãn · 60 phút                                    │   │
│                   │  │                                                               │   │
│                   │  │ Khách hàng: Nguyễn Văn A                                      │   │
│                   │  │ Trạng thái: CHECKED IN                                        │   │
│                   │  │                                                               │   │
│                   │  │                                      [ Bắt đầu dịch vụ ]      │   │
│                   │  └───────────────────────────────────────────────────────────────┘   │
│                   │                                                                      │
│                   │  ┌───────────────────────────────────────────────────────────────┐   │
│                   │  │ 11:00 - 12:00                                                 │   │
│                   │  │ Trị liệu · 60 phút                                            │   │
│                   │  │                                                               │   │
│                   │  │ Khách hàng: Trần Thị B                                        │   │
│                   │  │ Trạng thái: UPCOMING                                          │   │
│                   │  └───────────────────────────────────────────────────────────────┘   │
│                   │                                                                      │
│                   │  ┌───────────────────────────────────────────────────────────────┐   │
│                   │  │ 14:30 - 15:30                                                 │   │
│                   │  │ Massage thư giãn · 60 phút                                    │   │
│                   │  │                                                               │   │
│                   │  │ Khách hàng: Lê Văn C                                          │   │
│                   │  │ Trạng thái: IN SERVICE                                        │   │
│                   │  │                                                               │   │
│                   │  │                                      [ Hoàn thành ]           │   │
│                   │  └───────────────────────────────────────────────────────────────┘   │
└───────────────────┴──────────────────────────────────────────────────────────────────────┘
```

Kỹ thuật viên chỉ cần thao tác lifecycle:



```
UPCOMING
    ↓
CHECKED_IN
    ↓
[Bắt đầu dịch vụ]
    ↓
IN_SERVICE
    ↓
[Hoàn thành]
    ↓
COMPLETED
```

`CHECKED_IN` do lễ tân xử lý. Kỹ thuật viên chỉ `Bắt đầu dịch vụ` và `Hoàn thành`.

---

# FRAME BIẾN THỂ — `/staff/calendar` — Lịch của tôi

Không cần xây calendar mới. Dùng chính frame `/admin/calendar`, nhưng khóa staff về chính user đang đăng nhập.



```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Lịch của tôi                          < 14 September >            [Day] [Week]            │
│                                                                                          │
│                  09:00    10:00    11:00    12:00    13:00    14:00    15:00    16:00   │
│ ──────────────────────────────────────────────────────────────────────────────────────── │
│                  ┌───────────────┐                                                       │
│                  │ Massage       │                                                       │
│                  │ Nguyen Van A  │                                                       │
│                  └───────────────┘                                                       │
│                                                                                          │
│                                     ┌───────────────┐                                    │
│                                     │ Trị liệu      │                                    │
│                                     │ Tran Thi B    │                                    │
│                                     └───────────────┘                                    │
│                                                                                          │
│                                                               ┌───────────────────┐      │
│                                                               │ Massage           │      │
│                                                               │ Le Van C          │      │
│                                                               └───────────────────┘      │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

Không có:



```
Staff: [All Staff ▼]
[+ Booking]
Drag & drop reschedule
```

vì kỹ thuật viên không cần các quyền đó.

---

# Lễ tân — không cần frame mới

Khi lễ tân login, `/admin/live` chính là workspace của họ.

Sidebar chỉ hiện:



```
OPERATIONS

Live
Booking
Calendar
Customers

MANAGEMENT

Payments
```

Dashboard tổng hợp doanh thu, Staff Management, Services Management, User &amp; Role, Reports không cần hiện.

Flow của lễ tân:



```
Live
 │
 ├── khách tới
 │      ↓
 │   Check In
 │
 ├── booking mới
 │      ↓
 │   Booking Detail
 │
 ├── khách muốn đổi lịch
 │      ↓
 │   Calendar
 │
 └── thanh toán tại spa
        ↓
     Payments
```

---

# Kế toán — không cần frame mới

Khi đăng nhập thì vào thẳng:



```
/admin/payments
```

Sidebar:



```
MANAGEMENT

Payments

ANALYTICS

Reports
```

Hai frame hiện tại đã đủ.

---

# Quản lý — giữ nguyên admin hiện tại



```
OVERVIEW
Dashboard
Live

OPERATIONS
Booking
Calendar
Customers

MANAGEMENT
Staff
Services
Payments
User & Role

ANALYTICS
Reports
```

Chỉ hạn chế những permission liên quan đến Chủ Spa nếu cần.

---

# Chủ Spa — giữ nguyên admin hiện tại

UI gần như giống Quản lý nhưng có toàn quyền:



```
Dashboard
Live
Booking
Calendar
Customers
Staff
Services
Payments
User & Role
Reports
```

---

# Sidebar cuối cùng theo role



```
CHỦ SPA / QUẢN LÝ
│
├── Dashboard
├── Live
├── Booking
├── Calendar
├── Customers
├── Staff
├── Services
├── Payments
├── User & Role
└── Reports


LỄ TÂN
│
├── Live
├── Booking
├── Calendar
├── Customers
└── Payments


KỸ THUẬT VIÊN
│
├── Công việc của tôi        ← FRAME MỚI
├── Lịch của tôi             ← reuse Calendar
└── Dịch vụ


KẾ TOÁN
│
├── Payments
└── Reports
```

