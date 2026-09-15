# Cấu hình mẫu trong templates/

`templates/.env` chứa giá trị local thật và không bao giờ commit.
`templates/.env.example` là template trống. Khởi tạo từ thư mục gốc:

```sh
cp templates/.env.example templates/.env
```

## Quy tắc DB

- `database/Web_DataBase_USTH.sql` là template cố định, chỉ chứa DDL, không chứa data.
- Data mock được nạp từ code, không nằm sẵn trong DB.
- Khi kiểm thử, giá trị nạp mặc định được override qua factory/fixture để tạo kịch bản.

Chi tiết:

- Backend Spring Boot chịu trách nhiệm seeding và override. Placeholder cho 2 điểm chưa chốt:
  - Factory: TBD, ví dụ `Instancio`/`EasyRandom`/`Builder` tự viết + `Testcontainers`.
  - Vị trí ground truth: TBD, ví dụ `backend/src/test/fixtures/` hoặc `backend/src/main/resources/seed/`.
- Mock frontend ở `frontend/lunara/src/data/` chỉ phục vụ UI, không seed DB.
- Hạ tầng không nhận file `database/*.sql` chứa `INSERT` hay CSV seed.

## Workflow local

Chạy từ thư mục gốc:

```sh
make up          # khởi động DB template, chưa có data
make up-app      # full stack khi backend/app và frontend/app có Dockerfile
make down        # dừng
make logs SERVICE=db
make seed        # nạp lại schema template (alias: make schema)
make validate    # kiểm đủ 15 bảng trong database/expected_tables.txt
make test-backend # chạy test backend với factory override, skip nếu chưa có code
```
