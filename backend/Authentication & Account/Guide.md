# Authentication & Account

## 1. Đăng ký

**Endpoint**

```text
/api/auth/register
```

**Method**

```text
POST
```

**Tables liên quan**

```text
users, roles, customer_profiles
```

**Mục đích**

Tạo tài khoản USER mới.

**Request JSON**

```json
{
  "fullName": "Nguyen Van A",
  "email": "user@gmail.com",
  "password": "123456",
  "phone": "0912345678",
  "gender": "MALE",
  "dateOfBirth": "2004-05-20"
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Register successfully",
  "data": {
    "id": 10,
    "fullName": "Nguyen Van A",
    "email": "user@gmail.com",
    "role": "USER"
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** User đăng ký public luôn có role `USER`. Password được BCrypt trước khi lưu.

---

## 2. Đăng nhập

**Endpoint**

```text
/api/auth/login
```

**Method**

```text
POST
```

**Tables liên quan**

```text
users, roles
```

**Mục đích**

Xác thực email/password và trả JWT.

**Request JSON**

```json
{
  "email": "user@gmail.com",
  "password": "123456"
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Login successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "user": {
      "id": 10,
      "fullName": "Nguyen Van A",
      "email": "user@gmail.com",
      "role": "USER"
    }
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** Client gửi `Authorization: Bearer <token>` với các API protected.

---

## 3. OAuth2 Google / Facebook

**Endpoint**

```text
/oauth2/authorization/{provider}
```

**Method**

```text
GET
```

**Tables liên quan**

```text
users, roles, oauth_providers, oauth_accounts
```

**Mục đích**

Đăng nhập / đăng ký bằng Google hoặc Facebook.

**Response JSON**

```json
{
  "success": true,
  "message": "OAuth login successfully",
  "data": {
    "accessToken": "...",
    "tokenType": "Bearer",
    "user": {
      "id": 12,
      "fullName": "Nguyen Van B",
      "email": "b@gmail.com",
      "role": "USER"
    }
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** Nếu account chưa tồn tại thì tạo `users`, `customer_profiles`, `oauth_accounts`.

---

## 4. Lấy tài khoản hiện tại

**Endpoint**

```text
/api/auth/me
```

**Method**

```text
GET
```

**Tables liên quan**

```text
users, roles, profile theo role
```

**Mục đích**

Lấy thông tin account đang đăng nhập.

**Response JSON**

```json
{
  "success": true,
  "message": "Get current user successfully",
  "data": {
    "id": 10,
    "fullName": "Nguyen Van A",
    "email": "user@gmail.com",
    "phone": "0912345678",
    "gender": "MALE",
    "dateOfBirth": "2004-05-20",
    "role": "USER"
  },
  "timestamp": "2026-09-20T10:00:00"
}
```
