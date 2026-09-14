# Rosa Spa Mock Database

Bộ dữ liệu mock được tạo theo schema MariaDB/MySQL của Rosa Spa.

## Folder

```text
Rosa_Spa_Mock_Database/
├── production/
│   ├── roles.csv
│   ├── users.csv
│   ├── ...
│   └── site_content.csv
├── testing/
│   ├── roles.csv
│   ├── users.csv
│   ├── ...
│   └── site_content.csv
├── IMPORT_ORDER.txt
└── README.md
```

- `production/`: bộ mock lớn hơn để demo, benchmark API, dashboard, filter và pagination.
- `testing/`: bộ nhỏ hơn để test CRUD và business logic.

## Các trường hợp dữ liệu đã cover

- 3 role: `USER`, `STAFF`, `MANAGER`.
- Account đăng nhập password thường.
- Account OAuth-only (`password_hash = NULL`).
- Account liên kết Google / Facebook.
- Customer có field profile đầy đủ và một số field nullable.
- Staff `is_available = TRUE/FALSE`.
- Package active và inactive.
- Staff có nhiều kỹ năng / package.
- Lịch làm việc weekday / Saturday / Sunday off.
- Time-off cả ngày và nửa ngày.
- Đủ 6 Booking status: `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `REJECTED`.
- Đủ 3 assignment type: `AUTO`, `MANUAL`, `CUSTOMER`.
- Booking chưa được phân Staff (`staff_id = NULL`).
- Booking status history nhiều bước.
- Đủ Task status: `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`.
- Feedback từ 1 đến 5 sao/mức đánh giá.
- Attendance hoàn chỉnh, đang trong ca (`check_out = NULL`) và một edge case sửa tay trong bộ testing.
- Nội dung `site_content`.

## Kích thước dữ liệu

| Table | Production | Testing |
| --- | ---: | ---: |
| `roles` | 3 | 3 |
| `users` | 115 | 15 |
| `oauth_providers` | 2 | 2 |
| `oauth_accounts` | 21 | 4 |
| `customer_profiles` | 100 | 10 |
| `staff_profiles` | 12 | 4 |
| `manager_profiles` | 3 | 1 |
| `spa_packages` | 10 | 7 |
| `staff_package_skills` | 66 | 20 |
| `staff_working_hours` | 84 | 28 |
| `staff_time_off` | 18 | 4 |
| `booking_statuses` | 6 | 6 |
| `bookings` | 220 | 24 |
| `booking_status_history` | 680 | 61 |
| `task_statuses` | 5 | 5 |
| `staff_tasks` | 200 | 20 |
| `feedback_ratings` | 5 | 5 |
| `feedback` | 76 | 5 |
| `attendance` | 249 | 28 |
| `site_content` | 4 | 4 |

## NULL trong CSV

Các giá trị SQL `NULL` được ghi dưới dạng:

```text
\N
```

Đây là marker chuẩn khi dùng MariaDB/MySQL `LOAD DATA`.

Nếu import bằng DBeaver, hãy cấu hình `\N` là NULL value marker nếu DBeaver chưa tự nhận.

## Mock password

Các account password thường đang dùng cùng một chuỗi BCrypt mock:

```text
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

Dữ liệu này chỉ dùng để mock database, không dùng cho production thật.

## Seed data trong SQL hiện tại

SQL của bạn đã tự INSERT các bảng lookup:

- `roles`
- `oauth_providers`
- `booking_statuses`
- `task_statuses`
- `feedback_ratings`

Nếu bạn chạy nguyên seed SQL trước rồi import toàn bộ CSV, các bảng trên có thể bị duplicate key.

Có 2 cách:

1. Comment các `INSERT INTO` seed trong schema rồi import toàn bộ CSV theo `IMPORT_ORDER.txt`.
2. Giữ seed hiện tại và bỏ qua 5 CSV lookup nói trên khi import.

Tương tự với `site_content`: nếu giữ block default INSERT của SQL thì không import `site_content.csv` lần nữa.

## Encoding

CSV dùng `UTF-8 with BOM` để giữ tiếng Việt ổn định khi mở bằng Excel/DBeaver.
