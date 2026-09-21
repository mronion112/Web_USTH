# Sự kiện và dịch vụ bên thứ ba

## Booking events và Kafka/SSE

`booking_events` lưu lịch sử bền vững: `CREATED`, `STAFF_ASSIGNED`, `PAYMENT_RECEIVED`, `RESCHEDULED`, `CHECKED_IN`, `SERVICE_STARTED`, `COMPLETED`, cùng các event payment/email phù hợp. Mỗi thay đổi gọi `RealtimeEventPublisher` và chỉ publish Kafka sau transaction commit.

| Kafka topic | Refresh topic SSE | Nguồn thay đổi | Client cần reload |
| --- | --- | --- | --- |
| `booking.events` | `booking` | tạo/gán/đổi lịch/check-in/start/complete; yêu cầu email resend | booking, task, notification |
| `payment.events` | `payment` | paid/refund | payment, booking, notification |
| `schedule.events` | `calendar` | giờ làm/time-off | calendar, availability, booking, task |

Envelope SSE gồm `id`, `topic`, `entityType`, `entityId`, `occurredAt`, `version`, `eventType`, `bookingCode`, `customerAccountId`, `staffAccountId`. SSE hub lọc trước khi broadcast:

- customer chỉ nhận event có `customerAccountId` của mình;
- therapist chỉ nhận event gán `staffAccountId` của mình;
- accountant chỉ nhận topic `payment`;
- owner, manager, receptionist nhận event vận hành;
- hub gửi heartbeat comment mỗi 25 giây và emitter không timeout.

## Google OAuth2 và Gmail API

Hai integration Google khác nhau:

1. **Login** — Spring OAuth client dùng `GOOGLE_CLIENT_ID/SECRET`, scope `email, profile`, callback `/login/oauth2/code/*`. Success handler tạo/cập nhật account và redirect SPA với one-time code; SPA exchange code lấy JWT. Account model là Google-first (`google_subject`, email, avatar, last login).
2. **Transactional email** — không dùng SMTP. `GmailApiEmailClient` lấy OAuth access token bằng refresh token rồi gọi Gmail REST send API. Khi `MAIL_ENABLED=true`, Kafka consumer gửi email cho `PAYMENT_RECEIVED`, `RESCHEDULED`, `EMAIL_RESEND_REQUESTED`.

Email dùng Thymeleaf, ticket URL, status payment và file calendar `.ics` theo `Asia/Ho_Chi_Minh`. Redis key `email:booking-event:<event-id>` giữ trạng thái gửi 30 ngày để deduplicate; lỗi xóa key để có thể retry qua event/process sau.

## VietQR, SePay và đối soát

- Khi tạo payment QR, backend sinh VietQR payload từ bank BIN/account/name cấu hình và **amount từ booking**.
- SePay gọi `POST /api/payments/sepay/webhook`; verifier yêu cầu timestamp/signature HMAC, kiểm tài khoản nhận, loại tiền vào, mã giao dịch và amount.
- `sepay_transactions` là durable inbox: `sepay_id` unique ngăn xử lý trùng, lưu raw payload, matched payment, lý do review và trạng thái `RECEIVED`, `CONFIRMED`, `MANUAL_REVIEW`, `IGNORED`.
- Match tự động thành công đi qua `PaymentConfirmationService`, giống manual mark-paid: payment `PAID`, booking `CONFIRMED`, audit `PAYMENT_RECEIVED`, Kafka payment/booking event. Trường hợp mơ hồ được human reconcile; không tự coi callback là paid chỉ vì client mở checkout.

## Chatbot RAG trong Spring API

Chatbot đọc toàn bộ Markdown dưới `CHATBOT_DOCS_PATH` (mặc định `docs`), chunk theo cấu hình, dùng Gemini embedding và Chroma vector collection để retrieve, rồi Gemini generation tạo câu trả lời có sources. Khi `CHROMA_ENABLED` + `CHROMA_STARTUP_INDEXING` bật, index được đồng bộ lúc app ready; chunk ID ổn định và chunk không còn trong docs bị xóa.

- `POST /api/v1/chatbot/query`: JSON hoàn chỉnh `{answer, sources}`.
- `POST /api/v1/chatbot/stream`: client phải dùng `fetch` và đọc body vì native `EventSource` không POST; nhận `sources → token* → done`, hoặc `error` sau khi stream đã mở.
- Validation `topK` 1–10 (mặc định 5); thiếu key/lỗi Gemini/không có docs thường trả 502 theo `ChatbotException`.
- Endpoint chatbot được permit-all; hiện SPA có UI chat nhưng chưa kết nối endpoint này.

## Chroma, Redis và Kafka

| Dịch vụ | Vai trò runtime | Cấu hình/cảnh báo |
| --- | --- | --- |
| MySQL | DB nghiệp vụ | Flyway baseline/migration; JPA `ddl-auto=validate` |
| Redis | idempotency email và hạ tầng Spring data | backend cần host/port; không phải source booking state |
| Kafka | event bus realtime | một broker local, 3 topics; publish lỗi được log async |
| Chroma | persistent vector DB chatbot | optional compose profile `chroma`; data volume `chroma_data` |
| Gemini | embedding + answer RAG | cần `GEMINI_API_KEY`; generation/embedding model có thể override |
| Gmail API | mail delivery | cần refresh token scope `gmail.send`; bật bằng `MAIL_ENABLED` |
| SePay | bank transfer confirmation | cần HMAC secret; webhook endpoint phải được provider reach |

## Observability và lỗi

- Spring dùng response envelope nhất quán và security error 401/403 dạng JSON.
- Agent v0 có JSON log/correlation ID riêng; xem `06-agent-v0.md`.
- Không có outbox table/retry queue cho Kafka/email trong schema hiện tại. Publish email failure được log; Redis only protects dedupe, không đảm bảo delivery exactly-once.
