# Spa Service

## Tables liên quan

```text
services
staff_services
staff_profiles
```

## Foreign Key

```text
staff_services.staff_account_id -> staff_profiles.account_id
staff_services.service_id -> services.id
```

---

## 1. Lấy danh sách Service

**Endpoint**

```text
/api/services
```

**Method**

```text
GET
```

**Mục đích**

Lấy danh sách dịch vụ đang hoạt động.

**Request JSON**

Không cần Body.

**Response JSON**

```json
{
  "success": true,
  "message": "Get services successfully",
  "data": [
    {
      "id": 1,
      "name": "Facial Care",
      "category": "FACIAL",
      "description": "Chăm sóc da mặt",
      "imageUrl": "/images/facial.jpg",
      "basePrice": 350000,
      "minimumDurationMinutes": 60,
      "isDurationAdjustable": true,
      "durationStepMinutes": 30,
      "pricePerDurationStep": 120000,
      "isActive": true
    }
  ],
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 2. Lấy chi tiết Service

**Endpoint**

```text
/api/services/{id}
```

**Method**

```text
GET
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get service successfully",
  "data": {
    "id": 1,
    "name": "Facial Care",
    "category": "FACIAL",
    "basePrice": 350000,
    "minimumDurationMinutes": 60,
    "preparationBufferMinutes": 10,
    "cleanupBufferMinutes": 10,
    "staff": [
      {
        "accountId": 21,
        "displayName": "Tran Thi Lan"
      }
    ]
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 3. Tạo Service

**Endpoint**

```text
/api/manager/services
```

**Method**

```text
POST
```

**Request JSON**

```json
{
  "name": "Facial Care",
  "category": "FACIAL",
  "description": "Chăm sóc da mặt",
  "basePrice": 350000,
  "minimumDurationMinutes": 60,
  "isDurationAdjustable": true,
  "durationStepMinutes": 30,
  "pricePerDurationStep": 120000,
  "preparationBufferMinutes": 10,
  "cleanupBufferMinutes": 10
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Create service successfully",
  "data": {
    "id": 1,
    "name": "Facial Care",
    "isActive": true
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** Chỉ Account có quyền quản lý Service mới được tạo/sửa.
