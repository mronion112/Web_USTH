# Dev login (tuỳ chọn, dạng patch)

Patch thêm đăng nhập giả để test luồng cần quyền (ví dụ nhân viên thu tiền)
mà không cần cấu hình Google OAuth. Không nằm trong code chính, chỉ áp khi cần.

## TL;DR

```sh
make dev-login-on    # áp patch + bật biến + nạp dataset Testing + build lại full stack
# mở http://localhost:5173/dev-login
make dev-login-off   # gỡ patch + tắt biến + build lại full stack
```

Quy trình chỉ 2 lệnh make, không phức tạp. Guard tự chặn nếu quên gỡ trước khi push.

`make dev-login-on` nạp sẵn dataset `Testing` vì bảng `roles` là dữ liệu tham chiếu
(`Web_DataBase_USTH.sql` chỉ có DDL). Không nạp thì dev-login báo `Required role not found`
hoặc `Account not found`.

## Nội dung patch

- Backend: `POST /dev/auth/login` nhận `{ "email", "roleCode" }`, tự tạo tài khoản
  ảo (kèm `customer_profiles` hoặc `staff_profiles`) và trả JWT.
- Chỉ hoạt động khi `APP_DEV_LOGIN_ENABLED=true` (`app.dev-login.enabled`).
  Mặc định `false`; bật ở production là lỗ hổng bảo mật vì không có mật khẩu.
- Frontend: trang `/dev-login` + link ở trang login admin, chỉ hiện khi
  `VITE_DEV_LOGIN=true`.
- `DevSecurityConfig` mở riêng `/dev/**` bằng một `SecurityFilterChain` (`@Order(-1)`)
  nên **không sửa `SecurityConfig`** — giảm lệch khi upstream đổi authz.
- Ba file mới mang marker `DEV_LOGIN_PATCH_MARKER` để guard nhận diện.

## Sau khi áp patch có tự chạy không?

Không. Patch chỉ sửa mã nguồn + config mẫu, không tự có hiệu lực. Bắt buộc build/khởi động lại:

- Docker (khuyến nghị): `make up-app`. Lệnh `make dev-login-on` đã bao gồm bước này.
- Backend chạy bằng `spring-boot:run`/IDE: dừng và chạy lại để biên dịch lại (có file Java mới).
- Frontend chạy `npm run dev`: tạo `frontend/lunara/.env.local` với `VITE_DEV_LOGIN=true`,
  rồi khởi động lại dev server.

Lý do: backend cần compile lại; `VITE_*` được Vite nhúng vào bundle **lúc build/start**,
không đọc lại khi đang chạy. Vì vậy đổi cờ phải build lại, `make up-app` làm cả hai.

Sau khi `make dev-login-off`, cũng nên `make up-app` để image không còn chứa endpoint dev.

## Guard chống push nhầm

- CI job `dev-login-guard` chạy trên mọi push/PR: fail nếu thấy dấu vết patch
  trong `backend/src`, `frontend/lunara/src` hoặc các file config hạ tầng.
- Local: `make verify-no-dev-login` kiểm tra tương tự, kể cả file chưa add.
- Nếu guard fail: `make dev-login-off` (hoặc `git apply -R templates/dev-login/dev-login.patch`).

## Patch lệch khi main đổi

Patch được sinh bằng `git diff -U1` để ít lệch, nhưng upstream vẫn có thể sửa
`application.yml` hoặc `App.tsx` làm patch không áp được nữa.

- Local: `make verify-dev-login-patch` fail nếu patch không còn `git apply --check` được,
  hoặc nếu patch đụng file ngoài danh sách cho phép (không được chạm `Makefile`,
  `.github/`, `database/`...).
- CI: job `dev-login-patch-guard` chạy mọi push/PR, fail khi patch lệch.
- Khi fail: tái tạo patch theo hướng dẫn bên dưới, rồi commit lại.

## Lệnh make

| Lệnh                    | Việc làm                                                        |
| ----------------------- | --------------------------------------------------------------- |
| `make dev-login-on`     | Áp patch, set biến `true`, nạp dataset Testing, chạy `up-app`     |
| `make dev-login-off`    | Gỡ patch, set biến `false`, chạy `up-app`                         |
| `make dev-login-apply`  | Chỉ áp patch (idempotent)                                        |
| `make dev-login-revert` | Chỉ gỡ patch (idempotent)                                        |
| `make dev-login-env-on` | Chỉ set `APP_DEV_LOGIN_ENABLED=true`, `VITE_DEV_LOGIN=true`        |
| `make dev-login-env-off`| Chỉ set hai biến về `false`                                       |

Các lệnh `*-env-*` sửa trực tiếp `templates/.env` (file local, không commit).
Nếu chưa có `templates/.env`, chạy `cp templates/.env.example templates/.env` trước.

## Bật cấu hình thủ công (nếu không dùng make)

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

## Tái tạo patch khi lệch

1. Áp các file còn khớp từ patch cũ, rồi chỉnh tay các file bị lệch theo nội dung mới của `main`.
2. Sinh lại patch, giới hạn đúng 10 đường dẫn của patch:
   ```sh
   git diff -U1 -- <10 đường-dẫn> > templates/dev-login/dev-login.patch
   ```
3. Kiểm chứng: `make verify-dev-login-patch` pass; áp patch rồi `mvn test` và `npm run build`.
4. Commit lại patch.

## Kiểm chứng khi áp

- Backend: `./backend/mvnw -f backend/pom.xml test` (patch đã chạy qua 51 test local).
- Frontend: `cd frontend/lunara && npm run build`.
- Guard: `make verify-no-dev-login` phải fail khi patch còn áp, pass khi đã gỡ.
