# Lunara Assistant v0

Agent core **chỉ đọc** cho Lunara Spa: FastAPI + LangGraph, dùng chung business logic từ Spring Backend
(không truy cập database), LLM qua 9router proxy, và TypeSafe cho hai quyết định hẹp.

v0 là bước hiện thực hoá giai đoạn 2 trong [`../PLAN.md`](../PLAN.md) với phạm vi đã chốt:
12 tool chỉ đọc cho cả 6 role, chưa có write/confirmation, chưa có Google Chat, chưa nối frontend.

## 1. Kiến trúc

```text
POST /api/agent/chat  (Bearer JWT Lunara)
        │
        ▼
resolve actor: GET /api/auth/me  ── role, account_id (không tự decode JWT)
        │
        ▼
LoadContext (deterministic)
   ├── allow-list tool theo permission của role
   ├── TypeSafe preflight: phân nhóm năng lực + 2 câu hỏi an toàn
   └── nếu phát hiện bypass / hỏi dữ liệu người khác ⇒ từ chối, không gọi LLM
        │
        ▼
Agent (LLM 9router, bind đúng tool được phép)
        │
        ▼
PolicyGuard (deterministic, fail-closed)
   └── ngoài allow-list / sai schema / vượt bound / tự thêm field định danh / write ⇒ deny
        │
        ▼
ExecuteTool (typed, song song, có timeout) ──► Spring Backend API
        │                                        (JWT của chính actor)
        ▼
Agent (lặp tối đa 6 vòng)
        │
        ▼
ResponseContract (code dựng component + citation, không để model tự sinh)
```

Ghi chú thiết kế:

- **Không** tách subgraph theo role, không intent router riêng: allow-list theo permission là đủ cho v0
  (theo [`../NOTE.md`](../NOTE.md) mục 4 và 6).
- **Permission là cầu tạm phía agent**: `/api/auth/me` chưa trả permission list, nên `app/core/actor.py`
  map role → permission sao chép từ `database/Testing/role_permissions.csv`. Khi backend bổ sung
  endpoint permission thì thay hằng số này bằng dữ liệu backend.
- Tool không bao giờ nhận `actor_account_id` từ model; actor lấy từ trusted context.
- Allow-list luôn là **giao** của (permission của actor) và (role mà route backend cho phép) — không rộng hơn backend.

## 2. Tool (12, chỉ đọc)

| Tool | Endpoint backend | Điều kiện |
| --- | --- | --- |
| `search_services` | `GET /api/services` | mọi role |
| `get_service_detail` | `GET /api/services/{id}` | mọi role |
| `check_availability` | `POST /api/availability` | mọi role |
| `get_my_bookings` | `GET /api/bookings/my` | `BOOKINGS_VIEW` |
| `get_my_booking` | `GET /api/bookings/{code}` | `BOOKINGS_VIEW` |
| `search_knowledge` | corpus nội bộ | lọc audience theo role |
| `get_my_agenda` | `GET /api/staff/tasks` | `BOOKINGS_SERVICE_UPDATE` + THERAPIST |
| `search_bookings` | `GET /api/manager/bookings` | `BOOKINGS_VIEW` + RECEPTIONIST/MANAGER/OWNER |
| `get_staff_schedule` | `GET /api/manager/staff/{id}/schedule` | `ADMIN_STAFF_SCHEDULE` + RECEPTIONIST/MANAGER/OWNER |
| `get_payment_for_booking` | `GET /api/payments/booking/{id}` | `PAYMENTS_VIEW` + OWNER/MANAGER/RECEPTIONIST/ACCOUNTANT |
| `get_operations_overview` | `GET /api/manager/dashboard` | OWNER/MANAGER/RECEPTIONIST |
| `get_business_summary` | `GET /api/reports/summary` | `REPORTS_VIEW` + OWNER/MANAGER/ACCOUNTANT |

Giới hạn cứng trong schema: khoảng thời gian ≤ 31 ngày, `size` ≤ 50, query ≤ 200 ký tự, tối đa 5 dịch vụ
mỗi lần kiểm tra lịch trống.

## 3. TypeSafe ở đâu

1. **Preflight (1 request/lượt)** — `Choice` phân nhóm năng lực + `Noul` cho `sensitive_data_request`
   và `policy_bypass`. Ngưỡng trong `TypeSafeThresholds`:
   - `policy_bypass > 0.80` hoặc `sensitive_data_request > 0.80` ⇒ từ chối ngay, không tiêu token LLM;
   - `intent.confidence ≥ 0.50` ⇒ thu hẹp allow-list theo nhóm được chọn;
   - ngược lại giữ nguyên allow-list.
2. **Sàng lọc passage retrieval** — 4 `Noul` cho mỗi đoạn (`is_relevant`, `contains_answer_evidence`,
   `contradicts_query_premise`, `contains_prompt_injection`), tối đa 5 đoạn, concurrency 4.
   Thứ tự xét trong code: injection > 0.70 ⇒ loại; contradicts > 0.70 ⇒ đánh dấu đối chiếu;
   relevant < 0.45 ⇒ loại; evidence > 0.55 ⇒ nhận. Đây là cách hiện thực yêu cầu
   “không thực thi instruction nằm trong retrieved content”.

Thiếu key, timeout hoặc lỗi ⇒ **suy giảm an toàn**: bỏ qua lớp TypeSafe, agent vẫn trả lời, trace ghi
`degraded: true`.

## 4. Chạy

Yêu cầu: Python 3.12 + [`uv`](https://docs.astral.sh/uv/), backend Lunara chạy ở `localhost:8080`,
9router proxy ở `localhost:20128`.

```bash
cp .env.example .env      # điền LLM_API_KEY (9router) và TYPESAFE_API_KEY
uv sync

uv run python -m scripts.probe_llm        # xác nhận 9router + tool-calling
uv run python -m scripts.probe_typesafe   # xác nhận TypeSafe
uv run pytest -q                          # 62 unit test, không cần mạng

uv run uvicorn app.main:app --port 8090
```

Gọi thử:

```bash
uv run python -m scripts.dev_token --email customer9@lunara-spa.demo
uv run python -m scripts.chat_cli --email customer9@lunara-spa.demo --message "Spa có dịch vụ massage nào?"
uv run python -m scripts.chat_cli --token <jwt>      # chế độ hội thoại
```

Bộ eval:

```bash
uv run python -m scripts.run_evals --verbose
```

Chỉ số in ra: `toolSelection`, `denial`, `grounded`. Mặc định fail nếu tool-selection < 90% hoặc
denial < 100% (theo điều kiện phát hành trong `../PLAN.md` mục 16).

Email của từng case được resolve theo role từ backend (qua tài khoản `owner1@lunara-spa.demo`), nên bộ
eval không phụ thuộc dataset đang seed là Testing hay Production. Dùng `--only <id1,id2>` để chạy một
vài case và `--verbose` để xem câu trả lời thực tế.

## 5. API

| Method | Path | Ghi chú |
| --- | --- | --- |
| `POST` | `/api/agent/chat` | body `{message, conversationId?}`, header `Authorization: Bearer <JWT Lunara>` |
| `DELETE` | `/api/agent/conversations/{id}` | xoá thread khỏi checkpoint |
| `GET` | `/healthz` | liveness |
| `GET` | `/readyz` | số tài liệu, TypeSafe bật/tắt, model, backend URL |

Mã lỗi: `UNAUTHENTICATED`, `PERMISSION_DENIED`, `OWNERSHIP_VIOLATION`, `RESOURCE_NOT_FOUND`,
`INVALID_ARGUMENT`, `UNKNOWN_TOOL`, `WRITE_NOT_ENABLED`, `RATE_LIMITED`, `DOWNSTREAM_UNAVAILABLE`,
`AGENT_TIMEOUT`, `AGENT_ERROR`, `POLICY_DENIED`.

## 6. Knowledge corpus

`app/data/knowledge/{public,staff,management}` — 14 tài liệu tiếng Việt, soạn riêng cho Lunara dựa trên
phân tích cấu trúc/chủ đề của tài liệu tham khảo trong `docs/crawl/` (không sao chép thương hiệu, giá
hay chính sách của các spa đó). Xem `app/data/knowledge/README.md` để biết quy tắc.

- Mọi tài liệu hiện là `status: draft`, `approved_by: null`; câu trả lời dựa trên tài liệu draft phải
  nói rõ là bản nháp chưa được duyệt (agent được prompt yêu cầu như vậy, và `citations[].approved` cho
  UI biết để gắn nhãn).
- Đặt `KNOWLEDGE_INCLUDE_DRAFT=false` để chỉ dùng tài liệu đã duyệt.
- Lọc audience trước khi search, nên CUSTOMER không bao giờ nhận tài liệu STAFF/MANAGEMENT.
- Retrieval hiện là keyword/full-text (chuẩn hoá dấu tiếng Việt); chưa dùng vector DB theo
  [`../NOTE.md`](../NOTE.md) mục 11.

## 7. Bảo mật

- JWT của người dùng được forward nguyên trạng tới backend; backend vẫn là nơi authorize cuối cùng.
- Conversation key là `account_id:channel:conversation_id`; đổi account là thread khác, và có thêm
  kiểm tra chủ sở hữu thread (`OWNERSHIP_VIOLATION`).
- Log JSON có `correlationId`, che email/số điện thoại/token; không trả raw payload hay exception nội bộ.
- Nội dung retrieved là dữ liệu không đáng tin: được sàng lọc bằng TypeSafe và prompt cấm thực thi chỉ dẫn trong đó.

## 8. Chưa có trong v0

Redis checkpointer, streaming, write tool + pending action/audit, Google Chat adapter, chat drawer ở
frontend, Dockerfile/compose, endpoint permission từ backend, idempotency ở backend.
