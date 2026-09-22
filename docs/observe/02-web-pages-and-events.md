# SPA: route, trang và sự kiện người dùng

SPA khai báo bằng `BrowserRouter` trong `frontend/lunara/src/App.tsx`. Page được lazy-load; API client tự thêm Bearer token, refresh access token một lần khi nhận 401, rồi xoá token nếu vẫn 401. Access/refresh token được lưu cả `localStorage` lẫn cookie `SameSite=Lax` để có fallback.

## Route khách hàng

| Route | Điều kiện UI | Nội dung và event chính | API sử dụng |
| --- | --- | --- | --- |
| `/` | public | Landing: hero, catalogue, triết lý, review/FAQ; CTA đến booking/auth; mascot chat UI | `GET /api/services` qua `ServicesCollection` |
| `/auth` | public | Bấm “Tiếp tục với Google”; nếu đã có user thì redirect theo role | chuyển browser tới `/oauth2/authorization/google` |
| `/oauth2/redirect?code=` | public callback | Đổi one-time code lấy token, gọi `me`, đọc `oauth2_redirect_path` rồi redirect | `POST /api/auth/exchange`, `GET /api/auth/me` |
| `/booking` | cần đăng nhập để xác nhận | Chọn 1+ service, điều chỉnh duration nếu service cho phép, chọn hoặc auto-assign KTV, ngày/slot, note; cập nhật profile rồi tạo booking và payment QR | services/staff public, availability, profile, booking, payment |
| `/checkout?booking=CODE` | state hoặc query booking | Tải booking theo code, lấy/tạo QR payment khi cần, hiển thị QR/amount và dẫn ticket | booking detail, payment by booking/create |
| `/ticket/:id` | booking API xác minh ownership | Ticket, payment state, đổi lịch trước check-in, feedback sau completed | booking detail/reschedule, payment, feedback, public staff |

### Luồng booking trong UI

1. `BookingPage` tải catalog và staff directory; với ngày/service/KTV hiện chọn, gửi `POST /api/availability` trong cửa sổ 08:00–19:00.
2. Slot hiển thị khả dụng chỉ khi API trả `bookingStart` tương ứng. Khách phải login, có tên/số điện thoại, chọn slot và ít nhất một service.
3. Với `CUSTOMER`, UI cố `PUT /api/profile/me` trước (lỗi profile không chặn đặt lịch), rồi `POST /api/bookings`, kế tiếp `POST /api/payments` với `QR`.
4. Backend là nơi kiểm tra lần cuối giá/slot; nếu có race condition UI tải lại availability và báo lỗi.
5. Checkout dùng QR payload của payment; việc chuyển sang `PAID` không do client QR tự xác nhận mà bởi SePay webhook hoặc thao tác người có quyền.

## Route vận hành/quản trị

`/admin/login` là trang sign-in riêng. `/admin` dùng `AdminLayout`; `RequireAdminRoute` kiểm tra user và `ADMIN_ROUTE_ROLES`, redirect role không phù hợp về `ROLE_HOME`.

| Route | Role UI được phép | Trang và event |
| --- | --- | --- |
| `/admin/dashboard` | OWNER, MANAGER | KPI tổng quan, biểu đồ booking/revenue và lịch sắp tới |
| `/admin/live` | OWNER, MANAGER, RECEPTIONIST | bảng live, lọc trạng thái, reload booking |
| `/admin/booking` | OWNER, MANAGER, RECEPTIONIST | tìm/lọc booking, tạo walk-in, mở detail, assign KTV, đổi lịch, check-in, gửi lại email |
| `/admin/calendar` | OWNER, MANAGER, RECEPTIONIST | day/week/month; tạo appointment của lễ tân |
| `/admin/customers` | OWNER, MANAGER, RECEPTIONIST | search/list khách, tạo khách, sửa `internalNotes`/`preferences` |
| `/admin/staff` | OWNER, MANAGER | xem/tạo therapist, xem lịch, đổi working hours |
| `/admin/services` | OWNER, MANAGER | tạo/sửa service, bật/tắt active (UI gọi DELETE nhưng server toggle state) |
| `/admin/payments` | OWNER, MANAGER, RECEPTIONIST, ACCOUNTANT | danh sách payment, manual mark-paid/refund, xem và reconcile SePay `MANUAL_REVIEW` |
| `/admin/user-role` | OWNER, MANAGER | danh sách account, tạo account, đổi role, bật/tắt active |
| `/admin/reports` | OWNER, MANAGER, ACCOUNTANT | báo cáo theo DAY/WEEK/MONTH, refresh KPI/service |

`/admin` không có page riêng: nó redirect về home của role đã login, hoặc `/admin/login` nếu chưa có user. Bất kỳ URL SPA không match route nào redirect về `/`.

## Route therapist

| Route | Nội dung | Event |
| --- | --- | --- |
| `/staff/my-work` | task/booking được gán cho chính therapist; lọc trạng thái | “Bắt đầu” gọi start, “Hoàn tất” gọi complete |
| `/staff/calendar` | task theo ngày của therapist đăng nhập | điều hướng ngày trước/sau, reload tasks |

`/staff` redirect sang `/staff/my-work`. `/staff/*` hiện render `AdminLayout` nhưng không có guard React riêng. API `/api/staff/tasks/**` yêu cầu authority therapist, vì vậy route trực tiếp không cấp dữ liệu/thao tác trái quyền; nên bổ sung route guard nếu muốn UX nhất quán với `/admin/*`.

## Authentication và redirect

- Login mở backend OAuth endpoint, nơi Google chọn account; callback backend redirect browser đến `/oauth2/redirect?code=...`.
- Callback SPA exchange code lấy access/refresh JWT, sau đó `AuthProvider` chuẩn hóa account và role.
- Home role: owner/manager → dashboard; receptionist → live; accountant → payments; therapist → my-work; customer → booking.
- Logout gọi `/api/auth/logout`, rồi xoá localStorage/cookie dù request lỗi.

## Refresh: event từ server đến UI

Các trang booking, calendar, payment, live, staff task/calendar và availability đăng ký `useRefresh`.

- Browser mở `GET /api/events` với Bearer token, parse SSE event `refresh`.
- Mapping invalidation: booking → booking/task/notification; payment → payment/booking/notification; calendar → calendar/availability/booking/task.
- Khi SSE lỗi/không có event, polling vẫn chạy khi tab visible: payment 5s; booking/task/calendar 10s; notification 15s; availability 30s. Tab hidden dừng poll và khi visible sẽ reload ngay.

## Chức năng có mặt nhưng chưa nối end-to-end

- `MascotCompanion` và `AdminChatSidebar` là UI chat, nhưng API client SPA chưa gọi `/api/v1/chatbot/*` hoặc agent v0. Chúng không tạo cuộc hội thoại RAG thực tế trong implementation hiện tại.
- Profile API được dùng ngầm ở booking; chưa có route/trang profile chuyên dụng.
