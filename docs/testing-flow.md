# Luồng kiểm thử

## Vai trò của mock dataset

Cả hai bộ CSV trong `database/` đều là mock, không phải data thật:

- `database/Testing/`: nền chung cho dev và test. Dev chạy `make seed-test`
  để có DB local giống nhau. Test tự động nạp bộ này rồi override từng case
  qua factory/fixture, không dựng data từ đầu.
- `database/Production/`: nền cho demo và benchmark API, dashboard, phân trang.
  Không dùng cho test tự động.

Nạp theo `database/IMPORT_ORDER.txt`, NULL là `\N`, file CRLF.

## Test local

Chạy từ thư mục gốc:

```sh
make up            # MySQL template + Redis, DB trống
make seed-test     # nạp mock Testing: schema sạch + CSV theo IMPORT_ORDER
make validate      # kiểm đủ 15 bảng trong database/expected_tables.txt
make test-backend  # mvn test: unit chạy thuần, integration override trên nền mock
```

Nguyên tắc:

- Test nào cần DB thì tự lo (H2 hoặc Testcontainers), không dùng DB local.
- DB local chỉ phục vụ dev và demo.
- Tạo kịch bản bằng factory override (`EntityFixtures`, `DbFixtures`
  trong `templates/test-fixtures/`), cấm helper `insertX` private trùng logic.
- Mọi `@SpringBootTest` mới phải tắt index RAG lúc test:
  `@SpringBootTest(properties = "app.chatbot.chroma.startup-indexing=false")`,
  kẻo CI gọi Chroma/Gemini thật.

## Test trên CI

Ba job độc lập, nhìn log là biết lỗi thuộc lớp nào:

- `db-validate`: schema template import được và đủ 15 bảng.
  Fail nghĩa là SQL vỡ.
- `data-import-check`: mock `Testing` nạp được và `bookings > 0`.
  Fail nghĩa là CSV lệch schema hoặc sai thứ tự khóa ngoại.
- `build-test`: nạp schema rồi chạy `mvn test` với MySQL + Redis thật,
  frontend build riêng. Fail nghĩa là code hoặc test có vấn đề.

## Ví dụ kịch bản

Test "staff bận không được gán booking trùng giờ": nạp nền `Testing`,
dùng `DbFixtures` chèn thêm một booking trùng khung giờ cho staff X,
gọi API gán việc, assert trả lỗi. Nền mock cho sẵn staff, working hours
và time-off hợp lệ nên test chỉ viết phần khác biệt.
