# Dữ liệu, cấu hình và vận hành

## Data model

| Nhóm | Bảng | Quan hệ/quy tắc quan trọng |
| --- | --- | --- |
| IAM | `roles`, `permissions`, `role_permissions`, `accounts` | account có một role; email và `google_subject` unique; account có thể do account khác provision |
| Hồ sơ | `customer_profiles`, `staff_profiles` | 1–1 theo `account_id`; therapist có `employee_code`, job title, bookable |
| Catalogue/lịch | `services`, `staff_services`, `staff_working_hours`, `staff_time_off` | service active, adjustable duration/price step, buffer; staff-service là skill M:N |
| Booking | `bookings`, `booking_items`, `booking_events` | booking có snapshots và items; events là audit; FK customer/staff/creator |
| Payment | `payments`, `sepay_transactions` | mỗi booking tối đa một payment (`booking_id UNIQUE`); SePay transaction audit/match riêng |
| Chất lượng | `feedback` | tối đa một feedback/booking, rating 1–5 |

### Status được lưu

```text
Booking: PENDING_PAYMENT | PENDING | CONFIRMED | CHECKED_IN | IN_SERVICE | COMPLETED
Payment: UNPAID | PAID | FAILED | REFUNDED
Method:  QR | CARD | AT_SPA
Assignment: SYSTEM | CUSTOMER | ADMIN
```

`PENDING` là enum compatibility; rules/dataset ghi nhận code production không gán nó. Dataset `database/v1/RULES.md` định nghĩa thêm invariant (snapshot amount/duration, non-overlap cả buffer, staff skill, timestamp ordering) cho fixture Production/Testing.

## Bootstrap local

```sh
cp templates/.env.example templates/.env
make up-app
# hoặc: docker compose -f templates/docker-compose.yml --profile app up --build
```

`templates/.env.example` là danh mục biến, không phải giá trị production. Mặc định Compose khởi động `db`, `redis`, `kafka`; frontend/backend thuộc profile `app`; Chroma thuộc profile `chroma`. `database/Web_DataBase_USTH.sql` chỉ DDL và được mount khi MySQL volume lần đầu tạo; data demo/test phải nạp chủ động, không nằm entrypoint.

## Biến môi trường theo vùng

| Vùng | Biến tiêu biểu | Ý nghĩa |
| --- | --- | --- |
| Database | `SPRING_DATASOURCE_URL`, username/password, `MYSQL_*` | MySQL schema `lunara_spa` |
| Auth | `JWT_SECRET`, `JWT_EXPIRATION_MS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` | ký JWT, Google OAuth và redirect/CORS |
| Frontend | `VITE_API_URL` | baked vào Vite build; đổi thì build frontend lại |
| Realtime | `KAFKA_BOOTSTRAP_SERVERS`, consumer group, `REDIS_HOST/PORT` | event bus và email dedupe |
| Email | `MAIL_ENABLED`, `GMAIL_*`, `MAIL_FROM`, `MAIL_NAME` | Gmail REST OAuth2 |
| Payment | `PAYMENT_BANK_*`, `SEPAY_WEBHOOK_SECRET`, `SEPAY_ACCOUNT_NUMBER`, sub-account | VietQR và signature webhook |
| RAG | `GEMINI_*`, `CHROMA_*`, `CHATBOT_DOCS_PATH`, chunk/top-K | index/retrieve/generate chatbot |

Production tắt Swagger mặc định bằng `application-prod.yml`; local/test thường `OPENAPI_ENABLED=true`.

## API/runtime contracts

- Backend nghe `BACKEND_PORT`/`PORT` (mặc định 8080); SPA dev server 5173, container Nginx frontend 80.
- `app.frontend-url` là origin cho controller CORS/OAuth redirect; phải khớp origin SPA thực tế.
- Java runtime yêu cầu 21. Frontend build dùng `tsc -b && vite build`; tests dùng Vitest/Playwright. Backend dùng Maven wrapper.
- Flyway đã bật và JPA chỉ validate schema: sửa entity/schema phải có migration hợp lệ, không dựa vào Hibernate tạo bảng.

## Bảo mật vận hành

- Không commit `.env`, OAuth client JSON, Gmail refresh token, SePay HMAC secret hoặc JWT secret. Repository hiện có một file Google client secret dưới `backendv1/`; coi đó là credential cần rotate/remove khỏi phân phối nếu còn dùng.
- CORS không thay thế authorization. Các endpoint public hiện gồm catalogue, availability, OAuth/token exchange, SePay webhook (HMAC) và chatbot RAG.
- Access token có lifetime cấu hình; refresh token mặc định 24 giờ ở backend. Logout blacklist token và dọn cookie/session.
- `OPENAPI_ENABLED` chỉ bật ở local/test. Không expose Swagger production nếu không có kiểm soát phù hợp.

## Nguồn kiểm chứng chính

- Schema: `database/Web_DataBase_USTH.sql`; fixture rules: `database/v1/RULES.md`.
- Runtime: `backend/src/main/resources/application.yml`, `templates/docker-compose.yml`, `templates/.env.example`.
- Endpoint/security: controller và `*SecurityConfig.java` trong `backend/src/main/java/com/kevin/lunaraspa`.
- Client behavior: `frontend/lunara/src/App.tsx`, `lib/api.ts`, `lib/refresh-transport.ts`.
