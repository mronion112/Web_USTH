# Kế hoạch triển khai Lunara Assistant

## 1. Mục tiêu

- Xây dựng một agent core dùng chung cho Web Chat và Google Chat.
- Hỗ trợ tra cứu dịch vụ, chính sách, lịch trống, booking, lịch làm việc và vận hành spa.
- Áp dụng đúng RBAC, ownership, confirmation và audit cho mọi channel.
- Tái sử dụng nghiệp vụ từ Spring Backend; không truy cập database trực tiếp từ agent.
- Hoàn thành Web MVP trước, mở Google Chat sau khi ổn định tool, permission và write workflow.

## 2. Quyết định kiến trúc

- Sử dụng Python, FastAPI và LangGraph cho Agent API.
- Sử dụng một graph tool-calling; chưa tách Customer, Staff và Manager subgraph.
- Sử dụng permission-based tool allow-list; không route cứng theo role.
- Giữ `LoadContext`, `Agent`, `PolicyGuard`, `ConfirmAction`, `ExecuteTool` và `ResponseContract`.
- Loại bỏ Intent Router, Role Router và DeepAgents middleware khỏi MVP.
- Đặt toàn bộ business rule, transaction và authorization cuối tại Spring Backend.
- Sử dụng Redis cho checkpoint ngắn hạn, rate limit và ephemeral deduplication.
- Lưu pending action, audit và write idempotency bằng storage bền vững.
- Tách dữ liệu realtime khỏi knowledge base:
  - Service, giá, duration, booking và payment từ Backend API.
  - Policy, FAQ và SOP từ nội dung Lunara đã phê duyệt.
- Render Web component và Google Chat card tại channel adapter, không tại tool.

## 3. Phạm vi MVP

### Bao gồm

- Web chat drawer.
- Đăng nhập bằng JWT Lunara.
- Tra cứu dịch vụ và knowledge base.
- Kiểm tra lịch trống.
- Xem booking của Customer.
- Tạo booking có confirmation.
- Xem agenda của Therapist.
- Bắt đầu và hoàn thành dịch vụ.
- Kiểm tra permission, ownership và resource scope.
- Checkpoint hội thoại ngắn hạn.
- Pending action, idempotency và audit log.
- Bộ eval cho tool selection, grounded answer và permission denial.

### Chưa bao gồm

- Multi-agent hoặc role subgraph.
- Semantic long-term memory.
- Đồng bộ mặc định conversation context giữa Web và Google Chat.
- Customer Google Chat public.
- Proactive notification.
- Refund, sửa giá, đổi role hoặc xoá dữ liệu qua agent.
- Cancellation khi schema chưa có lifecycle phù hợp.
- Dữ liệu crawl từ spa khác trong production knowledge base.

## 4. Luồng xử lý mục tiêu

```text
Web / Google Chat
        │
        ▼
Verify channel request
        │
        ▼
Resolve account + permissions
        │
        ▼
LoadContext
        │
        ▼
Agent
        │
        ▼
PolicyGuard
   ┌────┴───────────────┐
   │                    │
 read               sensitive write
   │                    │
   │               ConfirmAction
   │                    │
   └──────────┬─────────┘
              ▼
         ExecuteTool
              │
              ▼
            Agent
              │
              ▼
      ResponseContract
              │
       ┌──────┴──────┐
       ▼             ▼
 Web renderer   Chat renderer
```

## 5. Hạng mục và quan hệ phụ thuộc

| Mã | Hạng mục | Đầu mối đề xuất | Phụ thuộc chính | Đầu ra |
| --- | --- | --- | --- | --- |
| A | Domain, schema và Backend API | Backend/Data | Không | API đủ an toàn cho tool layer |
| B | Knowledge base | Product/Content + AI | Policy Lunara đã duyệt | Corpus có version, audience và citation |
| C | Agent runtime | AI/Backend | A cho API contract; B cho retrieval | FastAPI + LangGraph + tool registry |
| D | Web Chat | Frontend + AI | C | Drawer chat và native response component |
| E | Google Chat | AI/Platform | A, C; hoàn thành Web MVP | Chat app, account linking và cards |
| F | Quality, security và observability | QA/Security/Platform | Chạy xuyên suốt A–E | Eval, test, trace, alert và release gate |

Trình tự phụ thuộc:

```text
A ─────────────► C ─────────────► D ─────────────► E
│                ▲                │                │
│                │                │                │
└──► F           B ───────────────┴───────────────►F
```

## 6. Giai đoạn 0 — Chốt domain và contract

### 6.1 Permission

- Chốt permission codes theo capability:
  - `BOOKING_READ_OWN`
  - `BOOKING_READ_ASSIGNED`
  - `BOOKING_READ_ALL`
  - `BOOKING_CREATE`
  - `BOOKING_ASSIGN`
  - `BOOKING_CHECK_IN`
  - `BOOKING_START_SERVICE`
  - `BOOKING_COMPLETE_SERVICE`
  - `PAYMENT_READ`
  - `REPORT_OPERATIONS_READ`
  - `REPORT_REVENUE_READ`
  - `KNOWLEDGE_STAFF_READ`
  - `KNOWLEDGE_MANAGEMENT_READ`
- Map permission cho `CUSTOMER`, `THERAPIST`, `RECEPTIONIST`, `ACCOUNTANT`, `MANAGER`, `OWNER`.
- Bỏ kiểm tra authorization chỉ dựa trên tên role tại endpoint.
- Thêm test permission dương và âm cho từng endpoint liên quan.

### 6.2 Booking và availability

- Thiết kế API availability dùng chung cho Customer, Receptionist và Manager.
- Tính slot tại Backend từ:
  - service skill;
  - working hours;
  - time-off;
  - booking overlap;
  - preparation buffer;
  - cleanup buffer;
  - tổng duration của booking items.
- Re-check slot và giá trong transaction khi tạo booking.
- Thêm ownership cho booking detail.
- Thêm assignment scope cho staff task/detail.
- Thêm idempotency key cho create, assign, start và complete.
- Chặn transition sai trạng thái.
- Ghi `booking_events` cho mọi transition thành công.

### 6.3 Agent persistence

- Thêm bảng hoặc storage tương đương cho external identity:

```text
external_identities
- provider
- provider_subject
- account_id
- linked_at
- last_seen_at
- unique(provider, provider_subject)
```

- Thêm bảng pending action:

```text
agent_pending_actions
- id
- actor_account_id
- channel
- tool_name
- encrypted_or_protected_arguments
- summary
- status
- expires_at
- idempotency_key
- created_at
- executed_at
```

- Thêm audit record cho tool write:

```text
agent_action_audit
- action_id
- actor_account_id
- tool_name
- resource_type
- resource_id
- before_status
- after_status
- result
- correlation_id
- created_at
```

- Không lưu raw secret, JWT, Google bearer token hoặc dữ liệu PII không cần thiết.

### 6.4 API contract

- Hoàn thiện OpenAPI cho các endpoint MVP.
- Chuẩn hoá error codes:
  - `UNAUTHENTICATED`
  - `PERMISSION_DENIED`
  - `RESOURCE_NOT_FOUND`
  - `OWNERSHIP_VIOLATION`
  - `INVALID_TRANSITION`
  - `SLOT_UNAVAILABLE`
  - `PRICE_CHANGED`
  - `ACTION_EXPIRED`
  - `DUPLICATE_ACTION`
  - `DOWNSTREAM_UNAVAILABLE`
- Chuẩn hoá pagination, date range, timezone và locale.
- Giới hạn page size, date range và filter được phép.

### Đầu ra

- Permission matrix đã duyệt.
- OpenAPI contract đã duyệt.
- Availability API hoạt động.
- Ownership và idempotency test đạt.
- Migration external identity, pending action và audit sẵn sàng.

### Tiêu chí hoàn thành

- Không đọc được booking ngoài ownership/scope trong toàn bộ negative test.
- Không tạo action trùng khi gửi lặp cùng idempotency key.
- Không tạo booking khi slot hoặc giá thay đổi trước transaction commit.
- Không chuyển trạng thái booking sai lifecycle.

## 7. Giai đoạn 1 — Knowledge base

### 7.1 Nội dung

- Thu thập nội dung chính thức của Lunara:
  - chính sách đặt lịch;
  - chính sách đến muộn;
  - chính sách thanh toán;
  - hướng dẫn trước và sau dịch vụ;
  - FAQ;
  - SOP dành cho Staff;
  - nội dung dành cho Manager.
- Tách corpus theo audience:
  - `PUBLIC`
  - `STAFF`
  - `MANAGEMENT`
- Loại bỏ dữ liệu đối thủ khỏi production corpus.
- Gắn owner, version, ngày hiệu lực và nguồn cho từng tài liệu.

### 7.2 Retrieval

- Bắt đầu bằng keyword/full-text search.
- Trả citation và version trong retrieval result.
- Lọc audience trước khi search hoặc trước khi trả kết quả.
- Trả fallback khi thiếu nguồn đã xác nhận.
- Chỉ bổ sung embeddings/vector database sau khi eval không đạt.

### 7.3 Eval dataset

- Soạn bộ câu hỏi chuẩn bằng tiếng Việt:
  - câu hỏi trực tiếp;
  - cách diễn đạt tự nhiên;
  - lỗi chính tả;
  - câu hỏi ngoài phạm vi;
  - câu hỏi mâu thuẫn với policy;
  - prompt injection trong nội dung truy xuất.
- Gắn expected source và expected audience cho từng câu hỏi.

### Đầu ra

- Corpus Lunara phiên bản đầu.
- Search API hoặc retrieval component.
- Bộ eval knowledge và citation.

### Tiêu chí hoàn thành

- Không trả nội dung `STAFF` hoặc `MANAGEMENT` cho Customer.
- Không trả giá service từ knowledge document khi Backend cung cấp dữ liệu realtime.
- Không trả policy khi thiếu source/version hợp lệ.
- Không thực thi instruction chứa trong retrieved content.

## 8. Giai đoạn 2 — Agent runtime và Web MVP chỉ đọc

### 8.1 Nền tảng FastAPI

- Tạo service Python độc lập.
- Thêm configuration theo environment.
- Thêm service-to-service authentication với Spring Backend.
- Thêm timeout, retry cho read idempotent và circuit breaker.
- Thêm correlation ID xuyên suốt request, tool và Backend.
- Thêm structured logging và PII redaction.
- Thêm health, readiness và dependency checks.

### 8.2 LangGraph

- Khai báo `AgentState` tối thiểu.
- Cài đặt `LoadContext` deterministic.
- Cài đặt một Agent node có tool calling.
- Cài đặt `PolicyGuard` deterministic.
- Cài đặt `ExecuteTool` với typed input/output.
- Cài đặt `ResponseContract` trung lập.
- Cài đặt Redis checkpointer có TTL.
- Tạo conversation key từ `account_id + channel + space/thread`.

### 8.3 Tool registry read-only

- Cài đặt `search_services(filters)`.
- Cài đặt `search_knowledge(query, audience)`.
- Cài đặt `get_my_bookings(date_range?, status?)`.
- Cài đặt `get_my_booking(booking_code)`.
- Cài đặt dynamic tool allow-list theo permission.
- Inject `actor_account_id` từ trusted context; loại khỏi model arguments.
- Validate toàn bộ tool input/output bằng schema.

### 8.4 Web adapter

- Thêm endpoint chat cho Web.
- Verify JWT Lunara.
- Hỗ trợ streaming text nếu phù hợp.
- Render các response component ban đầu:
  - text;
  - service list;
  - booking card;
  - error/fallback;
  - citation.
- Không đưa raw tool result hoặc internal exception ra UI.

### Đầu ra

- Web chat read-only hoạt động với Customer.
- Knowledge và service query có citation/nguồn đúng.
- Booking query bị giới hạn theo ownership.
- Trace đầy đủ cho từng request.

### Tiêu chí hoàn thành

- Đạt ít nhất 90% tool-selection accuracy trên bộ eval MVP.
- Đạt 100% permission-denial accuracy trên negative test.
- Đạt ít nhất 95% grounded answer accuracy với knowledge eval.
- Không lộ PII hoặc internal exception trong log và response.

## 9. Giai đoạn 3 — Availability, booking và confirmation

### 9.1 Tool

- Cài đặt `check_availability(items, time_window, staff_id?)`.
- Cài đặt `create_booking(items, slot, staff_id?, note?, idempotency_key)`.
- Không tạo `get_available_staff` riêng trong MVP.
- Trả slot, staff phù hợp, giá và thời lượng bằng structured result.

### 9.2 Confirmation

- Tạo canonical tool arguments phía server.
- Lưu pending action trước khi hiển thị confirmation.
- Chỉ gửi opaque `pending_action_id` ra client.
- Hiển thị service, thời gian, staff, giá và note trước xác nhận.
- Kiểm tra actor, channel, TTL, permission và action status khi xác nhận.
- Re-check slot, giá và booking rule trước execution.
- Chuyển trạng thái pending action theo cách atomic:

```text
PENDING → EXECUTING → SUCCEEDED
                    └→ FAILED
PENDING → EXPIRED
PENDING → REJECTED
```

- Ghi audit cho thành công, thất bại, từ chối và hết hạn.

### 9.3 Web UX

- Thêm availability card.
- Thêm booking summary card.
- Thêm nút xác nhận và huỷ thao tác.
- Thêm trạng thái slot hết chỗ hoặc giá thay đổi.
- Thêm link mở trang booking/ticket chính.

### Đầu ra

- Hoàn chỉnh customer booking flow trên Web.
- Ngăn duplicate booking khi click hoặc retry nhiều lần.
- Hiển thị lỗi nghiệp vụ bằng thông báo có thể xử lý.

### Tiêu chí hoàn thành

- Không execute write trước confirmation.
- Không execute pending action sai actor hoặc đã hết hạn.
- Không tạo quá một booking cho cùng idempotency key.
- Trả slot mới khi slot cũ hết chỗ.
- Ghi đủ audit và correlation ID cho mọi write.

## 10. Giai đoạn 4 — Therapist và operations nội bộ

### 10.1 Therapist

- Cài đặt `get_my_agenda(date)`.
- Cài đặt `get_my_assigned_booking(booking_code)`.
- Cài đặt `start_service(booking_id, idempotency_key)`.
- Cài đặt `complete_service(booking_id, idempotency_key)`.
- Giới hạn booking theo `staff_account_id`.
- Yêu cầu confirmation hoặc explicit action button cho transition.
- Dùng `search_knowledge(audience="STAFF")` cho SOP.

### 10.2 Receptionist

- Bổ sung Backend API `search_bookings(filters)`.
- Bổ sung Backend API `check_in_booking`.
- Cài đặt `search_bookings(filters)`.
- Cài đặt `get_booking(booking_code)`.
- Cài đặt `check_in_booking(booking_id, idempotency_key)`.
- Cài đặt `assign_staff(booking_id, staff_id, idempotency_key)`.
- Dùng lại `check_availability` trước assignment.
- Không cấp report doanh thu khi thiếu permission tương ứng.

### 10.3 Manager, Owner và Accountant

- Cài đặt `get_operations_overview(date_range)`.
- Mở rộng `get_staff_schedule(staff_id, date_range)` với booking blocks.
- Cài đặt `get_payment_for_booking(booking_id)`.
- Bổ sung Backend report API theo range và dimension cho phase kế tiếp.
- Không expose `mark_paid` hoặc `refund_payment`.

### Đầu ra

- Hoàn chỉnh Therapist workflow trên Web.
- Hoàn chỉnh booking operations cơ bản cho Receptionist/Manager.
- Hoàn chỉnh payment lookup cho role được phép.

### Tiêu chí hoàn thành

- Không xem hoặc transition booking ngoài assignment của Therapist.
- Không start service trước `CHECKED_IN`.
- Không complete service trước `IN_SERVICE`.
- Không assign staff thiếu skill, ngoài giờ, time-off hoặc trùng lịch.
- Không trả revenue/payment cho permission không phù hợp.

## 11. Giai đoạn 5 — Google Chat nội bộ

### 11.1 Chat app foundation

- Tạo Google Cloud project/configuration phù hợp.
- Cấu hình HTTPS interaction endpoint.
- Verify bearer token, issuer và audience cho mọi interaction event.
- Xử lý message, card click và app-added event.
- Trả synchronous response trong giới hạn của Google Chat.
- Chuyển tác vụ dài sang asynchronous response.
- Chỉ dùng dialog cho flow có latency dự đoán được.

### 11.2 Identity linking

- Dùng `Event.user.name` làm Google Chat provider subject.
- Không coi `Event.user.name` là OIDC `sub`.
- Bind account nội bộ sau verified event và domain/email policy hợp lệ.
- Tạo one-time signed link cho account chưa liên kết.
- Hoàn tất Google OAuth callback trước khi ghi external identity mapping.
- Giới hạn TTL và single-use cho linking state.

### 11.3 Privacy

- Phân biệt direct message và group space.
- Chặn booking, customer detail và payment detail trong group space.
- Hướng dẫn chuyển sang DM khi yêu cầu chứa dữ liệu riêng tư.
- Không đưa tool arguments nhạy cảm vào card payload.
- Chỉ gửi opaque action reference trong button.

### 11.4 Bộ kết xuất giao diện

- Map `ResponseContract` sang Google `cardsV2`.
- Hỗ trợ:
  - service list;
  - booking card;
  - agenda card;
  - operations overview;
  - confirmation card;
  - error/fallback.
- Giữ cùng tool, policy và confirmation flow với Web.

### 11.5 Phạm vi thử nghiệm

- Chỉ cấp cho trusted testers.
- Ưu tiên `THERAPIST`, `RECEPTIONIST`, `MANAGER`, `OWNER`, `ACCOUNTANT`.
- Chưa phát hành cho Customer bên ngoài tổ chức.

### Đầu ra

- Google Chat app nội bộ hoạt động trong DM.
- Account linking hoạt động an toàn.
- Cards và action button dùng chung Agent Core.
- Async fallback hoạt động khi vượt thời gian xử lý đồng bộ.

### Tiêu chí hoàn thành

- Từ chối toàn bộ request không verify được.
- Không liên kết sai Chat user với Lunara account.
- Không trả PII/payment trong group space.
- Không thực hiện write hai lần khi Google gửi lại event.
- Hoàn thành hoặc acknowledge mọi interaction trước timeout platform.

## 12. Giai đoạn 6 — Report, reschedule và phát hành mở rộng

### 12.1 Report

- Bổ sung Backend report API có giới hạn `date_range` và `group_by`.
- Cài đặt `get_business_summary(date_range, group_by?)`.
- Giới hạn dimension và maximum range.
- Tách permission operations report và revenue report.

### 12.2 Reschedule

- Chốt rule reschedule, cutoff, payment và notification.
- Bổ sung Backend reschedule endpoint.
- Re-check availability trong transaction.
- Cài đặt `reschedule_my_booking` có confirmation và idempotency.
- Ghi `RESCHEDULED` event và cập nhật email/calendar.

### 12.3 Cancellation

- Chốt cancellation lifecycle trước khi code.
- Bổ sung trạng thái hoặc mô hình cancellation phù hợp vào schema.
- Chốt quan hệ với payment/refund.
- Chốt cutoff, actor, reason và audit.
- Thêm migration và regression test.
- Chỉ cài đặt `cancel_my_booking` sau khi hoàn tất toàn bộ dependency.
- Không xoá booking để mô phỏng cancellation.

### 12.4 Public Google Chat

- Hoàn thiện privacy policy, terms, support page và app assets.
- Kiểm thử account linking cho Google account ngoài tổ chức.
- Hoàn thiện Marketplace/OAuth review khi cần.
- Bổ sung rate limit và abuse monitoring cho public traffic.
- Phát hành theo rollout nhỏ trước khi mở rộng.

## 13. Tool delivery matrix

| Tool | Giai đoạn | Backend dependency | Confirmation |
| --- | --- | --- | --- |
| `search_services` | 2 | Service API hiện có | Không |
| `search_knowledge` | 2 | Knowledge corpus/index | Không |
| `get_my_bookings` | 2 | Booking API hiện có + ownership | Không |
| `get_my_booking` | 2 | Booking detail + ownership | Không |
| `check_availability` | 3 | Availability API mới | Không |
| `create_booking` | 3 | Create API + idempotency | Có |
| `get_my_agenda` | 4 | Staff task API hiện có | Không |
| `get_my_assigned_booking` | 4 | Staff-scoped detail API | Không |
| `start_service` | 4 | Start API + transition guard | Có/explicit button |
| `complete_service` | 4 | Complete API + transition guard | Có |
| `search_bookings` | 4 | Manager/receptionist search API mới | Không |
| `get_booking` | 4 | Booking detail + RBAC | Không |
| `check_in_booking` | 4 | Check-in API mới | Có/explicit button |
| `assign_staff` | 4 | Assign API + availability/idempotency | Có |
| `get_operations_overview` | 4 | Dashboard API mở rộng | Không |
| `get_staff_schedule` | 4 | Schedule API mở rộng | Không |
| `get_payment_for_booking` | 4 | Payment API hiện có + RBAC | Không |
| `get_business_summary` | 6 | Report API mới | Không |
| `reschedule_my_booking` | 6 | Reschedule API mới | Có |
| `cancel_my_booking` | Chưa lên lịch | Schema/lifecycle/refund mới | Có |

## 14. Kế hoạch kiểm thử

### Kiểm thử đơn vị

- Tool input/output schema.
- Permission-to-tool mapping.
- PolicyGuard decision.
- Pending action transition.
- ResponseContract serialization.
- Web và Google Chat renderer mapping.

### Kiểm thử tích hợp

- FastAPI → Spring Backend.
- Redis checkpoint resume.
- SQL pending action và audit.
- Knowledge retrieval theo audience.
- Google Chat request verification.
- Account-linking callback.

### Kiểm thử bảo mật

- Booking code enumeration.
- Ownership bypass.
- Role/permission spoofing trong prompt hoặc request body.
- Prompt injection từ user và retrieved document.
- Card payload tampering.
- Expired/replayed confirmation.
- Duplicate interaction event.
- Group-space PII request.

### Kiểm thử đầu-cuối

- Customer hỏi dịch vụ → kiểm tra slot → xác nhận → tạo booking.
- Customer xem booking của chính account.
- Therapist xem agenda → bắt đầu → hoàn thành dịch vụ.
- Receptionist tìm booking → check-in → assign staff.
- Manager xem operations overview.
- Accountant xem payment khi có permission.
- Google Chat account chưa link → link → chạy lại request.
- Downstream timeout → fallback an toàn.

### Kiểm thử hồi quy

- Booking lifecycle hiện tại.
- Payment confirmation.
- Staff assignment conflict.
- Service price calculation.
- Existing Web booking flow ngoài agent.

## 15. Quan sát hệ thống và vận hành

- Ghi trace cho request, model call, tool call và Backend call.
- Gắn correlation ID xuyên suốt.
- Đo:
  - tool-selection accuracy;
  - task completion rate;
  - permission denial;
  - confirmation success/abandon rate;
  - duplicate write rate;
  - groundedness/citation accuracy;
  - token usage và model cost;
  - p50/p95 latency;
  - Backend/tool error rate;
  - async fallback rate.
- Redact token, email, phone, customer note và payment data trong log.
- Cảnh báo khi permission violation, duplicate write hoặc error rate vượt ngưỡng.
- Lưu prompt/model/tool version trong trace phục vụ regression.

## 16. Điều kiện phát hành

### Web MVP

- Đạt tối thiểu 90% độ chính xác chọn tool trên bộ kiểm thử chuẩn.
- Đạt tối thiểu 95% độ chính xác trả lời dựa trên nguồn.
- Đạt 100% kiểm thử từ chối quyền.
- Không phát sinh hành động ghi trùng trong kiểm thử retry/concurrency.
- Không có lỗi mức critical/high trong security review.
- Có fallback sang UI chính khi agent hoặc downstream lỗi.

### Google Chat nội bộ

- Request verification đạt 100% trên valid/invalid fixture.
- Account linking không xuất hiện cross-account mapping.
- PII group-space test đạt 100% deny/redirect-to-DM.
- Interaction được trả lời hoặc acknowledge trước platform timeout.
- Trusted tester sign-off cho từng role nội bộ.

### Public release

- Hoàn tất privacy/terms/support và Marketplace requirement.
- Hoàn tất abuse/rate-limit test.
- Hoàn tất external-account linking test.
- Hoàn tất staged rollout và rollback procedure.

## 17. Tiêu chí hoàn tất chung

- Hoàn tất implementation, test, API documentation và runbook.
- Hoàn tất permission, ownership, idempotency và audit cho mọi write.
- Hoàn tất structured error handling và user-safe fallback.
- Hoàn tất trace, metric và alert cần thiết.
- Không lưu hoặc log secret/PII ngoài phạm vi cho phép.
- Không thêm subgraph, vector database hoặc long-term memory khi chưa có metric chứng minh nhu cầu.
- Cập nhật `NOTE.md`, OpenAPI và schema documentation khi thay đổi quyết định kiến trúc.

## 18. Danh sách sau MVP

- Explicit cross-channel conversation resume.
- Proactive booking notification có opt-in.
- Staff time-off request workflow.
- Refund workflow có approval.
- Multi-step booking subgraph khi cần giữ slot tạm thời.
- Vector retrieval khi full-text search không đạt eval target.
- Semantic customer preference memory có consent và chức năng xem/xoá.
- Public Customer Google Chat sau Marketplace review.
