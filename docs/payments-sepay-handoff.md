# Payment, SePay webhook và lỗi QR giữ chỗ — tổng hợp

Tài liệu này gom lại toàn bộ kết quả điều tra và việc đã làm trong các phiên gần đây, để nhóm tiếp tục từ đây.
Trạng thái: **phân tích + setup trên SePay đã xong; phần code cần sửa thì CHƯA làm** (chờ quyết định).

---

## 0. TL;DR

| Hạng mục | Trạng thái |
| --- | --- |
| Payment trong backend | Có package `payment` đầy đủ, nhưng **100% thủ công**, không có cổng thanh toán |
| QR hiện tại | Chuỗi tự chế `LUNARA\|<mã>\|<số tiền>` — app ngân hàng không quét được |
| SePay test mode | Token sandbox hoạt động; tài khoản + VA + giao dịch đọc được qua API |
| Webhook trên SePay | **Đã tạo** `Lunara tunnel test` trỏ về tunnel, **đã nhận được payload thật** từ SePay |
| Webhook cũ (`xác thực thanh toán`) | Trả 401 mỗi lần gọi — nguyên nhân là **endpoint không tồn tại**, không phải sai secret |
| Lỗi "Thời gian giữ chỗ đã hết" | Do gate 15 phút ở frontend; backend **không thực thi** hạn này |
| Việc cần làm | Viết endpoint SePay trong backend, sửa gate QR, cấu hình mã thanh toán |

---

## 1. Hiện trạng payment trong repo

**Backend** — `backend/src/main/java/com/kevin/lunaraspa/payment/`:
`PaymentController.java`, `Guide.md`, `dto/`, `entity/`, `exception/`, `repository/`.

| Endpoint | Việc | Quyền |
| --- | --- | --- |
| `POST /api/payments` | Tạo payment `UNPAID`, sinh `transaction_code = PAY-YYYYMMDD-#####` | khách sở hữu booking hoặc OPERATIONS |
| `GET /api/payments` | Danh sách (lọc `search`, `status`) | OPERATIONS |
| `GET /api/payments/booking/{bookingId}` | Payment của một booking | chủ booking hoặc OPERATIONS |
| `PATCH /api/payments/{paymentId}/paid` | **Lễ tân gõ đúng `transactionCode`** để set `PAID` | OPERATIONS |
| `POST /api/payments/{paymentId}/refund` | Refund | OPERATIONS trừ RECEPTIONIST |

- Enums: `PaymentMethod{QR, CARD, AT_SPA}`, `PaymentStatus{UNPAID, PAID, FAILED, REFUNDED}`.
- Error codes: `PAY_001..PAY_007` (`NOT_FOUND`, `BOOKING_NOT_FOUND`, `ALREADY_EXISTS`, `INVALID_METHOD`, `INVALID_STATUS`, `TRANSACTION_MISMATCH`, `ACCESS_DENIED`).
- QR payload sinh tại `PaymentController.java:112`: `"LUNARA|" + code + "|" + amount` — **không phải VietQR/EMVCo**, không quét được bằng app ngân hàng. UI gọi nó đúng bản chất: `aria-label="Mã QR thanh toán nội bộ Lunara"`.
- Không có webhook, không có đối soát, không có bảng lưu giao dịch ngân hàng.
- `PaymentStatus.FAILED` có trong enum nhưng **không code nào set** (chỉ dữ liệu seed có).

**Hệ quả:** muốn có thanh toán thật thì phải (a) sinh QR đúng chuẩn VietQR/EMVCo, và (b) có đường nhận xác nhận từ ngân hàng (webhook).

---

## 2. SePay: ranh giới giữa API và dashboard

Điều này quan trọng để không mất thời gian đi sai đường:

| Việc | Có API không | Ghi chú |
| --- | --- | --- |
| Đọc tài khoản ngân hàng, giao dịch, VA | **Có** | `GET https://userapi-sandbox.sepay.vn/v2/bank-accounts`, `/v2/transactions`, `/v2/bank-accounts/{id}/va` — `Authorization: Bearer <token>` |
| Tạo VA theo đơn hàng | Có, giới hạn ngân hàng | Chỉ BIDV DN / Sacombank CN-HKD / Vietcombank DN-HKD |
| **Tạo/sửa webhook** | **KHÔNG** | Chỉ làm được trên dashboard `my.sepay.vn` |
| **Mô phỏng giao dịch** | **KHÔNG** | Chỉ có form "Mô phỏng giao dịch" trong Test mode |
| BankHub (sản phẩm khác) | Có API webhook riêng | `https://bankhub-api-sandbox.sepay.vn`, nhưng xác thực bằng `client_id`/`client_secret` phải xin SePay cấp |

Đã kiểm chứng bằng cách dò trực tiếp: mọi path lạ trên `userapi-sandbox.sepay.vn` đều trả `405` (kể cả path bịa đặt) → không thể kết luận route tồn tại từ mã lỗi đó.

**Yêu cầu của webhook SePay** (đúng cho cả Test mode):
- Trả `HTTP 200/201` + body **đúng** `{"success": true}` trong **30 giây**; sai một trong ba điều kiện là bị coi thất bại và SePay tự retry (tối đa 7 lần), admin cũng có thể "Phát lại" thủ công ⇒ endpoint **phải idempotent**.
- 4 cách xác thực: Không xác thực (chỉ nên dùng khi test), API Key (`Authorization: Apikey ...`), **HMAC-SHA256** (khuyến nghị: ký `{timestamp}.{raw_body}`, header `X-SePay-Signature: sha256=...` + `X-SePay-Timestamp`, chống replay ±5 phút, **phải đọc raw body**), OAuth 2.0.
- Payload: `id` (khoá chống trùng, không đổi qua retry), `gateway`, `transactionDate`, `accountNumber`, `subAccount` (VA khớp), `code` (mã thanh toán trích theo cấu hình công ty, có thể rỗng), `content`, `transferType` (`in`/`out`), `description`, `transferAmount`, `accumulated`, `referenceCode`.
- Test mode cho phép endpoint **HTTP hoặc self-signed** → chỉ cần `cloudflared`/`ngrok` là test được.
- Hạn mức Test mode: 500 giao dịch mô phỏng/ngày, 100 VA/tài khoản, 50 API token.

---

## 3. Việc đã làm trên SePay (có bằng chứng)

1. **Xác minh token sandbox** bạn cung cấp: `GET /v2/bank-accounts` → 200. Tài khoản test: **LUNARA SPA** · MBBank (BIN `970422`) · STK `0000000001` · loại hộ kinh doanh.
2. **VA hiện có**: `SBSEPAYB9J6MQALS3PC` (VA chính thức, tĩnh, label "Khách 1").
3. **Giao dịch cũ**: 2 giao dịch (100.000đ và 1.000.000đ) đều `code=''` và `webhook_success=0`.
4. **Đã tạo webhook mới** trong Test mode (qua trình duyệt, vì API không có):
   - Tên: **Lunara tunnel test**
   - URL: `https://folder-residents-bridge-sacramento.trycloudflare.com/api/payments/sepay/webhook`
   - Loại: **Có tiền vào** · Tài khoản: Tất cả · Xác thực: **Không xác thực** (để test trước)
   - Bằng chứng: toast xanh **"Thêm thành công"**, danh sách hiện **2 webhook**.
5. **Đã nhận được giao hàng thật** — dùng tính năng **"Gửi thử"** (menu ba chấm của webhook), receiver ghi lại lúc `2026-09-20T12:17:23`:

```json
{"id":0,"gateway":"SePay","transactionDate":"2026-09-20 12:17:22","accountNumber":"0000000000",
 "subAccount":null,"transferType":"in","transferAmount":10000,"accumulated":10000,
 "code":"SEPAYTEST","content":"SEPAY TEST WEBHOOK (sandbox)",
 "referenceCode":"TEST1789881442","description":"SePay sandbox test webhook delivery"}
```

Receiver trả `HTTP 200 {"success": true}` — đúng điều kiện SePay yêu cầu.

**Tiến trình đang chạy để test** (tắt thì webhook sẽ chết theo):
- Receiver: `python3 webhook_receiver.py 8787` — PID 16905, log ở `webhook_log.jsonl` (thư mục scratchpad của phiên).
- Tunnel: `cloudflared tunnel --url http://127.0.0.1:8787` — PID 17240, URL quick tunnel (đổi mỗi lần chạy).
- Dừng: `kill 16905 17240`.

---

## 4. Vì sao webhook cũ `xác thực thanh toán` trả 401

**Kết luận: không phải sai API Key/Secret Key. Endpoint không tồn tại.**

Bằng chứng (thăm dò trực tiếp `https://backend-production-5c2b.up.railway.app`):

| Gọi thử | Kết quả |
| --- | --- |
| `POST /webhooks/sepay` | **401** `{"success":false,"status":401,"message":"Unauthorized"}` + `WWW-Authenticate: Bearer` |
| `POST /khong-ton-tai-xyz` (path bịa) | **401** y hệt |
| `GET /` | **401** y hệt |
| `GET /api/services` | **200** (trả 7 dịch vụ tiếng Việt — dữ liệu v1) |
| `GET /api/staff` | 200 |
| `POST /api/availability` | 400 kèm `BKG_004` |
| `POST /api/auth/refresh-token` | 401 kèm `AUTH_003` |
| `POST /api/auth/dev-login` | 401 (endpoint này đã bị bỏ khỏi source hiện tại) |

⇒ Build đang deploy là **backend hiện tại** (`backend/src`), và source này **không có** route SePay nào (0 tham chiếu `sepay`/`webhook`). Mọi path không khớp `permitAll` đều rơi vào `anyRequest()` → Spring Security trả 401. Giao diện SePay thấy 401 thì hiện gợi ý chung "kiểm tra API Key / Secret Key" — gợi ý đó **sai** trong trường hợp này: chữ ký HMAC trong header thậm chí chưa từng được đọc.

Hai ghi chú từ payload lỗi:
- `"code": ""` → chưa cấu hình **Cấu trúc mã thanh toán**, nên không khớp được theo mã.
- `"subAccount": "SBSEPAYB9J6MQALS3PC"` → VA, là khoá khớp đáng tin nhất.

**Code tham chiếu đã có sẵn** ở nhánh `backendv1`:
- `backendv1/src/main/java/vn/lunara/backend/SepayWebhook.java` — class `SepayService` với `verify(raw, timestamp, signature)` đúng chuẩn SePay (HMAC-SHA256 trên `{timestamp}.{raw_body}`, cửa sổ ±300s, so sánh constant-time) + chèn idempotent `INSERT IGNORE INTO webhook_inbox`, cấu hình qua `@Value("${app.sepay.hmac-secret}")` và `app.sepay.account`.
- `backendv1/src/test/java/vn/lunara/backend/SepaySignatureTest.java` — test chấp nhận chữ ký đúng và **từ chối body bị sửa**.
- `backendv1/sepay-gateway.md` — ghi STK/NAME của tài khoản nhận.

Port được, nhưng phải đổi sang schema hiện tại (`payments`/`bookings`/`booking_events`) thay vì `webhook_inbox`.

---

## 5. Lỗi "Thời gian giữ chỗ đã hết. Vui lòng liên hệ spa nếu cần hỗ trợ."

**Nguyên nhân: gate 15 phút ở frontend, và backend không thực thi hạn này.**

- Backend **chỉ tính** hạn giữ chỗ: `BookingServiceImpl.java:688` → `holdExpiresAt = booking.createdAt + 15 phút`, đưa vào `BookingDetailResponse`.
- Frontend `CheckoutPage.tsx`:
  - dòng 45: `remaining = holdExpiresAt && status === 'PENDING_PAYMENT' ? max(0, ceil((holdExpiresAt - now)/1000)) : 0`
  - dòng 80: QR chỉ render khi `payment.status === 'UNPAID' && booking.status === 'PENDING_PAYMENT' && remaining > 0`
  - dòng 89: hết hạn → hiện đúng câu chữ trên
  - dòng 82: và ngay cả trong 15 phút đầu, QR chỉ hiện nếu `payment.qrPayload` có giá trị (chỉ method `QR` mới có)
- **Không có enforcement nào ở server**: grep toàn backend — không job định kỳ, không đổi trạng thái, không giải phóng slot khi hết hạn (chỉ có 1 `@Scheduled` duy nhất là heartbeat SSE). `PATCH /api/payments/{id}/paid` cũng **không** kiểm tra hạn.

⇒ Mâu thuẫn: UI nói "hết hạn, liên hệ spa" nhưng slot **vẫn bị chiếm** và lễ tân **vẫn xác nhận thanh toán được bình thường**.

**Vì sao mới thấy**: mọi booking `PENDING_PAYMENT` trong DB đều đã quá 15 phút từ lâu — booking 602 tạo cách 1.113 phút (~18,5 giờ), các booking khác ~7.050–7.170 phút (~5 ngày). Với dữ liệu seed v1 (snapshot `2026-09-15`) thì **100%** booking mẫu đều quá hạn, nên chỉ booking **tạo mới** mới thấy QR.

---

## 6. Việc cần làm tiếp (kèm khuyến nghị)

### 6.1 Endpoint SePay trong backend hiện tại — ưu tiên 1
- `POST /webhooks/sepay` (hoặc `/api/payments/sepay/webhook`); **phải** `permitAll` cho đúng path này, nếu không sẽ lặp lại đúng lỗi 401 ở mục 4.
- Verify HMAC-SHA256 theo `{timestamp}.{raw_body}`, cửa sổ ±5 phút, so sánh constant-time, đọc **raw body**.
- Chống trùng theo `id` giao dịch (unique) — SePay retry + replay thủ công.
- Khớp payment theo `subAccount` (VA) trước, `code` sau; kiểm tra `transferAmount >= payment.amount`, payment đang `UNPAID`.
- Sau khi khớp: **tái dùng đúng logic `PATCH /api/payments/{id}/paid`** (set `PAID` → booking `PENDING_PAYMENT`→`CONFIRMED` → ghi `booking_events` → publish realtime), không viết đường thứ hai.
- Cấu hình: `app.sepay.hmac-secret`, `app.sepay.account`/VA vào env; **không hardcode** (bài học từ `backendv1/.env` không có biến SEPAY_* nào).
- Kèm test kiểu `SepaySignatureTest` (nhận chữ ký đúng, từ chối body bị sửa).

### 6.2 Chỗ lưu giao dịch ngân hàng — cần quyết định
Schema hiện **không có** bảng nào cho giao dịch ngân hàng ⇒ không có chỗ chống trùng/đối soát bền vững.
Đề xuất bảng `sepay_transactions(sepay_id UNIQUE, gateway, account_number, sub_account, code, content, transfer_amount, transaction_date, raw_payload, matched_payment_id, status, created_at)`.
Lưu ý: `database/Web_DataBase_USTH.sql` là file **drop database** — thêm bảng đồng nghĩa phải chốt cách migration, nếu không sẽ mất dữ liệu khi seed lại.

### 6.3 QR đúng chuẩn — ưu tiên 2
`qr_payload` phải là chuỗi **VietQR/EMVCo** (BIN + số TK/VA + số tiền + nội dung = `transaction_code`) thì app ngân hàng mới quét được. UI đã sẵn (`QRCodeSVG` render chuỗi bất kỳ) nên chỉ đổi chỗ sinh payload.
Cách chính xác nhất khi đối soát: mỗi payment một **VA riêng**, QR trỏ vào VA đó, khớp theo `subAccount`.

### 6.4 Cấu hình mã thanh toán — cần bạn tự làm
Vào **Công ty → Cấu hình chung → Cấu trúc mã thanh toán**, thêm tiền tố `PAY` để trường `code` được trích. Lưu ý đây là cấu hình **dùng chung với Live** nên tôi không tự đổi; và mã hiện tại có dạng `PAY-YYYYMMDD-#####` (có dấu gạch ngang) — cần kiểm tra chip nhận diện trong form Mô phỏng giao dịch xem parser có nuốt được hay không.

### 6.5 Sửa gate giữ chỗ QR — chọn 1 trong 3
1. **Bỏ điều kiện `remaining > 0`** (1 dòng ở `CheckoutPage.tsx:80`), vẫn hiện QR kèm cảnh báo "đã quá thời gian giữ chỗ, vẫn có thể thanh toán". Khuyến nghị — hợp với luồng lễ tân xác nhận thủ công.
2. Đưa hạn thành cấu hình (`app.booking.hold-minutes`, mặc định 15) + chỉ cảnh báo, không chặn.
3. Làm "giữ chỗ" cho thật: job quét booking `PENDING_PAYMENT` quá hạn → giải phóng slot. Cần lifecycle mới vì schema **không có** `CANCELLED` → để sau.

### 6.6 Việc vệ tinh
- Chuyển webhook `Lunara tunnel test` sang **HMAC-SHA256** khi backend đã verify chữ ký (hiện để "Không xác thực").
- Tunnel hiện là quick tunnel tạm — production phải là domain thật (hoặc named tunnel) + TLS.
- `payment/Guide.md:140` ghi "thanh toán xong chuyển sang `PENDING`" trong khi code chuyển `CONFIRMED` → sửa tài liệu cho khớp.

---

## 7. Cách kiểm chứng nhanh

```bash
# 1) Đọc giao dịch sandbox (xem webhook_success đã thành 1 chưa)
curl -sS -H "Authorization: Bearer <SANDBOX_API_TOKEN>" \
  "https://userapi-sandbox.sepay.vn/v2/transactions?per_page=3"

# 2) Webhook đang nhận gì (log của receiver)
cat <scratchpad>/webhook_log.jsonl | tail -3

# 3) Endpoint đã sống chưa (sau khi code xong) — phải KHÁC 401
curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://<domain>/webhooks/sepay \
  -H "Content-Type: application/json" -d '{}'   # kỳ vọng 400/401-có-body-của-mình, KHÔNG phải 401 chung của Spring

# 4) Tạo booking mới rồi mở checkout trong 15 phút để thấy QR
```

---

## 8. Bằng chứng đã dùng (để tra lại)

- Code: `backend/src/main/java/com/kevin/lunaraspa/payment/{PaymentController.java, Guide.md, entity/Payment.java, exception/PaymentErrorCode.java}`;
  `frontend/lunara/src/pages/CheckoutPage.tsx:24,27,45,80,82,89`; `backend/.../booking/service/impl/BookingServiceImpl.java:688`.
- Nhánh cũ: `git show backendv1:backendv1/src/main/java/vn/lunara/backend/SepayWebhook.java`,
  `git show backendv1:backendv1/src/test/java/vn/lunara/backend/SepaySignatureTest.java`.
- API SePay: `userapi-sandbox.sepay.vn/v2/{bank-accounts, transactions, bank-accounts/{id}/va}`;
  tài liệu `developer.sepay.vn/vi/sepay-webhooks/{tich-hop-webhook, xac-thuc}`, `/vi/tien-ich-khac/test-mode/*`.
- Thăm dò Railway: `backend-production-5c2b.up.railway.app` (các path ở mục 4).
- DB local (docker, port 3307): bảng `bookings` + `payments` (kết quả truy vấn ở mục 5).
