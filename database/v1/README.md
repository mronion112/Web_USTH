# Mock data v1

Bộ mock data **sinh tự động** cho Lunara, thay cho hai dataset cũ ở `database/Production` và
`database/Testing` (dữ liệu cũ do LLM viết tay, đã trôi khỏi schema và chứa nhiều dữ kiện vô lý).

Dataset cũ **vẫn được giữ nguyên** — v1 nằm song song trong thư mục này để so sánh và chuyển đổi khi nhóm sẵn sàng.

## 1. Vì sao có v1

Bộ kiểm (`tools/check_dataset.py`) khi chạy trên dataset cũ tìm được **84 vi phạm**, ví dụ:

| Nhóm | Ví dụ có thật trong `database/Testing` |
| --- | --- |
| Trạng thái app không sinh ra | 4 booking ở `PENDING` (code chỉ đặt `PENDING_PAYMENT`, xem `BookingServiceImpl.java:158`) |
| Thanh toán vô lý | payment 13 `AT_SPA` + `FAILED` — trả tại spa không thể thất bại trước khi khách đến |
| Lịch trùng | booking 27 và 28 của cùng khách 10 trùng 15/09 09:00–10:30 |
| Thời gian phi logic | `staff_time_off.created_at` sau snapshot; `staff_working_hours.created_at` trước khi nhân viên tồn tại; `feedback.updated_at < created_at` |
| Event sai thứ tự | event id tăng nhưng `occurred_at` giảm |
| Dữ liệu máy sinh lộ liễu | 3–4 câu ghi chú dùng lại cho hàng trăm booking; `google_subject = google-test-000001`; payment luôn `created_at = booking.created_at + 2 phút` |
| Trôi khỏi nguồn | CSV ghi 12 dịch vụ, DB đang chạy có 7 dịch vụ; `VALIDATION_SUMMARY.json` ghi 173 tài khoản, DB có 176 |

Ngoài ra `make seed-dataset` nạp CSV với `SET FOREIGN_KEY_CHECKS=0` rồi bật lại **mà không kiểm gì**, nên các lỗi
trên không bị chặn ở đâu cả.

## 2. Cấu trúc

```text
database/v1/
├── RULES.md                  # danh mục bất biến (nguồn chung cho generator và bộ kiểm)
├── Testing/                  # CSV sinh ra + VALIDATION_SUMMARY.json
├── Production/
└── tools/
    ├── dataset_config.py     # tham số quy mô + danh mục dịch vụ + pool nội dung tiếng Việt
    ├── generate_dataset.py   # sinh CSV (deterministic, chỉ dùng stdlib)
    ├── check_dataset.py      # kiểm tra CSV theo RULES.md
    └── check_sql.py          # nạp vào schema tạm rồi kiểm tra ở tầng SQL
```

Định dạng CSV giữ nguyên như pipeline hiện tại (`IMPORT_ORDER.txt`, header, CRLF, UTF-8, NULL là `\N`),
nên có thể nạp bằng đúng câu `LOAD DATA LOCAL INFILE` mà `Makefile` đang dùng.
Bảng vận hành `sepay_transactions` do Flyway tạo và được để trống khi nạp dataset; vì vậy v1 vẫn chỉ có 15 file CSV.

## 3. Cách dùng

```bash
# Sinh lại dataset (ghi đè CSV trong database/v1/<Dataset>)
python3 database/v1/tools/generate_dataset.py --dataset Testing
python3 database/v1/tools/generate_dataset.py --dataset Production

# Kiểm tra CSV (nhanh, không cần database)
python3 database/v1/tools/check_dataset.py --csv-dir database/v1/Production

# Kiểm tra ở tầng SQL: nạp vào schema tạm lunara_spa_v1_check với FOREIGN_KEY_CHECKS=1 rồi chạy bất biến
python3 database/v1/tools/check_sql.py --dataset Production
python3 database/v1/tools/check_sql.py --dataset Testing --keep   # giữ schema để soi tay

# Nạp v1 vào DB đang chạy (DROP lunara_spa và nạp lại; phải có --keep để xác nhận)
python3 database/v1/tools/check_sql.py --dataset Production --schema lunara_spa --keep
```

`generate_dataset.py` tự chạy lại `check_dataset.py` sau khi sinh; có vi phạm thì exit code khác 0.

## 4. Bảo đảm của v1

- **Tái lập được**: seed cố định theo dataset, chạy hai lần cho ra file giống nhau từng byte
  (`diff -r` hai thư mục là rỗng).
- **Bất biến áp ngay lúc sinh**: scheduler chỉ đặt lịch vào khung giờ làm việc còn hiệu lực, trừ thời gian
  nghỉ phép, chừa buffer chuẩn bị/dọn dẹp, và không cho hai booking của cùng khách trùng nhau.
- **Không trôi nguồn**: `VALIDATION_SUMMARY.json` do generator xuất, kèm sha256 từng file.
- **Chỉ dùng trạng thái app có thể sinh ra**: `PENDING_PAYMENT → CONFIRMED → CHECKED_IN → IN_SERVICE → COMPLETED`.
- **Danh mục dịch vụ** viết tiếng Việt và chỉ dùng ba mã `MASSAGE / FACIAL / BODY` mà UI đang lọc
  (`ServicesCollection.tsx` lọc `s.category === activeCategory`). `image_url` để NULL vì
  `frontend/lunara/public/images/services/*` không tồn tại — UI đã có ảnh mặc định theo category.
- **Độ phủ nghiệp vụ** có kiểm chứng trong `RULES.md` mục VIII5: booking 3 dịch vụ, reschedule,
  đổi giá (snapshot cũ < giá hiện tại), refund kèm feedback 1–2 sao, `AT_SPA` chưa trả,
  và một khách đặt 2 booking cùng ngày với 2 kỹ thuật viên khác nhau.

## 5. Quy mô hai dataset

| | Testing | Production |
| --- | --- | --- |
| Tài khoản | 20 | 173 |
| Dịch vụ | 6 | 12 |
| Kỹ thuật viên | 4 | 16 (1 người không nhận booking) |
| Booking | 30 | 600 |
| Booking item | ~35 | ~680 |
| Payment / Feedback | 30 / ~9 | 600 / ~215 |
| Snapshot | `2026-09-15 15:00:00` | `2026-09-15 15:00:00` |

Phân bố trạng thái, phương thức thanh toán và rating của từng dataset nằm trong
`<Dataset>/VALIDATION_SUMMARY.json` do generator xuất.

## 6. Việc chưa làm

- Chưa nối v1 vào `Makefile` / CI. Khi nhóm quyết định chuyển sang v1 thì thêm target
  `check-data` và cho `seed-dataset` chạy `check_dataset.py` trước khi nạp, rồi chạy `check_sql.py` sau khi nạp.
  Lưu ý `Makefile` và `.github/` nằm trong `INFRA_PATHS` nên thay đổi cần reviewer xác nhận.
- Chưa đồng bộ tài liệu tham chiếu mã cụ thể (booking code, email) trong `database/README.md`,
  vì v1 sinh id và mã khác.
- Dataset không sinh lịch sử webhook SePay; các bản ghi này chỉ được tạo từ giao dịch runtime.
