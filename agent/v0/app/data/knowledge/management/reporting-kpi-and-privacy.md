---
doc_id: reporting-kpi-and-privacy
title: Báo cáo, KPI và quyền riêng tư dữ liệu
audience: MANAGEMENT
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/management/reporting-kpi-and-privacy
---

# Báo cáo, KPI và quyền riêng tư dữ liệu (quản trị)

> [!NOTE]
> Đây là **chính sách quản trị dạng nháp chưa được phê duyệt** (`audience: MANAGEMENT`, `approved_by: null`). Chỉ dùng nội bộ cho `OWNER`, `MANAGER`, `ACCOUNTANT`. Đây là bản đề xuất, chưa có hiệu lực chính thức.

## 1. Mục đích và phạm vi

- Hướng dẫn đọc báo cáo, theo dõi KPI và bảo vệ dữ liệu khách.
- Áp dụng cho vai trò có quyền xem báo cáo và dữ liệu vận hành.
- Nhấn mạnh ranh giới giữa số liệu tổng hợp và dữ liệu cá nhân.

## 2. Nguồn dữ liệu báo cáo

- Báo cáo lấy theo khoảng thời gian với tham số `from` và `to`.
- Khoảng thời gian tối đa **366 ngày**.
- Tham số `groupBy` nhận một trong ba giá trị: `DAY`, `WEEK`, `MONTH`.

| Tham số | Mô tả |
| :--- | :--- |
| `from` | Ngày bắt đầu |
| `to` | Ngày kết thúc |
| `groupBy` | `DAY` / `WEEK` / `MONTH` |

- Báo cáo chuỗi thời gian trả về số booking, số booking hoàn thành và doanh thu đã thu cho mỗi kỳ.

## 3. Chỉ số trên dashboard

| Chỉ số | Ý nghĩa |
| :--- | :--- |
| Tổng số khách | Số hồ sơ khách trong hệ thống |
| Tổng số nhân sự | Số hồ sơ nhân sự |
| Dịch vụ đang hoạt động | Số dịch vụ `is_active` |
| Tổng số booking | Số booking trong hệ thống |
| Booking hôm nay | Booking có giờ bắt đầu trong hôm nay |
| Booking hoàn thành | Booking ở trạng thái `COMPLETED` |
| Thanh toán chờ | Số payment `UNPAID` |
| Doanh thu hôm nay | Tổng tiền đã thu trong ngày |
| Điểm đánh giá trung bình | Trung bình điểm phản hồi (1–5) |

## 4. Định nghĩa KPI chính

| KPI | Cách tính gợi ý |
| :--- | :--- |
| Doanh thu đã thu | Tổng payment `PAID` trong kỳ |
| Tỷ lệ hoàn thành | Booking `COMPLETED` ÷ tổng booking |
| Tỷ lệ no-show | Số no-show ÷ tổng booking |
| Điểm hài lòng | Trung bình điểm phản hồi |
| Utilisation | Xem `staffing-roster-and-utilization.md` |

- KPI được tính trên số liệu hệ thống, không tính thủ công ngoài hệ thống.

## 5. Cách đọc báo cáo

- Chọn khoảng thời gian và `groupBy` phù hợp câu hỏi.
- So sánh giữa các kỳ để nhận ra xu hướng.
- Kiểm tra doanh thu gắn với trạng thái `PAID`, không tính khoản chưa thu.

> [!NOTE]
> Booking ở trạng thái `PENDING_PAYMENT` chưa được coi là doanh thu vì khách chưa thanh toán.

## 6. Quyền truy cập báo cáo

| Vai trò | Quyền gợi ý |
| :--- | :--- |
| `OWNER` | Toàn bộ báo cáo |
| `MANAGER` | Vận hành, nhân sự, doanh thu |
| `ACCOUNTANT` | Payment và báo cáo tài chính |
| `RECEPTIONIST` | Không mặc định có báo cáo doanh thu |

- Quyền được kiểm tra theo hành động, không chỉ theo tên vai trò.
- Không chia sẻ số liệu doanh thu cho vai trò không được cấp quyền.

## 7. Quyền riêng tư dữ liệu khách

- Dữ liệu khách chỉ dùng cho vận hành đặt lịch và chăm sóc.
- Không chia sẻ cho bên thứ ba khi chưa được khách đồng ý.
- Chỉ nhân sự có quyền mới được xem thông tin cá nhân và sức khoẻ.

## 8. Vòng đời dữ liệu và quyền của khách

| Quyền của khách | Mô tả |
| :--- | :--- |
| Xem dữ liệu | Yêu cầu xem dữ liệu cá nhân đang lưu |
| Xoá dữ liệu | Yêu cầu xoá dữ liệu cá nhân theo quy định |

- Yêu cầu được xử lý theo quy trình nội bộ và ghi nhận lại.
- Không lưu dữ liệu cá nhân quá thời gian cần thiết.

## 9. Chia sẻ nội bộ và với bên thứ ba

- Nội bộ: chỉ chia sẻ trong phạm vi công việc cần thiết.
- Bên thứ ba: chỉ chia sẻ khi có cơ sở pháp lý và sự đồng ý của khách.
- Dữ liệu sức khoẻ có mức bảo vệ cao hơn dữ liệu liên hệ thông thường.

## 10. Audit và trách nhiệm

- Ghi nhận ai truy cập hoặc thay đổi dữ liệu quan trọng.
- Hạn chế xuất dữ liệu khách ra ngoài hệ thống.
- Có quy trình xử lý khi phát hiện truy cập bất thường.

## 11. Nguồn dữ liệu nghiên cứu không dùng cho Retrieval

- Tài liệu thu thập từ các spa khác chỉ dùng để **tham khảo cách trình bày**, lưu ở thư mục riêng.
- Các tài liệu đó **không** là sự thật về Lunara và **không được đưa vào retrieval**.
- Trợ lý chỉ trả lời dựa trên corpus đã được duyệt của Lunara; nếu thiếu thông tin, trả lời “chưa có thông tin đã được xác nhận”.
