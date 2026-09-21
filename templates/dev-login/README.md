# Dev login (tuỳ chọn, dạng patch)

Patch thêm đăng nhập giả để test luồng cần quyền (ví dụ nhân viên thu tiền)
mà không cần cấu hình Google OAuth. Không nằm trong code chính, chỉ áp khi cần.

## TL;DR

```sh
git apply templates/dev-login/dev-login.patch
# templates/.env: APP_DEV_LOGIN_ENABLED=true, VITE_DEV_LOGIN=true
make down-all && make up-app
# mở http://localhost:5173/dev-login
```

Gỡ: `git apply -R templates/dev-login/dev-login.patch`.
Quy trình chỉ 3 bước, không phức tạp; khó nhất là nhớ gỡ trước khi push,
nên đã có guard tự chặn (xem bên dưới).

## Nội dung patch

- Backend: `POST /dev/auth/login` nhận `{ "email", "roleCode" }`, tự tạo tài khoản
  ảo (kèm `customer_profiles` hoặc `staff_profiles`) và trả JWT.
- Chỉ hoạt động khi `APP_DEV_LOGIN_ENABLED=true` (`app.dev-login.enabled`).
  Mặc định `false`; bật ở production là lỗ hổng bảo mật vì không có mật khẩu.
- Frontend: trang `/dev-login` + link ở trang login admin, chỉ hiện khi
  `VITE_DEV_LOGIN=true`.
- Hai file mới mang marker `DEV_LOGIN_PATCH_MARKER` để guard nhận diện.

## Guard chống push nhầm

- CI job `dev-login-guard` chạy trên mọi push/PR: fail nếu thấy dấu vết patch
  trong `backend/src`, `frontend/lunara/src` hoặc các file config hạ tầng.
- Local: `make verify-no-dev-login` kiểm tra tương tự, kể cả file chưa add.
- Nếu guard fail: `git apply -R templates/dev-login/dev-login.patch`.

## Bật cấu hình

Sửa `templates/.env`:

```text
APP_DEV_LOGIN_ENABLED=true
VITE_DEV_LOGIN=true
```

Frontend chạy dev trực tiếp (`npm run dev`) cần `frontend/lunara/.env.local`:

```text
VITE_DEV_LOGIN=true
```

Khởi động lại stack:

```sh
make down-all && make up-app
```

## Dùng

Mở `http://localhost:5173/dev-login`, chọn email + role rồi đăng nhập.
Ví dụ test thu tiền: role `RECEPTIONIST` hoặc `ACCOUNTANT`, sau đó vào
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
- Guard: `make verify-no-dev-login` phải fail khi patch còn áp, pass khi đã gỡ.
