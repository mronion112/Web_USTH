# Profiles

## 1. Lấy profile của User hiện tại

**Endpoint**

```text
/api/profile/me
```

**Method**

```text
GET
```

**Tables liên quan**

```text
users, customer_profiles
```

**Mục đích**

Lấy thông tin profile của USER đang đăng nhập.

**Response JSON**

```json
{
  "success": true,
  "message": "Get profile successfully",
  "data": {
    "id": 10,
    "fullName": "Nguyen Van A",
    "email": "user@gmail.com",
    "phone": "0912345678",
    "gender": "MALE",
    "dateOfBirth": "2004-05-20",
    "address": "Ha Noi"
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 2. Cập nhật profile

**Endpoint**

```text
/api/profile/me
```

**Method**

```text
PUT
```

**Tables liên quan**

```text
users, customer_profiles
```

**Request JSON**

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0912345678",
  "gender": "MALE",
  "dateOfBirth": "2004-05-20",
  "address": "Ha Noi"
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 10,
    "fullName": "Nguyen Van A",
    "phone": "0912345678",
    "address": "Ha Noi"
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** Không cho User tự đổi `role`.
