# API, roles và quyền

Base URL local mặc định là `http://localhost:8080`. Với API protected, gửi `Authorization: Bearer <access JWT>`. `POST /api/auth/refresh-token` nhận refresh token và client retry request lỗi 401 một lần.

## Role matrix thực thi

| Khả năng | OWNER | MANAGER | RECEPTIONIST | THERAPIST | ACCOUNTANT | CUSTOMER |
| --- | --- | --- | --- | --- | --- | --- |
| Catalogue/service, staff directory, availability | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ / public |
| Booking của mình, đổi lịch, feedback | theo ownership | theo ownership | theo ownership | theo ownership | theo ownership | ✓ |
| Search/tạo/assign/check-in/reschedule booking vận hành | ✓ | ✓ | ✓ | — | — | — |
| Dashboard, service/staff management, account management | ✓ | ✓ | — | — | — | — |
| Customer records | ✓ | ✓ | ✓ | — | — | — |
| Payments | ✓ | ✓ | ✓ | authenticated; controller còn kiểm role cho mutation | ✓ | authenticated; controller còn kiểm role cho mutation |
| Reports | ✓ | ✓ | controller allow authenticated, sau đó ✓ | — | ✓ | — |
| Staff task start/complete | — | — | — | ✓ | — | — |

`permissions`/`role_permissions` tồn tại trong database. Fixture hiện cấp 18 permission code: `BOOKINGS_*`, `CUSTOMERS_*`, `PAYMENTS_*`, `REPORTS_VIEW`, `FEEDBACK_VIEW`, `ADMIN_ACCOUNTS_*`, `ADMIN_ROLES`, `ADMIN_SERVICES`, `ADMIN_STAFF_SCHEDULE`; OWNER/MANAGER có tất cả. Enforcement hiện pha trộn: `ApiPermissionRegistry` chỉ map một số manager booking/account route, còn các security chain cụ thể chủ yếu dùng authority role và service/controller kiểm ownership. Do đó ma trận trên mô tả **quyền thực tế**, không chỉ menu UI hay CSV fixture.

## Auth, profile và account

| Method | Path | Auth/quyền | Mục đích |
| --- | --- | --- | --- |
| GET | `/oauth2/authorization/google` | public | bắt đầu Google OAuth2 |
| GET | `/api/auth/me` | JWT | account hiện tại |
| POST | `/api/auth/exchange` | public code exchange | đổi OAuth callback code thành access/refresh token |
| POST | `/api/auth/refresh-token` | public refresh token | cấp access token mới |
| POST | `/api/auth/logout` | public route, có thể kèm token | blacklist/logout, xoá session/cookie |
| GET/PUT | `/api/profile/me` | JWT; PUT chỉ CUSTOMER | xem profile hoặc đổi display name/phone/preferences |
| GET | `/api/manager/accounts` | OWNER/MANAGER | list account |
| POST | `/api/manager/accounts` | OWNER/MANAGER | provision account |
| PATCH | `/api/manager/accounts/{id}/toggle-active` | OWNER/MANAGER | lock/unlock account |
| PATCH | `/api/manager/accounts/{id}/role` | OWNER/MANAGER | đổi role |

## Public catalogue và booking

| Method | Path | Auth/quyền | Mục đích/chú ý |
| --- | --- | --- | --- |
| GET | `/api/services`, `/api/services/{id}` | public | chỉ service active |
| GET | `/api/staff` | public | directory KTV active/bookable |
| POST | `/api/availability` | public | tìm slot theo items, range, KTV tùy chọn; giới hạn 31 ngày |
| POST | `/api/bookings` | JWT + customer profile | khách tự tạo `PENDING_PAYMENT` booking |
| GET | `/api/bookings/my` | JWT | danh sách booking của actor |
| GET | `/api/bookings/{bookingCode}` | JWT + ownership/service check | chi tiết booking theo code |
| PATCH | `/api/bookings/{bookingCode}/reschedule` | JWT + owner | chỉ trước check-in, kiểm tra lại availability |
| POST/GET | `/api/feedback`, `/api/feedback/booking/{id}` | JWT policy của feedback chain | feedback tối đa một lần cho booking completed / xem feedback |

## Operations booking, staff và customer

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/api/manager/bookings?from&to&status&staffId&unassigned&code&page&size` | O/M/R | search; date range tối đa 93 ngày, size tối đa 100 |
| POST | `/api/manager/bookings` | O/M/R | tạo booking walk-in; có thể tạo customer mới từ name/phone/email |
| PATCH | `/api/manager/bookings/{id}/assign` | O/M/R | gán lại KTV có skill/slot |
| PATCH | `/api/manager/bookings/{id}/check-in` | O/M/R | idempotent `CONFIRMED → CHECKED_IN` |
| PATCH | `/api/manager/bookings/{id}/reschedule` | O/M/R | đổi giờ/KTV |
| POST | `/api/manager/bookings/{id}/email/resend` | O/M/R | queue email (202) |
| GET/PUT/POST | `/api/manager/staff/{id}/schedule`, `/working-hours`, `/time-off` | OWNER/MANAGER | lịch, giờ làm và nghỉ phép |
| POST | `/api/manager/staff` | OWNER/MANAGER | tạo therapist + service skills/working hours |
| GET/POST/PUT | `/api/manager/customers`, `/{id}/notes` | O/M/R | list/create, lưu notes/preferences nội bộ |
| GET/PATCH | `/api/staff/tasks`, `/{id}/start`, `/{id}/complete` | THERAPIST | task của actor và state service |
| POST/GET | `/api/attendance/check-in`, `/check-out`, `/my` | authenticated | luôn trả 501 `ATTENDANCE_NOT_SUPPORTED`; schema không có attendance bền vững |

## Service, dashboard, notification và report

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| POST/PUT/DELETE | `/api/manager/services`, `/{id}` | OWNER/MANAGER | create/update/toggle active service |
| GET | `/api/manager/dashboard` | OWNER/MANAGER | KPI count, revenue ngày, rating |
| GET | `/api/manager/notifications?limit&offset` | mọi role xác thực theo chain | booking event feed, được filter theo role/ownership |
| GET | `/api/reports/summary?from&to&groupBy=DAY|WEEK|MONTH` | OWNER/MANAGER/ACCOUNTANT | controller kiểm role, range ≤366 ngày |

## Payment và external callback

| Method | Path | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | `/api/payments` | OWNER/MANAGER/RECEPTIONIST/ACCOUNTANT | list payment; customer không được list toàn cục |
| POST/GET | `/api/payments`, `/api/payments/booking/{id}` | owner booking hoặc role vận hành | tạo payment / xem payment của booking |
| PATCH | `/api/payments/{id}/paid` | OWNER/MANAGER/RECEPTIONIST/ACCOUNTANT | manual confirm, chung confirmation service với webhook |
| POST | `/api/payments/{id}/refund` | OWNER/MANAGER/ACCOUNTANT | `PAID → REFUNDED`; receptionist bị chặn |
| POST | `/api/payments/sepay/webhook` | public + HMAC | ingest SePay, không dùng JWT |
| GET/POST | `/api/payments/sepay/transactions`, `/{sepayId}/reconcile` | OWNER/MANAGER/ACCOUNTANT | list manual-review, confirm hoặc ignore |

## Stream và chatbot

| Method | Path | Quyền | Contract |
| --- | --- | --- | --- |
| GET | `/api/events` | JWT | SSE `connected`, `refresh`; bearer header là bắt buộc |
| POST | `/api/v1/chatbot/query` | public | `{message, topK?}` → answer + sources |
| POST | `/api/v1/chatbot/stream` | public | SSE POST: `sources`, `token`, `done` hoặc `error` |

OpenAPI chỉ public khi `OPENAPI_ENABLED=true`: `/swagger-ui.html`, `/v3/api-docs`, `/v3/api-docs.yaml`. Production mặc định tắt.
