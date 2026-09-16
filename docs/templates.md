# Cấu hình mẫu trong templates/

`templates/.env` chứa giá trị local thật và không bao giờ commit.
`templates/.env.example` là template trống. Khởi tạo từ thư mục gốc:

```sh
cp templates/.env.example templates/.env
```

## Quy tắc DB

- `database/Web_DataBase_USTH.sql` là template cố định, chỉ chứa DDL, không chứa data.
- Một DB `lunara_spa` duy nhất cho mọi service, không tạo thêm DB theo service.
- `ddl-auto: validate` mọi nơi trừ test. Cấm `update` trên nhánh merge.
- Mock dataset CSV là ground truth cho demo/test, không phải data thật:
  - `database/Production/`: mock quy mô lớn để demo, benchmark API.
  - `database/Testing/`: mock gọn để dev/test nhanh, làm nền cho factory override.
  - Nạp theo `database/IMPORT_ORDER.txt`, NULL là `\N`, file CRLF.
- Khi kiểm thử, giá trị mock được override qua factory/fixture trong code để tạo kịch bản.

Chi tiết:

- Backend Spring Boot chịu trách nhiệm seeding và override.
- Thư viện fixture chốt: `org.instancio:instancio-junit` bản 6.0.0.
- Khung mẫu ở `templates/test-fixtures/`: `EntityFixtures` cho entity/DTO,
  `DbFixtures` cho repository test, `ControllerFixtures` cho controller test.
  Copy vào `backend/src/test/java/<package-goc>/fixtures/` rồi rename package.
- Vị trí ground truth: TBD, ví dụ `backend/src/test/fixtures/` hoặc `backend/src/main/resources/seed/`.
- Mock frontend ở `frontend/lunara/src/data/` chỉ phục vụ UI, không seed DB.
- Hạ tầng không nhận file `database/*.sql` chứa `INSERT` hay CSV seed.

## Stack local

- `db`: MySQL 8.4, seed từ template, healthcheck trước khi app khởi động.
- `redis`: Redis 7, phụ thuộc chính thức của backend.
- `backend`: build từ `templates/Dockerfile.backend` chung với context root repo, yêu cầu module có `pom.xml` + `mvnw`.
- `frontend`: placeholder tới khi có `Dockerfile` riêng.

## Workflow local

Chạy từ thư mục gốc:

```sh
make up          # khởi động DB template + Redis, chưa có data
make up-app      # full stack khi backend đã có pom.xml
make down        # dừng
make logs SERVICE=db
make seed        # nạp lại schema template (alias: make schema)
make seed-demo   # nạp mock dataset Production
make seed-test   # nạp mock dataset Testing
make validate    # kiểm đủ 15 bảng trong database/expected_tables.txt
make test-backend # chạy test backend với factory override, skip nếu chưa có code
```

## Bảo vệ file hạ tầng

File hạ tầng do infra sở hữu: `Makefile`, `templates/`, `.github/`,
`docs/`, `database/expected_tables.txt`, `.gitignore` phần env.

- Kiểm tra local: `make verify-infra` liệt kê file đổi khác so với
  `origin/main` (đổi baseline bằng `make verify-infra BASELINE=<ref>`).
- Đổi ngoài ý muốn thì restore: `git checkout <baseline> -- <đường-dẫn>`.
- Job CI `infra-guard` chạy trên mọi PR: xóa file hạ tầng thì fail,
  sửa thì pass kèm bảng liệt kê để reviewer xác nhận.
- Nhánh feature được thêm file mới ngoài các đường dẫn trên bình thường.
  Sửa file hạ tầng có lý do thì giữ lại và ghi lý do vào PR.
