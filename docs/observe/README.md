# Quan sát hệ thống Lunara Spa

Bộ tài liệu này mô tả **hành vi đang được hiện thực trong mã nguồn** của workspace, khảo sát ngày 2026-09-21. Đây không phải đặc tả sản phẩm dự kiến: khi tài liệu khác với mã, mã nguồn và schema runtime là nguồn đúng hơn.

## Thành phần

| Thành phần | Công nghệ | Vai trò | Điểm vào |
| --- | --- | --- | --- |
| Web khách hàng và vận hành | React 19, TypeScript, Vite | Một SPA cho khách, nhân viên và khối quản trị | `frontend/lunara/src/App.tsx` |
| API nghiệp vụ | Spring Boot 4, Java 21 | OAuth/JWT, đặt lịch, thanh toán, vận hành và SSE | `backend/src/main/java/com/kevin/lunaraspa` |
| Cơ sở dữ liệu | MySQL 8.4 | Nguồn dữ liệu nghiệp vụ quan hệ | `database/Web_DataBase_USTH.sql` |
| Đồng bộ thời gian thực | Kafka → SSE | Báo client tải lại dữ liệu khi nghiệp vụ đổi | `backend/.../realtime` |
| Chatbot RAG | Spring API + Gemini + Chroma | Hỏi đáp dựa trên Markdown trong `docs/` | `backend/.../chatbot` |
| Agent độc lập v0 | FastAPI + LangGraph | Trợ lý chỉ đọc, gọi lại Spring API bằng JWT của người dùng | `agent/v0` |

## Đọc theo nhu cầu

1. [01-architecture.md](01-architecture.md) — sơ đồ hệ thống, ranh giới và trạng thái vòng đời.
2. [02-web-pages-and-events.md](02-web-pages-and-events.md) — route SPA, từng trang và thao tác người dùng.
3. [03-api-roles-and-permissions.md](03-api-roles-and-permissions.md) — API, xác thực và quyền thực thi.
4. [04-events-integrations.md](04-events-integrations.md) — payment, email, Kafka/SSE, chatbot và các dịch vụ ngoài.
5. [05-data-and-operations.md](05-data-and-operations.md) — dữ liệu, môi trường chạy, cấu hình và vận hành.
6. [06-agent-v0.md](06-agent-v0.md) — API/giới hạn của agent; hiện chưa nối với SPA.

## Quy ước

- Mọi API Spring trả envelope `{ success, status, message, data }` (trừ webhook SePay và chatbot có contract riêng).
- Thời gian nghiệp vụ dùng `Asia/Ho_Chi_Minh`; client hiển thị nhiều giá trị theo múi giờ này.
- `OWNER`, `MANAGER`, `RECEPTIONIST`, `THERAPIST`, `ACCOUNTANT`, `CUSTOMER` là sáu role chuẩn.
- “Public” nghĩa là không cần JWT theo security chain hiện tại, không đồng nghĩa dữ liệu không cần kiểm soát CORS.

## Ranh giới quan sát được

- SPA chỉ gọi API Spring ở `VITE_API_URL` (mặc định `http://localhost:8080`); nó chưa gọi agent v0 hay endpoint chatbot RAG.
- Tài liệu crawled trong `docs/crawl/` là nguồn cho chatbot RAG; không phải dữ liệu dịch vụ/booking chính của Lunara.
- Chức năng UI có thể bị giấu theo role, nhưng backend là điểm cưỡng chế quyền cuối cùng. Route `/staff/*` hiện không có wrapper React `RequireAdminRoute`; backend vẫn chặn API của therapist.
- `ApiPermissionRegistry` chỉ đăng ký một số permission code. Phần lớn endpoint hiện dùng kiểm tra authority theo role trong các security chain/controller; bảng `permissions` vẫn là model dữ liệu và được agent v0 dùng như một cầu tạm.
