# Spa Service

## 1. Lấy danh sách gói dịch vụ

**Endpoint**

```text
/api/packages
```

**Method**

```text
GET
```

**Tables liên quan**

```text
spa_packages
```

**Mục đích**

Lấy danh sách các gói Spa đang hoạt động.

**Response JSON**

```json
{
  "success": true,
  "message": "Get packages successfully",
  "data": [
    {
      "id": 1,
      "name": "Massage thư giãn",
      "description": "Massage toàn thân",
      "price": 300000,
      "durationMinutes": 60,
      "isActive": true
    }
  ],
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 2. Lấy chi tiết gói dịch vụ

**Endpoint**

```text
/api/packages/{id}
```

**Method**

```text
GET
```

**Tables liên quan**

```text
spa_packages
```

**Response JSON**

```json
{
  "success": true,
  "message": "Get package successfully",
  "data": {
    "id": 1,
    "name": "Massage thư giãn",
    "description": "Massage toàn thân",
    "price": 300000,
    "durationMinutes": 60,
    "isActive": true
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

---

## 3. Tạo gói dịch vụ

**Endpoint**

```text
/api/manager/packages
```

**Method**

```text
POST
```

**Tables liên quan**

```text
spa_packages
```

**Request JSON**

```json
{
  "name": "Massage thư giãn",
  "description": "Massage toàn thân",
  "price": 300000,
  "durationMinutes": 60
}
```

**Response JSON**

```json
{
  "success": true,
  "message": "Package created successfully",
  "data": {
    "id": 1,
    "name": "Massage thư giãn",
    "price": 300000,
    "durationMinutes": 60,
    "isActive": true
  },
  "timestamp": "2026-09-20T10:00:00"
}
```

**Quy tắc chính:** Chỉ MANAGER được tạo / sửa package.
