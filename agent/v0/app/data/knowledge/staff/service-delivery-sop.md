---
doc_id: service-delivery-sop
title: SOP thực hiện dịch vụ
audience: STAFF
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/staff/service-delivery-sop
---

# SOP thực hiện dịch vụ (nội bộ)

> [!NOTE]
> Đây là **SOP nội bộ dạng nháp chưa được phê duyệt** (`audience: STAFF`, `approved_by: null`). Dành cho `THERAPIST` và các vai trò vận hành liên quan. Backend là nguồn đúng duy nhất cho trạng thái và thời lượng booking.

## 1. Mục đích và phạm vi

- Chuẩn hoá quy trình chuẩn bị, bắt đầu, thực hiện và kết thúc dịch vụ.
- Áp dụng cho `THERAPIST`, có sự phối hợp của `RECEPTIONIST`.
- Bảo đảm an toàn, vệ sinh và chất lượng trải nghiệm.

## 2. Chuẩn bị trước liệu trình

| Bước | Thao tác |
| :--- | :--- |
| 1 | Kiểm tra agenda/danh sách booking được giao |
| 2 | Đọc ghi chú sức khoẻ và yêu cầu của khách |
| 3 | Chuẩn bị phòng, dụng cụ và sản phẩm |
| 4 | Kiểm tra ánh sáng, nhiệt độ và âm thanh |
| 5 | Bảo đảm thời gian buffer chuẩn bị đã được dùng |

- Chỉ nhận dịch vụ thuộc chuyên môn được phân công.
- Nếu khách có ghi chú sức khoẻ đặc biệt, xác nhận lại trước khi bắt đầu.

## 3. Buffer chuẩn bị và dọn dẹp

- Mỗi dịch vụ có **preparation buffer** và **cleanup buffer** do hệ thống tự cộng vào lịch trống.
- Buffer chuẩn bị dùng để setup; buffer dọn dẹp dùng để vệ sinh và đổi khăn.
- Không dùng thời gian buffer của dịch vụ này chiếm dịch vụ kế tiếp.

| Loại buffer | Việc cần làm |
| :--- | :--- |
| Preparation | Trải giường, bày sản phẩm, kiểm tra nhiệt độ phòng |
| Cleanup | Thay khăn trải, vệ sinh dụng cụ, mở cửa thông khí |

## 4. Đọc và xác nhận hồ sơ sức khoẻ

- Xác nhận khách đã khai báo sức khoẻ.
- Ghi nhận dị ứng, thương tích, thai kỳ, phẫu thuật gần đây.
- Trao đổi phạm vi và lực tác động với khách trước khi bắt đầu.

## 5. Bắt đầu dịch vụ

| Bước | Thao tác |
| :--- | :--- |
| 1 | Đón khách vào phòng, giới thiệu các bước |
| 2 | Xác nhận booking đang ở `CHECKED_IN` |
| 3 | Bấm bắt đầu để chuyển sang `IN_SERVICE` |
| 4 | Ghi nhận thời điểm bắt đầu |

- Không bắt đầu khi booking chưa được check-in.
- Nếu booking sai trạng thái, liên hệ lễ tân để xử lý.

## 6. Trong suốt liệu trình

- Theo dõi phản hồi của khách và điều chỉnh lực tác động.
- Giữ không gian yên tĩnh, tôn trọng sự riêng tư và che phủ chuyên nghiệp.
- Dừng hoặc điều chỉnh nếu khách thấy khó chịu.

## 7. Kết thúc dịch vụ

| Bước | Thao tác |
| :--- | :--- |
| 1 | Thông báo khách đã kết thúc liệu trình |
| 2 | Bấm hoàn thành để chuyển sang `COMPLETED` |
| 3 | Ghi nhận thời điểm hoàn thành |
| 4 | Hướng dẫn khách nghỉ ngơi và di chuyển an toàn |

- Chỉ hoàn thành khi dịch vụ đang ở `IN_SERVICE`.

## 8. An toàn và vệ sinh

- Vệ sinh tay trước và sau mỗi liệu trình.
- Dùng khăn và dụng cụ sạch cho mỗi khách.
- Tuân thủ quy trình vệ sinh phòng giữa các ca.

## 9. Ghi chú nội bộ

- Ghi ghi chú ngắn gọn, chỉ những thông tin cần cho lần phục vụ sau.
- Không ghi nhận xét nhạy cảm hoặc thông tin không liên quan.
- Không chia sẻ ghi chú nội bộ ra ngoài hệ thống.

## 10. Xử lý sự cố

| Sự cố | Hướng xử lý |
| :--- | :--- |
| Khách thấy đau hoặc chóng mặt | Dừng liệu trình, hỗ trợ khách, báo lễ tân |
| Khách phản hồi tiêu cực | Ghi nhận, báo quản lý |
| Sự cố thiết bị/phòng | Tạm dừng, sắp xếp phòng khác nếu có |

- Mọi sự cố được ghi nhận vào sự kiện booking để theo dõi.

## 11. Bàn giao

- Bàn giao phòng sạch, sẵn sàng cho dịch vụ kế tiếp.
- Cập nhật trạng thái booking trước khi rời ca.
- Thông báo cho lễ tân các trường hợp cần theo dõi.
