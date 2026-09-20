# Lunara Assistant

> Bản này chắt lọc từ `RAW.nd` và đối chiếu với schema v2 cùng các Backend API Guide hiện có.
> Mục tiêu là đủ rõ để triển khai, nhưng không biến một trợ lý spa thành hệ multi-agent quá phức tạp.

## 1. Kết luận thiết kế

Lunara Assistant khả thi trên cả Web và Google Chat. Nên xây **một agent core**, dùng chung tool và policy, rồi gắn hai channel adapter:

- Web chat drawer;
- Google Chat app.

Không nên tạo ba agent độc lập cho Customer, Staff và Manager ở phiên bản đầu. Cũng chưa cần ba role subgraph. Role không phản ánh đầy đủ quyền trong schema vì hệ thống còn có `OWNER`, `RECEPTIONIST`, `ACCOUNTANT` và quyền có thể thay đổi qua `role_permissions`.

Thiết kế gọn nhất là:

1. xác thực channel và resolve Lunara account bằng code xác định;
2. tải permission và chỉ bind những tool được phép;
3. một agent node hiểu yêu cầu, hỏi thêm dữ liệu còn thiếu và chọn tool;
4. policy guard kiểm tra lại quyền, ownership và loại hành động;
5. hành động nhạy cảm phải chờ xác nhận;
6. tool gọi Spring Backend, không truy cập DB trực tiếp;
7. kết quả có cấu trúc được Web/Google Chat render theo cách riêng.

LangGraph phù hợp vì có state, checkpoint và `interrupt` cho confirmation. Tuy nhiên, **LangGraph là workflow engine, không phải lý do để mọi bước đều trở thành node**. DeepAgents/multi-agent middleware chưa đem lại lợi ích tương xứng ở MVP.

## 2. Phạm vi

### Mục tiêu

- Trả lời câu hỏi về dịch vụ, giá, thời lượng, chính sách và FAQ của Lunara.
- Cho Customer tìm lịch trống, tạo và xem booking của chính họ.
- Cho Therapist xem việc được giao, bắt đầu và hoàn thành dịch vụ.
- Cho Receptionist/Manager/Owner theo dõi vận hành và thực hiện action đúng quyền.
- Cho Accountant/Manager/Owner đọc thông tin payment/report đúng quyền.
- Dùng chung business logic giữa Web và Google Chat.

### Không làm ở MVP

- Không cho LLM sinh SQL hoặc đọc DB trực tiếp.
- Không tự động refund, sửa giá, đổi role hay xoá dữ liệu.
- Không đồng bộ toàn bộ hội thoại giữa Web và Google Chat.
- Không dùng dữ liệu crawl từ spa khác làm chính sách của Lunara.
- Không xây planner nhiều agent, Customer/Staff/Manager agent riêng, hoặc semantic long-term memory khi chưa có nhu cầu được đo bằng thực tế.

## 3. Kiến trúc tổng thể

```text
Web Chat                         Google Chat
   │                                  │
   └──────────── Channel adapters ────┘
                      │
             Verify request / identity
                      │
                 FastAPI Agent API
                      │
               Minimal LangGraph
                      │
       ┌──────────────┼───────────────┐
       │              │               │
   Agent node    Policy guard   Confirmation gate
       │              │               │
       └──────────── Tool executor ────┘
                      │
             Typed tool/API clients
                      │
              Spring Boot Backend
                      │
                  MySQL 8

Supporting components:
- Redis: checkpoint/short-lived conversation state, rate limit và ephemeral deduplication. Write idempotency vẫn phải được Backend bảo đảm bền vững.
- Knowledge index: chỉ thêm vector store khi search thường không đủ tốt.
- Observability: trace, latency, tool result, permission denial và LLM cost.
```

Spring Backend vẫn là source of truth cho business rule, transaction và RBAC. FastAPI không được tự triển khai lại logic tính giá, kiểm tra slot hoặc transition booking.

## 4. Graph đề xuất

```text
START
  │
  ▼
LoadContext (deterministic)
  │  account_id, role, permissions, channel, thread, locale
  ▼
Agent
  │  trả lời trực tiếp / hỏi lại / đề xuất tool call
  ▼
PolicyGuard (deterministic)
  │
  ├── deny ──────────────────────────────► Agent
  │
  ├── read hoặc write an toàn ──────────► ExecuteTool
  │
  └── write cần duyệt ─► ConfirmAction ─► ExecuteTool
                                             │
                                             ▼
                                           Agent
                                             │
                                             ▼
                                      ResponseContract
                                             │
                                            END
```

Đây là **một graph với vòng lặp tool-calling**, không phải ba subgraph theo role. Mỗi request chỉ nhìn thấy allow-list tool được tạo từ permission của account.

Chỉ tách subgraph khi một workflow thật sự có nhiều bước cố định và cần state riêng, ví dụ sau này có:

- booking wizard nhiều bước với giữ slot tạm thời;
- refund workflow có phê duyệt;
- incident/escalation workflow;
- báo cáo dài chạy bất đồng bộ.

Nếu chưa có những workflow đó, subgraph chỉ làm tăng state mapping, checkpoint namespace, test và debug.

## 5. State tối thiểu

```python
class AgentState(TypedDict):
    messages: list
    account_id: int | None
    role: str | None
    permissions: set[str]
    allowed_tools: list[str]
    channel: Literal["WEB", "GOOGLE_CHAT"]
    channel_user_id: str
    conversation_id: str
    locale: str
    timezone: str
    pending_action_id: str | None
    tool_result: dict | None
    error: dict | None
```

Không đưa profile đầy đủ, customer note nội bộ hoặc dữ liệu payment không cần thiết vào prompt. Tool chỉ trả trường cần cho câu trả lời hiện tại.

## 6. Đánh giá các node trong RAW


| Thành phần trong RAW            | Quyết định                                | Lý do / thay đổi                                                                                                            |
| ------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Identity Node                   | Giữ nhưng deterministic                   | Gộp verify request, resolve external identity và load account; không gọi LLM. Có thể nằm trước graph hoặc là `LoadContext`. |
| Permission Node                 | Gộp vào `LoadContext` + giữ `PolicyGuard` | Tool allow-list giúp giảm lựa chọn sai; Backend vẫn phải authorize lần cuối. Không tin role/tool call do model tạo.         |
| Intent Router Node              | Bỏ ở MVP                                  | Tool-calling model đã chọn tool. Router riêng tạo thêm một lần gọi model và dễ route sai với câu hỏi chứa nhiều intent.     |
| Role Router                     | Bỏ ở MVP                                  | Permission/capability phù hợp hơn role và tránh lặp tool giữa Customer/Staff/Manager.                                       |
| Customer/Staff/Manager subgraph | Hoãn                                      | Chưa có workflow đủ phức tạp để đáng tách. Dùng tool allow-list theo permission.                                            |
| Knowledge Node                  | Đổi thành tool                            | `search_knowledge` chỉ là retrieval; không cần một node/subgraph riêng.                                                     |
| Confirmation Node               | Giữ                                       | Dùng LangGraph interrupt hoặc pending action bền vững cho hành động nhạy cảm.                                               |
| Tool Execution Node             | Giữ                                       | Chỉ chạy typed tools qua Backend API; có timeout, retry có kiểm soát và idempotency.                                        |
| Response Formatter Node         | Thu nhỏ                                   | Agent trả `ResponseContract`; renderer Web/Google Chat nên nằm ở adapter, không nằm trong business graph.                   |
| DeepAgents middleware           | Bỏ ở MVP                                  | Chưa có specialist agent hoặc delegation cần quản lý. Middleware nhỏ cho auth, logging và tool policy là đủ.                |


## 7. Tool catalog đã tinh gọn

Nguyên tắc:

- Một tool tương ứng một capability nghiệp vụ rõ ràng, không phải một câu người dùng có thể hỏi.
- Dùng filter thay vì tạo nhiều tool gần giống nhau.
- Không expose tool mà backend/schema chưa hỗ trợ như thể nó đã tồn tại.
- Mỗi tool nhận `actor_account_id` từ trusted context, không nhận actor do LLM truyền vào.

### 7.1 Shared / knowledge


| Tool                                                | Ai dùng                         | MVP | Backend hiện tại                                                                                                           |
| --------------------------------------------------- | ------------------------------- | --- | -------------------------------------------------------------------------------------------------------------------------- |
| `search_services(filters)`                          | Tất cả                          | Có  | Có thể bọc `GET /api/services`; trả cả summary và detail cần thiết để chưa phải tách `list_services`/`get_service_detail`. |
| `search_knowledge(query, audience)`                 | Tất cả                          | Có  | Cần xây knowledge service/index từ nội dung Lunara đã duyệt.                                                               |
| `check_availability(items, time_window, staff_id?)` | Customer, Receptionist, Manager | Có  | **Thiếu endpoint**; cần Backend làm nguồn tính slot dựa trên skill, working hours, time-off, booking và buffer.            |


`get_available_staff` không cần là tool riêng: kết quả availability có thể trả các slot cùng staff phù hợp. Chỉ tách khi UI có use case rõ ràng là duyệt hồ sơ nhân viên.

### 7.2 Customer


| Tool                                                             | Mục đích                                | Xác nhận | Trạng thái                                                                                                                      |
| ---------------------------------------------------------------- | --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `get_my_bookings(date_range?, status?)`                          | Xem booking của account hiện tại        | Không    | Có `GET /api/bookings/my`.                                                                                                      |
| `get_my_booking(booking_code)`                                   | Xem chi tiết một booking của chính mình | Không    | Có endpoint detail nhưng Backend phải enforce ownership.                                                                        |
| `create_booking(items, slot, staff_id?, note?, idempotency_key)` | Tạo booking sau khi báo lại giá/giờ     | **Có**   | Có `POST /api/bookings`; phải re-check slot và giá trong transaction.                                                           |
| `reschedule_my_booking(booking_code, new_slot, idempotency_key)` | Đổi lịch của chính mình                 | **Có**   | Hoãn: business rule có nhắc nhưng **chưa có endpoint**.                                                                         |
| `cancel_my_booking(booking_code, reason?, idempotency_key)`      | Huỷ lịch                                | **Có**   | **Không khả thi với schema v2 hiện tại** vì không có `CANCELLED`; chỉ thêm sau khi chốt lifecycle, payment/refund và migration. |


MVP Customer chỉ cần 6 capability gồm knowledge/service/availability và ba booking tool đầu. Reschedule là phase kế; cancel tuyệt đối không giả lập bằng xoá booking.

### 7.3 Therapist


| Tool                                            | Mục đích                                     | Xác nhận            | Trạng thái                                                                                   |
| ----------------------------------------------- | -------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `get_my_agenda(date)`                           | Danh sách booking/time block được giao       | Không               | Bọc `GET /api/staff/tasks`; thay cho hai tool trùng nhau `get_my_work` và `get_my_schedule`. |
| `get_my_assigned_booking(booking_code)`         | Chi tiết tối thiểu của khách/booking đã giao | Không               | Cần endpoint/detail có ownership theo `staff_account_id`, hoặc mở rộng API task.             |
| `start_service(booking_id, idempotency_key)`    | `CHECKED_IN → IN_SERVICE`                    | Có hoặc nút rõ ràng | Có endpoint; Backend phải kiểm tra assignee và current status.                               |
| `complete_service(booking_id, idempotency_key)` | `IN_SERVICE → COMPLETED`                     | **Có**              | Có endpoint; Backend phải kiểm tra assignee và current status.                               |


`get_service_instruction` dùng chung `search_knowledge(audience="STAFF")`; không cần tool riêng. Chỉ đưa SOP nội bộ đã được phê duyệt vào corpus dành cho Staff.

### 7.4 Receptionist / operations

RAW chưa tách Receptionist dù đây là role thực tế trong schema.


| Tool                                                  | Mục đích                                       | Xác nhận            | Trạng thái                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `search_bookings(filters)`                            | Tìm theo ngày, status, code, staff, unassigned | Không               | **Thiếu API list/search**. Tool này thay `get_today_bookings` và `get_unassigned_bookings`.     |
| `get_booking(booking_code)`                           | Xem booking theo quyền vận hành                | Không               | Có detail, cần RBAC rõ ràng.                                                                    |
| `check_in_booking(booking_id, idempotency_key)`       | `CONFIRMED → CHECKED_IN`                       | Có hoặc nút rõ ràng | Lifecycle có nhưng **thiếu endpoint**.                                                          |
| `assign_staff(booking_id, staff_id, idempotency_key)` | Gán nhân viên sau khi check availability       | **Có**              | Có endpoint manager; cần permission thay vì hard-code tên role nếu Receptionist được cấp quyền. |


Receptionist có thể dùng thêm `check_availability`. Không cho Receptionist thấy revenue chỉ vì họ dùng cùng operations graph.

### 7.5 Manager / Owner


| Tool                                                | Mục đích                                           | Xác nhận | Trạng thái                                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `get_operations_overview(date_range)`               | KPI vận hành tổng quan                             | Không    | Dashboard hiện có dữ liệu cơ bản; cần thêm filter/range nếu muốn ngoài hôm nay.                                             |
| `search_bookings(filters)`                          | Lịch, pending, unassigned, theo staff/service      | Không    | Thiếu API list/search. Không tạo ba tool con.                                                                               |
| `check_availability(items, time_window, staff_id?)` | Ai có thể nhận booking                             | Không    | Dùng lại shared tool, nhưng cho phép Manager thấy thông tin staff theo permission; Backend availability API hiện còn thiếu. |
| `get_staff_schedule(staff_id, date_range)`          | Working hours, time-off và booking blocks          | Không    | API hiện mới trả working hours/time-off; cần bổ sung booking blocks/date range.                                             |
| `assign_staff(...)`                                 | Gán/đổi staff                                      | **Có**   | Có endpoint assign; cần xử lý race condition.                                                                               |
| `get_payment_for_booking(booking_id)`               | Xem trạng thái payment                             | Không    | Có endpoint.                                                                                                                |
| `get_business_summary(date_range, group_by?)`       | Revenue, booking count, cancellation/usage metrics | Không    | Phase 2: **chưa có API report tổng quát**; dashboard hiện chỉ có một số tổng.                                               |


Không tạo riêng `get_revenue_summary`, `get_payment_summary`, `get_booking_statistics` ở MVP. Một read-only reporting contract có filter/range đủ dùng, miễn Backend giới hạn dimension và khoảng thời gian để tránh query tùy ý.

### 7.6 Accountant

Accountant nên nhận payment/report tools theo permission, không bị route sang Manager chỉ vì cần xem doanh thu. MVP có thể dùng:

- `get_payment_for_booking`;
- `get_business_summary` khi report API đã có.

Agent không nên expose `mark_paid` hay `refund_payment` trong phase đầu. Đây là hành động tài chính rủi ro cao, cần quy trình và audit riêng.

## 8. Permission model

Tool visibility chỉ là lớp UX/safety đầu tiên. Authorization bắt buộc có hai lớp:

1. Agent service tạo allow-list từ permissions đã tải từ Backend.
2. Mỗi Backend endpoint kiểm tra lại actor, permission, ownership và resource scope.

Gợi ý capability matrix ban đầu:


| Role           | Capability chính                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `CUSTOMER`     | Public knowledge, availability, create booking, booking của chính mình.                                    |
| `THERAPIST`    | Public/staff knowledge, agenda của mình, booking được assign, start/complete service.                      |
| `RECEPTIONIST` | Booking operations, availability, check-in, assign nếu được cấp quyền; không mặc định có report doanh thu. |
| `ACCOUNTANT`   | Payment và report tài chính theo permission; không quản lý staff/booking lifecycle nếu không được cấp.     |
| `MANAGER`      | Operations, staff, payment, report.                                                                        |
| `OWNER`        | Tất cả capability được phê duyệt, nhưng action nguy hiểm vẫn cần confirmation.                             |


Nên định nghĩa permission theo hành động, ví dụ `BOOKING_READ_ALL`, `BOOKING_ASSIGN`, `BOOKING_CHECK_IN`, `PAYMENT_READ`, `REPORT_REVENUE_READ`, thay vì chỉ kiểm tra tên role.

## 9. Identity trên hai channel

### Web

- Web gửi JWT của Lunara.
- Agent API verify JWT hoặc gọi Backend introspection/me endpoint.
- `account_id` và permission lấy từ trusted claim/Backend, không lấy từ message body.

### Google Chat

- Trước hết verify bearer token của interaction request để chắc request đến từ Google Chat.
- `Event.user.name` (`users/{id}`) là định danh Chat ổn định, nhưng **không nên giả định nó bằng OIDC `sub`** đang lưu trong `accounts.google_subject`.
- Nên có mapping rõ ràng:

```text
external_identities
────────────────────────────────────────
provider              GOOGLE_CHAT
provider_subject      users/123456789...
account_id            42
linked_at              ...
```

- Với user nội bộ cùng Workspace, có thể dùng email từ event để tìm account pre-provisioned, nhưng chỉ bind sau khi request đã được verify và chính sách domain cho phép.
- Với customer bên ngoài, dùng nút **Liên kết tài khoản** dẫn đến web Google OAuth, kèm one-time state đã ký và hết hạn. Sau callback mới ghi mapping Chat user → Lunara account.
- Không dùng display name làm identity. Không tự động bind chỉ vì email trong text trùng nhau.

Customer data/payment không nên trả trong group space. Yêu cầu người dùng chuyển sang DM với bot hoặc dùng private response phù hợp để tránh lộ PII.

## 10. Confirmation và write safety

Confirmation không chỉ là câu “Bạn chắc chứ?”. Nó phải là một pending action lưu phía server:

```json
{
  "id": "act_...",
  "actor_account_id": 42,
  "tool": "create_booking",
  "arguments": { "...": "canonical values" },
  "summary": "Massage 90 phút, 16/09 14:00, 470.000đ",
  "expires_at": "...",
  "status": "PENDING"
}
```

Khi người dùng bấm xác nhận:

- lấy action theo opaque ID, không tin arguments gửi lại từ card/browser;
- kiểm tra đúng actor/channel, TTL và trạng thái;
- re-authorize và revalidate slot/price/status;
- gửi idempotency key đến Backend;
- transition `PENDING → EXECUTING → SUCCEEDED/FAILED` theo cách atomic;
- ghi audit event.

Read tool chạy ngay. Write làm thay đổi booking lifecycle, assignment hoặc tiền cần confirmation, trừ khi sản phẩm chủ động chọn một nút có ý nghĩa rõ và coi chính click đó là confirmation.

## 11. Knowledge base / RAG

Nên tách hai nguồn:

1. **Structured data** từ Backend: service, giá, duration, trạng thái active. Luôn lấy realtime bằng tool.
2. **Curated knowledge**: policy, FAQ, hướng dẫn trước/sau dịch vụ, SOP nội bộ. Có owner, version, audience, hiệu lực và source URL.

Metadata gợi ý:

```text
document_id, title, section, audience, locale,
version, effective_from, effective_to, approved_by,
source_url, content_hash, updated_at
```

Dữ liệu crawl từ spa khác chỉ nên là tài liệu nghiên cứu để soạn nội dung, lưu tách biệt và không được retrieval như sự thật về Lunara. Giá/chính sách của đối thủ có thể lỗi thời, có bản quyền và rất dễ khiến agent trả lời sai thương hiệu.

MVP với ít tài liệu có thể dùng search keyword/full-text và citation. Chỉ thêm embeddings/vector database sau khi một bộ câu hỏi đánh giá cho thấy retrieval hiện tại không đạt. Với policy quan trọng, câu trả lời phải kèm source/version và fallback “chưa có thông tin đã được xác nhận” thay vì suy đoán.

## 12. Memory và persistence

`LSTM memory` trong bản cũ nên sửa thành **long-term memory**. LSTM là kiến trúc neural network, không phải loại persistence phù hợp ở đây.

Khuyến nghị:

- Redis checkpoint có TTL cho hội thoại ngắn hạn và LangGraph interrupt.
- Pending action/audit quan trọng lưu trong SQL; không chỉ lưu Redis.
- Conversation key gồm `account_id + channel + space/thread`, không chỉ `account_id`.
- Mặc định không nối đại từ kiểu “lịch đó” xuyên từ Web sang Google Chat; rất dễ chọn nhầm context. Chỉ hỗ trợ “resume conversation” rõ ràng ở phase sau.
- Long-term semantic memory về sở thích khách hàng chưa cần ở MVP. Nếu có, phải cho người dùng xem/xoá và không ghi suy đoán nhạy cảm.

## 13. Channel adapter và response contract

Tool không trả HTML, React component hay Google `cardsV2`. Agent core trả contract trung lập:

```json
{
  "text": "Bạn có một lịch sắp tới.",
  "components": [
    {
      "type": "booking_card",
      "data": {
        "bookingCode": "LNR-...",
        "start": "...",
        "status": "CONFIRMED"
      },
      "actions": [
        { "type": "open_booking", "label": "Xem vé", "payloadRef": "ref_..." }
      ]
    }
  ],
  "citations": []
}
```

- Web adapter render React card.
- Google Chat adapter render text/cardsV2/dialog.
- Payload action dùng opaque reference, không nhét dữ liệu nhạy cảm hoặc tool arguments có thể sửa vào client.
- Google Chat interaction cần trả lời trong giới hạn thời gian của platform; tác vụ dài nên acknowledge rồi xử lý bất đồng bộ. Dialog cần synchronous response, vì vậy không dùng dialog cho workflow có latency khó dự đoán.

## 14. Khoảng trống Backend/schema cần xử lý


| Ưu tiên | Khoảng trống                                           | Lý do                                                                           |
| ------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| P0      | Availability API dùng chung                            | Điều kiện tiên quyết để agent đặt/gán lịch an toàn.                             |
| P0      | Ownership/RBAC rõ cho booking detail và staff task     | Ngăn customer/staff đoán code để đọc booking không thuộc phạm vi.               |
| P0      | Idempotency cho create/transition/assign               | Tránh click lại, retry hoặc event giao lại tạo action hai lần.                  |
| P0      | Verify Google Chat request + external identity mapping | Điều kiện xác thực channel đúng.                                                |
| P1      | Manager/receptionist booking search API                | Hỗ trợ operations mà không sinh nhiều endpoint/tool vụn.                        |
| P1      | Check-in endpoint                                      | Lifecycle đã yêu cầu Receptionist check-in nhưng Guide chưa có API.             |
| P1      | Reschedule endpoint                                    | Schema/event hỗ trợ ý tưởng, nhưng API và conflict policy chưa có.              |
| P1      | Range-based overview/report API                        | Dashboard hiện chưa đủ cho câu hỏi tuần/tháng/group-by.                         |
| P2      | Cancellation lifecycle + refund policy + migration     | Hiện schema cố ý không có `CANCELLED`; phải thiết kế domain trước khi tạo tool. |
| P2      | Conversation history và explicit cross-channel resume  | Chỉ làm khi có nhu cầu sản phẩm thật.                                           |


## 15. Security và reliability checklist

- Verify JWT/Google Chat bearer token, audience, issuer và replay/idempotency.
- Service-to-service authentication giữa FastAPI và Spring Backend.
- Backend authorize mọi request; không tin permission trong prompt.
- JSON schema chặt cho tool input/output; giới hạn date range, page size và text length.
- Timeout; chỉ retry read/idempotent operation; circuit breaker cho downstream.
- PII redaction trong log và trace.
- Tách corpus public, staff-only và management-only trước retrieval.
- Xem nội dung retrieval là dữ liệu không đáng tin; không cho tài liệu thay đổi system/tool policy.
- Audit actor, tool, resource, before/after status và correlation ID cho write.
- Rate limit theo account/channel; chống spam và chi phí model bất thường.
- Không đưa secret, internal note hoặc raw exception vào câu trả lời.
- Fallback deterministic khi model/tool lỗi: thông báo ngắn, correlation ID, link sang UI chính.

## 16. Lộ trình thực hiện

### Phase 0 — Backend readiness

- Chốt permission codes.
- Xây availability API, booking ownership và idempotency.
- Tạo curated knowledge nhỏ cho Lunara.
- Viết API contract/OpenAPI cho tool layer.

### Phase 1 — Web MVP

- `LoadContext`, một Agent node, `PolicyGuard`, Tool executor và ResponseContract.
- Shared/customer read tools, availability, create booking có confirmation.
- Therapist agenda/start/complete.
- Redis checkpoint ngắn hạn, SQL pending action/audit.
- Bộ eval câu hỏi và permission-denial test.

Web nên đi trước để debug graph và business rule mà chưa phải xử lý Marketplace/Chat UX.

### Phase 2 — Google Chat nội bộ

- Verify event request, external identity mapping/account linking.
- DM bot, cards/button và async fallback.
- Trusted testers: Therapist, Receptionist, Manager, Owner, Accountant.
- Không bật customer public trước khi kiểm thử privacy ở group/DM.

### Phase 3 — Operations/report và public distribution

- Booking search/check-in/reschedule/report tools sau khi Backend có API.
- Proactive notification có preference và chống spam.
- Public Google Workspace Marketplace nếu thật sự cần customer ngoài tổ chức.
- Cancellation/refund chỉ sau khi domain và schema hoàn chỉnh.

## 17. Tiêu chí đánh giá trước khi tăng độ phức tạp

Không thêm router/subgraph/vector DB/long-term memory chỉ vì framework hỗ trợ. Chỉ thêm khi metric chứng minh cần thiết:

- tool selection accuracy;
- task completion rate theo role;
- permission violation rate phải bằng 0;
- confirmation success/abandon rate;
- p50/p95 latency Web và Google Chat;
- retrieval groundedness/citation accuracy;
- duplicate write rate phải bằng 0;
- số lần phải fallback sang UI/human.

Nếu một agent node với filtered tools đạt yêu cầu, giữ nguyên. Nếu model thường nhầm giữa các domain hoặc prompt/tool list trở nên quá lớn, lúc đó mới thêm capability router hoặc subgraph cho workflow cụ thể.

## 18. Tài liệu kỹ thuật tham chiếu

- [Google Chat: Receive and respond to interaction events](https://developers.google.com/workspace/chat/receive-respond-interactions)
- [Google Chat: Verify requests from Chat](https://developers.google.com/workspace/chat/verify-requests-from-chat)
- [Google Chat: Identify and specify users](https://developers.google.com/workspace/chat/identify-reference-users)
- [Google Chat: Cards and dialogs](https://developers.google.com/workspace/chat/design-components-card-dialog)
- [Google Workspace Marketplace publishing](https://developers.google.com/workspace/marketplace/how-to-publish)
- [LangGraph interrupts / human-in-the-loop](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [LangGraph subgraphs](https://docs.langchain.com/oss/python/langgraph/subgraphs)

## 19. Quyết định bổ sung cho v0 (`agent/v0`)

v0 hiện thực giai đoạn 2 của `PLAN.md` với phạm vi hẹp hơn, và một số quyết định dưới đây cần được
giữ nhất quán khi mở rộng tiếp.

- **Chỉ đọc, 12 tool**: toàn bộ capability đọc cho 6 role (dịch vụ, availability, booking của mình,
  knowledge, agenda KTV, tìm booking, lịch KTV, payment, dashboard, report). Không có write, không
  pending action, không audit — chỉ thêm khi backend có idempotency.
- **TypeSafe được tích hợp thật**, không chỉ là skill: (1) preflight một request/lượt để phân nhóm
  năng lực và bắt `policy_bypass` / `sensitive_data_request` trước khi gọi LLM; (2) sàng lọc passage
  retrieval bằng 4 Noul theo cookbook classifying RAG passages. Ngưỡng nằm trong code, và mọi lỗi
  đều suy giảm an toàn (agent vẫn chạy).
- **Permission là cầu tạm phía agent**: `/api/auth/me` chưa trả permission list nên agent tự map
  role → permission theo `database/Testing/role_permissions.csv`. Cần bổ sung endpoint permission
  ở backend để bỏ hằng số này.
- **Xác thực pass-through**: agent forward JWT của người dùng, không tự decode, không có service account.
  Service-to-service authentication vẫn là việc còn lại như mục 15 đã nêu.
- **Checkpoint in-memory** (`InMemorySaver`) với conversation key `account_id:channel:conversation_id`;
  Redis để lại khi cần nhiều instance hoặc cần giữ hội thoại qua restart.
- **Corpus Lunara là bản draft**: 14 tài liệu tiếng Việt soạn từ phân tích cấu trúc/chủ đề của
  `docs/crawl/` (chỉ học định dạng và độ phủ chủ đề, không dùng dữ liệu của spa khác). `docs/crawl/`
  không được đưa vào retrieval. Agent bắt buộc nói rõ khi trả lời bằng tài liệu chưa duyệt.
- **`ResponseContract` dựng component bằng code** từ `tool_results`, không để model sinh component;
  `qrPayload` và các trường nhạy cảm bị loại ở tầng contract.
- **Chưa làm ở v0**: streaming, Redis, Google Chat adapter, chat drawer ở frontend, Docker/compose,
  eval set đầy đủ (v0 có 29 case khởi đầu trong `agent/v0/evals/cases.jsonl`).

