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
