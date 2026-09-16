# Security Architecture & Dynamic RBAC Design

Tài liệu này lưu trữ thiết kế kiến trúc bảo mật cốt lõi của dự án Lunara Spa, giải thích các quyết định thiết kế (Architecture Decisions) giúp hệ thống đạt chuẩn Enterprise, linh hoạt và dễ mở rộng.

## 1. Vấn đề của mô hình phân quyền truyền thống (Spring Security Default)

Trong mô hình chuẩn của Spring Security, lập trình viên thường sử dụng Annotation `@PreAuthorize("hasRole('...')")` tại tầng Controller.

**Nhược điểm:**
- **Hardcode (Mã hoá cứng):** Logic phân quyền bị gắn chặt vào code compile. Muốn đổi quyền phải sửa code và deploy lại.
- **Vi phạm SRP (Single Responsibility Principle):** Controller bị gánh thêm logic kiểm tra quyền, làm bẩn source code.
- **Rủi ro bảo mật:** Rất dễ quên gắn Annotation trên các endpoint mới, dẫn đến rò rỉ (leak) data hoặc chức năng phân quyền.

## 2. Giải pháp: Dynamic Authorization Gateway

Để giải quyết vấn đề trên, dự án áp dụng mô hình phân quyền qua cổng động (Dynamic Authorization Manager). Thiết kế này được hiện thực hoá qua 3 class chính:
- `SecurityConfig`: Đăng ký `.anyRequest().access(customAuthorizationManager)`.
- `CustomAuthorizationManager`: Component độc lập chịu trách nhiệm quyết định mọi HTTP Request có được truy cập hay không dựa vào URI.
- `CustomUserDetails`: Bọc (Wrapper) đối tượng User mặc định để linh hoạt truy xuất ID, Role, Email thay vì bị bó hẹp trong format của Spring Security.

### 2.1. Flow hoạt động

1. **Request Interception:** Mọi request đều bị chặn lại ở tầng Filter cuối cùng của Spring Security trước khi chạm tới Controller.
2. **Identity Extraction:** `CustomAuthorizationManager` trích xuất `URI` (VD: `/api/v1/bookings`) và bóc `CustomUserDetails` từ `SecurityContext`.
3. **Dynamic Rule Evaluation:** 
   - Hệ thống không kiểm tra cứng bằng chữ `hasRole`.
   - Hệ thống tiến hành dò tìm trên Cache (Redis) hoặc Database: "User với Role X có được quyền gọi tới URI Y hay không?".
4. **Decision:** Trả về `AuthorizationDecision(true/false)`.

### 2.2. Lợi ích (Best Practices)

- **Real-time Configuration:** Quyền (Permissions) hoàn toàn có thể được cấu hình trên giao diện Web Admin. Quản trị viên tick/untick quyền cho một Role, DB cập nhật, và hệ thống tự động chặn/mở ngay lập tức cho các request tiếp theo mà không cần chạm vào 1 dòng code nào.
- **Controller Sạch 100%:** Dev backend tập trung hoàn toàn vào nghiệp vụ (Business Logic). Không tồn tại bất kỳ annotation security nào trên controller.
- **Bảo mật tuyệt đối (Fail-Closed):** Mọi request không được định nghĩa rõ ràng quyền trong DB sẽ bị chặn từ vòng ngoài. Tránh triệt để lỗi "quên" gắn quyền.
- **Microservices Ready:** Tư tưởng tập trung luồng xác thực này giống hệt API Gateway. Dễ dàng chia tách dự án monolith này thành các service nhỏ trong tương lai.

## 3. Quản lý Config & Token (JwtUtils)

- **Zero Hardcode:** Toàn bộ Secret Key, Expiration Time cho Access/Refresh Token được xuất ra `application.yml`.
- **Environment Separation:** Dễ dàng cấu hình thời gian sống token khác nhau cho môi trường Dev (vài tuần để dễ test) và Prod (15 phút để bảo mật). 

## Kết luận

Kiến trúc này đòi hỏi chi phí setup ban đầu (overhead) lớn hơn cách thông thường, nhưng triệt tiêu hoàn toàn Technical Debt (nợ kỹ thuật) liên quan đến quản lý quyền hạn khi dự án phình to thành hàng trăm API.
