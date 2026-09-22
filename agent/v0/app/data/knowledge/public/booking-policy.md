---
doc_id: booking-policy
title: Chính sách đặt lịch Lunara
audience: PUBLIC
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/public/booking-policy
---

# Chính sách đặt lịch Lunara

> [!NOTE]
> Đây là **bản nháp (draft) chưa được phê duyệt** (`status: draft`, `approved_by: null`). Nội dung do nhóm vận hành Lunara đề xuất và có thể thay đổi trước khi ban hành chính thức. Khi có khác biệt giữa tài liệu này và màn hình đặt lịch, hãy ưu tiên thông tin hiển thị trong hệ thống.

## 1. Mục đích và phạm vi

- Giải thích cách khách đặt, xác nhận và quản lý lịch hẹn tại Lunara Spa.
- Áp dụng cho khách hàng cá nhân đặt lịch qua web/ứng dụng hoặc nhờ lễ tân đặt giúp.
- Không áp dụng cho sự kiện riêng, đoàn đông hoặc hợp đồng doanh nghiệp — các trường hợp này xử lý theo thoả thuận riêng.

## 2. Giờ mở cửa và khung nhận lịch

| Hạng mục | Giá trị |
| :--- | :--- |
| Giờ mở cửa | 09:00 – 21:00, hằng ngày |
| Giờ nhận lịch hẹn cuối cùng | 19:30 |
| Kênh đặt lịch | Web/ứng dụng Lunara, lễ tân, Zalo OA |

- Liệu trình cần kết thúc trước 21:00, vì vậy khung giờ bắt đầu muộn nhất là 19:30.
- Giờ mở cửa áp dụng cho cả ngày lễ, trừ khi Lunara thông báo khác trên ứng dụng.

## 3. Kênh đặt lịch

- **Web/ứng dụng Lunara:** khách tự chọn dịch vụ, thời lượng và khung giờ còn trống.
- **Lễ tân:** đặt qua điện thoại, Zalo OA hoặc trực tiếp tại quầy.
- **Zalo OA “Lunara Spa”:** dùng để đặt lịch và nhận nhắc hẹn.

## 4. Thời gian đặt trước

| Quy tắc | Giá trị |
| :--- | :--- |
| Đặt trước tối thiểu (khuyến nghị) | 2 giờ |
| Đặt trước tối đa | 30 ngày |
| Khung giờ cao điểm | Cuối tuần và buổi tối sau 17:00 |

- Nên đặt trước tối thiểu 2 giờ để Lunara kịp xếp phòng và kỹ thuật viên.
- Hệ thống cho phép chọn ngày trong vòng 30 ngày kể từ hôm nay.
- Khung giờ cao điểm có thể hết chỗ sớm; khách nên đặt sớm hơn.

## 5. Xác nhận lịch và trạng thái booking

Một lịch hẹn đi qua các trạng thái sau trong hệ thống:

| Trạng thái | Ý nghĩa |
| :--- | :--- |
| `PENDING_PAYMENT` | Đã tạo lịch, đang chờ thanh toán |
| `PENDING` | Đã ghi nhận, đang chờ Lunara xác nhận |
| `CONFIRMED` | Đã xác nhận, khách có mặt đúng giờ |
| `CHECKED_IN` | Khách đã được lễ tân check-in |
| `IN_SERVICE` | Kỹ thuật viên đã bắt đầu liệu trình |
| `COMPLETED` | Liệu trình đã hoàn thành |

- Lịch ở trạng thái `PENDING_PAYMENT` **phải được thanh toán** thì mới chuyển sang `CONFIRMED`.
- Nếu chưa thanh toán trong thời gian giữ chỗ, Lunara có thể giải phóng khung giờ cho khách khác.

## 6. Thông tin cần cung cấp khi đặt lịch

- Họ tên, số điện thoại và email liên hệ.
- Dịch vụ mong muốn và thời lượng (nếu điều chỉnh được).
- Số lượng khách trong cùng lịch.
- Ghi chú sức khoẻ quan trọng (xem `health-safety-pregnancy-age.md`).
- Mã khuyến mãi nếu có.

## 7. Nhiều dịch vụ trong một lịch

- Khách có thể ghép nhiều dịch vụ trong cùng một lịch hẹn.
- Mỗi dịch vụ chỉ xuất hiện một lần trong cùng một lịch.
- Thời lượng của cả lịch là tổng thời lượng các dịch vụ; hệ thống tự cộng thêm thời gian chuẩn bị và dọn dẹp (buffer) của từng dịch vụ.

## 8. Thay đổi, huỷ và đến muộn

- Huỷ hoặc đổi lịch miễn phí khi báo trước **từ 6 giờ** trở lên.
- Báo trước **dưới 6 giờ** thu **50%** giá trị dịch vụ.
- **Không đến (no-show)** thu **100%** giá trị dịch vụ.
- Đến muộn quá 15 phút có thể bị rút ngắn thời lượng hoặc phải dời lịch.
- Chi tiết xem tại `cancellation-late-arrival.md`.

## 9. Liên hệ hỗ trợ đặt lịch

| Kênh | Thông tin |
| :--- | :--- |
| Hotline | 1900 0000 |
| Zalo OA | Lunara Spa |
| Email | hello@lunara-spa.demo |
