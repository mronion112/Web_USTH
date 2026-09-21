# Dev login (tuỳ chọn, dạng patch)

Patch thêm đăng nhập giả để test luồng cần quyền (ví dụ nhân viên thu tiền)
mà không cần cấu hình Google OAuth. Không nằm trong code chính, chỉ áp khi cần.

## Nội dung

- Backend: `POST /dev/auth/login` nhận `{ "email", "roleCode" }`, tự tạo tài khoản
  ảo (kèm `customer_profiles` hoặc `staff_profiles`) và trả JWT.
- Chỉ hoạt động khi `APP_DEV_LOGIN_ENABLED=true` (`app.dev-login.enabled`).
  Mặc định `false`; bật ở production là lỗ hổng bảo mật vì không có mật khẩu.
- Frontend: trang `/dev-login` + link ở trang login admin, chỉ hiện khi
  `VITE_DEV_LOGIN=true`.

## Áp patch

```sh
git apply templates/dev-login/dev-login.patch
```

Rồi bật trong `templates/.env`:

```text
APP_DEV_LOGIN_ENABLED=true
VITE_DEV_LOGIN=true
```

Với frontend chạy dev trực tiếp (`npm run dev`), tạo `frontend/lunara/.env.local`:

```text
VITE_DEV_LOGIN=true
```

Khởi động lại stack:

```sh
make down-all && make up-app
```

## Dùng

Mở `http://localhost:5173/dev-login`, chọn email + role rồi đăng nhập.
Ví dụ để test thu tiền: role `RECEPTIONIST` hoặc `ACCOUNTANT`, sau đó vào
`/admin/payments` để xác nhận thanh toán.

## Gỡ patch

```sh
git apply -R templates/dev-login/dev-login.patch
```

hoặc `git checkout -- <đường-dẫn>` và xoá 2 file mới
`DevAuthController.java`, `DevLoginPage.tsx`.

## Kiểm chứng khi áp

- Backend: `./backend/mvnw -f backend/pom.xml test` (patch đã chạy qua 51 test local).
- Frontend: `cd frontend/lunara && npm run build`.
- Sau khi gỡ, không còn tham chiếu `dev-login` trong code.
