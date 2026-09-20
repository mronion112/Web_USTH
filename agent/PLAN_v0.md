# Lunara Assistant

### 1. Thiết kế

Dùng trên giao diện web và Google Chat -&gt; 1 Agent core phục vụ cross platform

- Xác thực channel &amp; xác định tài khoản trên hệ thống Lunara (Customer/Manager/Staff)
- Gán permission, chỉ được dùng các tools được phép
- Agent node hiểu yêu cầu, hỏi thêm dữ liệu nếu nếu -&gt; tự định tuyến tools
- Guardrail
- Human in the loop
- Tool truy vấn qua api, ko thao tác vào DB
- schema output riêng cho webchat và Google chat

### 2. Mục tiêu

- Trả lời câu hỏi về dịch vụ, giá, thời lượng, chính sách và FAQ của Lunara.
- Cho Customer tìm lịch trống, tạo và xem booking của chính họ.
- Cho KTV xem việc được giao, bắt đầu và hoàn thành dịch vụ.
- Cho KTV/Manager/Owner theo dõi vận hành và thực hiện action đúng quyền.
- Cho Accountant/Manager/Owner đọc thông tin payment/report đúng quyền.
- Dùng chung business logic giữa Web và Google Chat.



