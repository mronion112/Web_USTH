# Knowledge corpus của Lunara Assistant (v0)

Thư mục này chứa **curated knowledge** cho Lunara Assistant — phần nội dung tĩnh (chính sách, FAQ, SOP nội bộ, chính sách quản trị) mà trợ lý được phép truy xuất để trả lời khách và nhân sự.

> [!WARNING]
> Toàn bộ tài liệu trong thư mục này đang ở trạng thái **draft (chưa được phê duyệt)**. Mọi file có `status: draft`, `effective_from: null` và `approved_by: null`. Nội dung **không** được coi là chính sách chính thức cho tới khi có người có thẩm quyền phê duyệt và cập nhật lại frontmatter.

## 1. Mục đích

- Cung cấp nguồn kiến thức có kiểm soát cho tool `search_knowledge(query, audience)`.
- Tách biệt nội dung dành cho khách (PUBLIC), nhân sự (STAFF) và quản trị (MANAGEMENT).
- Giữ policy/FAQ tách khỏi dữ liệu động (giá, lịch trống, trạng thái booking) vốn luôn lấy realtime từ backend.

## 2. Nguồn gốc và cách soạn

- Nội dung được **biên soạn riêng cho Lunara**, dựa trên:
  - Giá trị vận hành do nhóm Lunara đề xuất (giờ mở cửa, chính sách huỷ, VAT/phí phục vụ, độ tuổi, thai kỳ, bảo mật…).
  - Đối chiếu với hệ thống thật (Spring Boot + React): vòng đời booking, enum payment, thuộc tính dịch vụ, báo cáo và vai trò.
- Định dạng (heading, đánh số mục, bảng, bullet, callout) được tham khảo từ tài liệu nghiên cứu trong `docs/crawl/`, **nhưng không sao chép** nội dung, tên thương hiệu, tên liệu trình, giá hay câu chữ của các spa đó.

## 3. Cấu trúc thư mục

```text
knowledge/
├── README.md
├── public/        # audience: PUBLIC  – khách hàng, có thể công khai
│   ├── booking-policy.md
│   ├── cancellation-late-arrival.md
│   ├── spa-etiquette-and-what-to-bring.md
│   ├── health-safety-pregnancy-age.md
│   ├── pricing-payment-vat-and-tips.md
│   ├── services-catalog.md
│   └── faq-contact-and-hours.md
├── staff/         # audience: STAFF   – SOP nội bộ cho nhân sự vận hành
│   ├── booking-and-checkin-sop.md
│   ├── service-delivery-sop.md
│   ├── health-intake-and-screening-sop.md
│   └── payment-and-refund-sop.md
└── management/    # audience: MANAGEMENT – chính sách quản trị
    ├── pricing-and-promotions-policy.md
    ├── staffing-roster-and-utilization.md
    └── reporting-kpi-and-privacy.md
```

## 4. Quy tắc audience (bắt buộc trước retrieval)

- `PUBLIC`: được trả cho khách và mọi vai trò đã xác thực.
- `STAFF`: chỉ trả cho nhân sự vận hành (`THERAPIST`, `RECEPTIONIST`, `MANAGER`, `OWNER`).
- `MANAGEMENT`: chỉ trả cho `OWNER`, `MANAGER`, `ACCOUNTANT`.

Nguyên tắc:

- **Tách corpus theo audience trước khi retrieval.** Không truy xuất tài liệu STAFF/MANAGEMENT cho người dùng PUBLIC.
- Lọc theo `audience` là lớp bảo vệ đầu tiên; backend vẫn phải authorize lại mỗi request.
- Không trộn nội dung nội bộ vào câu trả lời cho khách.

## 5. Frontmatter chuẩn

Mỗi file corpus dùng frontmatter **scalar một dòng**, đúng các key sau (không dùng list/array/block scalar để đơn giản hoá bộ parse):

```text
doc_id: <trùng tên file, không đuôi .md>
title: <tiêu đề hiển thị>
audience: PUBLIC | STAFF | MANAGEMENT
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/<nhóm>/<doc_id>
```

Trong đó `<nhóm>` là thư mục audience: `public`, `staff` hoặc `management`.

## 6. Quan hệ giữa knowledge và dữ liệu động

| Loại thông tin | Nguồn | Ghi chú |
| :--- | :--- | :--- |
| Giá dịch vụ, thời lượng | Backend (realtime) | Không hard-code trong corpus |
| Lịch trống, gán nhân sự | Backend (realtime) | Cần availability API |
| Trạng thái booking/payment | Backend (realtime) | Corpus chỉ giải thích ý nghĩa |
| Chính sách, FAQ, SOP | Corpus này | Có audience, version, hiệu lực |

- `services-catalog.md` cố ý **không ghi giá cụ thể**: giá lấy realtime từ hệ thống.
- Khi corpus thiếu thông tin, trợ lý trả lời “chưa có thông tin đã được xác nhận”, không suy đoán.

## 7. Trạng thái draft và quy trình phê duyệt (đề xuất)

- Mọi tài liệu hiện là **draft chưa được duyệt**.
- Khi phê duyệt, cập nhật: `status: approved`, `effective_from`, `approved_by`, và tăng `version` nếu có sửa đổi nội dung.
- Thay đổi lớn cần người sở hữu tài liệu (`OWNER`/`MANAGER`) rà soát lại.

## 8. Cảnh báo: KHÔNG đưa `docs/crawl/` vào retrieval

> [!WARNING]
> Thư mục `docs/crawl/` chứa tài liệu thu thập từ **các spa khác**. Đây **chỉ là tài liệu nghiên cứu** để học cách trình bày.

- **Không** index, **không** embed và **không** đưa các file trong `docs/crawl/` vào knowledge base/retrieval của trợ lý.
- Dữ liệu crawl **không** phải sự thật về Lunara: giá, chính sách, tên thương hiệu và tên liệu trình của họ có thể sai thời điểm, vướng bản quyền và dễ khiến trợ lý trả lời sai thương hiệu.
- Chỉ corpus đã được duyệt trong thư mục `knowledge/` mới được dùng làm nguồn trả lời.

## 9. Quy ước viết nội dung

- Tiếng Việt có dấu, giọng văn chuyên nghiệp, súc tích.
- Mỗi file có `# Tiêu đề` và các mục `## 1.`, `## 2.`… đánh số.
- Dùng bullet và bảng markdown khi phù hợp; dùng `> [!NOTE]` cho lưu ý quan trọng.
- Độ dài mục tiêu: khoảng 60–140 dòng mỗi file.

## 10. Liên hệ nội bộ

- Hotline (công khai): 1900 0000
- Zalo OA: Lunara Spa
- Email: hello@lunara-spa.demo
- Kênh đặt lịch: web/ứng dụng Lunara
