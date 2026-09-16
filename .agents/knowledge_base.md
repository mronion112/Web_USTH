# Tổng hợp Kiến thức & Quyết định Kỹ thuật (Knowledge Base)

Tài liệu này tập hợp lại toàn bộ các kiến thức, câu hỏi, và các quyết định thiết kế kỹ thuật mà team đã thảo luận và thống nhất tính đến hiện tại.

## 1. Triết lý Clean Code & Javadoc
- **Không viết Javadoc dư thừa:** Các DTO, hàm getter/setter, hoặc các hàm có tên tự giải thích (self-explanatory) như `badRequest()` không cần Javadoc. Chỉ giữ lại Javadoc cho các hàm có logic nghiệp vụ phức tạp.
- **Controller siêu mỏng (Thin Controller):** Controller chỉ làm nhiệm vụ nhận request và trả response, thường chỉ kéo dài 1-2 dòng code. Mọi logic phức tạp, bóc tách token, lấy user đều đẩy xuống Service hoặc Filter/SecurityUtils.

## 2. Quản lý Cấu hình (Configuration Management)
- **Không Hardcode:** Các thông số nhạy cảm và thay đổi theo môi trường như JWT Secret Key, Expiration Time tuyệt đối không hardcode trong class (`JwtUtils`).
- **Sử dụng `application.yml`:** Khai báo bằng `@Value("${app.jwt.secret}")` để linh hoạt thay đổi thời gian sống của token giữa môi trường Dev (vài tuần) và Prod (15 phút).

## 3. Kiến trúc Phân Quyền (Authorization Architecture)
Khác với các hệ thống cơ bản dùng `@PreAuthorize("hasRole('ADMIN')")`, hệ thống Lunara Spa được thiết kế theo mô hình **Phân Quyền Động tại Cổng (Dynamic Gateway Authorization)**, lấy cảm hứng từ cấu trúc API Gateway.

### Nhược điểm của cách cũ (Spring Security Default)
- Hardcode logic quyền ngay trên Controller. Sửa quyền -> Phải sửa code -> Deploy lại.
- Dễ sinh ra lỗ hổng nếu dev quên gắn annotation ở API mới.
- Vi phạm Single Responsibility Principle (SRP).

### Giải pháp áp dụng: Dynamic Authorization Manager
Sử dụng bộ 3 thành phần để tước toàn quyền quyết định từ tay Controller giao cho một "Bảo vệ" đứng ở cổng (Filter).

1. **`CustomUserDetails`**: Bọc lại thông tin user từ token. Khắc phục nhược điểm của class `User` mặc định trong Spring, giúp dễ dàng truy xuất Email, Role mà không cần query lại DB. Lấy trực tiếp thông qua `SecurityUtils.getCurrentUserEmail()`.
2. **`ApiPermissionRegistry` (Sổ tay bảo vệ)**: Nơi map cố định (bằng code) các đường dẫn API (`POST /api/v1/services`) với mã nghiệp vụ (`CREATE_SERVICE`).
3. **`CustomAuthorizationManager` (Bảo vệ)**: Bắt toàn bộ Request đi vào, bóc lấy URI, dịch ra mã quyền tương ứng, sau đó đối chiếu với thông tin Role của user trong CSDL (qua `RolePermissionService`). Trả về `true` (cho qua) hoặc `false` (đá văng 403).

### Tại sao không thiết kế giống hệt `api-gateway` cũ?
- Hệ thống `api-gateway` cũ phải phục vụ mô hình cực lớn: duyệt phân cấp nhóm (Breadth-First Search), kiểm tra xung đột phân quyền, và dùng Regex duyệt qua hàng ngàn mẫu cấu hình URL trong CSDL để khớp API.
- Đối với Lunara Spa (Monolith), mô hình này là quá cồng kềnh (Over-engineering).
- Giải pháp chốt: Chọn "Cách 2" - Sử dụng **ApiPermissionRegistry**. Việc tách URL ra khỏi DB và lưu mã quyền (`CREATE_SERVICE`) giúp UI trang Quản trị thân thiện hơn, xử lý đường dẫn biến động (Path Variable) dễ dàng, và tốc độ xử lý nhanh hơn 10 lần so với duyệt Regex dưới DB.
