# Lunara Assistant v0 (dịch vụ độc lập)

`agent/v0` là FastAPI service thử nghiệm/độc lập, không được Docker Compose khởi động và chưa có frontend client. Nó khác với chatbot RAG Spring: agent có JWT người dùng, gọi API nghiệp vụ thật và chỉ có tool **read-only**.

## Entry points

| Method | Path | Mô tả |
| --- | --- | --- |
| POST | `/api/agent/chat` | body `{message, conversationId?}`; bắt buộc `Authorization: Bearer <Lunara JWT>` |
| DELETE | `/api/agent/conversations/{id}` | xóa checkpoint cuộc hội thoại chỉ của owner hiện tại |
| GET | `/healthz` | liveness và env |
| GET | `/readyz` | số tài liệu knowledge, TypeSafe enabled, LLM model, backend URL |

Mỗi request có/nhận `X-Correlation-Id`; error trả `{success:false,error:{code,message},correlationId}` với mapping HTTP 400/401/403/404/429/503/504/500.

## Luồng xử lý

```text
JWT browser → resolve actor bằng GET Spring /api/auth/me
  → actor role + permission allow-list
  → TypeSafe preflight (intent/sensitive/bypass)
  → LangGraph LLM với tool đã lọc
  → PolicyGuard fail-closed
  → Spring REST bằng JWT của actor
  → typed response/citation/component contract
```

Agent không tự decode JWT để quyết định identity, không cho model cung cấp `actor_account_id`, giới hạn 6 vòng tool/turn và tool schema áp size/range/query bounds. Conversation được scope `account_id:channel:conversation_id`; đổi tài khoản không truy cập được thread cũ.

## 12 tool hiện có

| Nhóm | Tool | Backend/nguồn |
| --- | --- | --- |
| Catalogue | `search_services`, `get_service_detail` | `/api/services`, `/api/services/{id}` |
| Availability | `check_availability` | `POST /api/availability` |
| Booking cá nhân | `get_my_bookings`, `get_my_booking` | `/api/bookings/my`, `/api/bookings/{code}` |
| Knowledge | `search_knowledge` | corpus `app/data/knowledge`, lọc audience |
| Therapist | `get_my_agenda` | `/api/staff/tasks` |
| Operations | `search_bookings`, `get_staff_schedule`, `get_operations_overview` | manager booking/schedule/dashboard |
| Finance | `get_payment_for_booking`, `get_business_summary` | payment/report |

Allow-list là giao của permission role (tạm map từ CSV vì `/api/auth/me` chưa trả permission) và backend role restriction. `PolicyGuard` chặn tool không đăng ký, input sai schema/ownership, fields định danh do model tự thêm và mọi write operation.

## LLM/knowledge safety

- LLM đi qua 9router proxy; TypeSafe đánh giá intent và guard sensitive-data/policy-bypass. Khi TypeSafe key/timeout lỗi, service degrade an toàn: vẫn có thể trả lời nhưng trace ghi `degraded`.
- Corpus nội bộ chia public/staff/management. Tài liệu draft phải được nói rõ là chưa duyệt; customer không nhận staff/management document.
- Retrieval hiện keyword/full-text, không dùng Chroma. Đây là lý do nó không cùng implementation với Spring chatbot RAG.

## Chạy và giới hạn

Yêu cầu Python 3.12, `uv`, Spring backend ở 8080 và 9router (mặc định 20128):

```sh
cd agent/v0
cp .env.example .env
uv sync
uv run uvicorn app.main:app --port 8090
```

Chưa có write/confirmation/audit action, streaming, Redis checkpointer, Google Chat adapter, frontend drawer integration, Dockerfile hoặc Compose service. Vì vậy không dùng service này để thay thế workflow booking/payment; nó chỉ hỗ trợ đọc/tra cứu có kiểm soát.
