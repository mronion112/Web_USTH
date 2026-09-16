# Authentication & Account

## Tables liên quan

```text
roles
permissions
role_permissions
accounts
```

## Foreign Key

```text
accounts.role_id -> roles.id
accounts.provisioned_by_account_id -> accounts.id
role_permissions.role_id -> roles.id
role_permissions.permission_id -> permissions.id
```

---

## 1. Đăng nhập bằng Google

**Endpoint**

```text
/oauth2/authorization/google
```

**Method**

```text
GET
```

**Mục đích**

Đăng nhập bằng Google OAuth2.

**Request JSON**

Không cần Body.

**Response**

Backend không trả về JSON tĩnh, mà sẽ thực hiện lệnh HTTP Redirect 302 chuyển hướng trình duyệt về lại Frontend SPA (React/Vue).
Token được đính kèm vào URL (ví dụ: `http://localhost:3000/oauth2/redirect?token=...&refreshToken=...`).

**Quy tắc chính:** Frontend lắng nghe route `/oauth2/redirect`, lấy token trên URL và lưu vào LocalStorage/Cookie. `google_subject` dùng để liên kết tài khoản Google với `accounts`.

---

## 2. Lấy Account hiện tại

**Endpoint**

```text
/api/auth/me
```

**Method**

```text
GET
```

**Mục đích**

Lấy thông tin Account từ JWT.

**Request JSON**

Không cần Body.

**Response JSON**

```json
{
  "success": true,
  "message": "Get current account successfully",
  "data": {
    "id": 10,
    "email": "user@gmail.com",
    "displayName": "Nguyen Van A",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "CUSTOMER",
    "isActive": true
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** API protected, lấy Account từ `Authorization: Bearer <token>`.

---

## 3. Lấy danh sách Account

**Endpoint**

```text
/api/manager/accounts
```

**Method**

```text
GET
```

**Mục đích**

Manager xem danh sách Account.

**Request JSON**

Không cần Body.

**Response JSON**

```json
{
  "success": true,
  "message": "Get accounts successfully",
  "data": [
    {
      "id": 10,
      "email": "user@gmail.com",
      "displayName": "Nguyen Van A",
      "role": "CUSTOMER",
      "isActive": true
    }
  ],
  "timestamp": "2026-09-20T10:00:00"
}
```
