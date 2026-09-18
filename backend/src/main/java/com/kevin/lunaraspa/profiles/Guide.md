# Profiles

## Tables liên quan

```text
accounts
customer_profiles
staff_profiles
```

## Foreign Key

```text
customer_profiles.account_id -> accounts.id
staff_profiles.account_id -> accounts.id
```

---

## 1. Lấy Profile hiện tại

**Endpoint**

```text
/api/profile/me
```

**Method**

```text
GET
```

**Mục đích**

Lấy profile của Account hiện tại.

**Request JSON**

Không cần Body.

**Response JSON**

```json
{
  "success": true,
  "message": "Get profile successfully",
  "data": {
    "accountId": 10,
    "email": "user@gmail.com",
    "displayName": "Nguyen Van A",
    "role": "CUSTOMER",
    "phone": "0912345678",
    "preferences": "Massage nhẹ",
    "internalNotes": null
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 2. Cập nhật Customer Profile

**Endpoint**

```text
/api/profile/me
```

**Method**

```text
PUT
```

**Mục đích**

Customer cập nhật thông tin Profile.

**Request JSON**

```json
{
  "phone": "0912345678",
  "preferences": "Massage nhẹ"
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Update profile successfully",
  "data": {
    "accountId": 10,
    "phone": "0912345678",
    "preferences": "Massage nhẹ"
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** Không cho phép Customer tự thay đổi `role`, `employee_code` hoặc `job_title`.

## Triển khai trong backend hiện tại

Module chạy chung tại `backend/pom.xml`, package `com.kevin.lunaraspa.profiles`.
Bản `backend/app` cũ là prototype độc lập, không dùng để kiểm thử module này.

- JWT dùng module Authentication hiện tại: `sub` là **email**, không phải account ID.
- GET cho mọi account đang active; Customer có `phone`, `preferences`;
  Staff/Manager có `employeeCode`, `jobTitle`, `isBookable` nếu có staff profile.
- Response giữ `id` để tương thích client cũ và bổ sung `accountId` theo Guide.
- Không trả nội dung `internalNotes` qua API tự xem hồ sơ.
- PUT chỉ cho CUSTOMER. Ngoài `phone`, `preferences`, giữ hỗ trợ `displayName`
  đã có trong backend mới (không rỗng, tối đa 150 ký tự).
- Trường không gửi được giữ nguyên; gửi `null` hoặc chuỗi trắng để xóa phone/preferences.
- Phone tối đa 30 ký tự, chứa ít nhất 3 chữ số, cho phép `+` ở đầu và dấu cách/ngoặc/gạch ngang.
- Preferences tối đa 65535 byte UTF-8 tương ứng MySQL TEXT.
- Mọi trường ngoài danh sách trên (role, accountId, employee_code, job_title,
  internalNotes, ...) bị từ chối với HTTP 400. Thiếu profile Customer thì tạo khi PUT.
- Account bị khóa và Staff/Manager gửi PUT nhận 403; account không tồn tại nhận 404.
- Token thiếu/sai/hết hạn hoặc nằm trong blacklist nhận 401.
- CORS chỉ cho origin cấu hình bởi `FRONTEND_URL`.

Response thực tế dùng `ResponseBuilder` chung của backend mới: `success`, `status`,
`message`, `data` (lỗi có thêm `error`), chưa có `timestamp` như ví dụ thiết kế ở trên.

### Kiểm thử không cần MySQL/Redis/Google

Chạy từ thư mục gốc:

```powershell
mvn -f backend/pom.xml "-Dtest=ProfileControllerTest,AppExceptionTest,PaginationTest" test
```

`ProfileControllerTest` chạy HTTP qua MockMvc với security chain, JWT thật và service thật;
repository và blacklist được mock. Test này không thay thế kiểm thử lưu dữ liệu trên MySQL.
Test `LunaraSpaApplicationTests` của dự án cần cấu hình DB/Redis/OAuth khi chạy toàn bộ suite.

### Kiểm tra tích hợp trên web

Frontend hiện chưa có trang Profile. Auth frontend gọi `/api/v1/auth/...` và dùng cookie,
trong khi backend hiện dùng `/api/auth/...` và Bearer JWT. Cần đồng bộ luồng Auth rồi
kết nối trang Profile; chạy Vite đơn thuần chưa xác minh được API này.
