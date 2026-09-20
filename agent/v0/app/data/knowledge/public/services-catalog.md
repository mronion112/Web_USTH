---
doc_id: services-catalog
title: Danh mục dịch vụ Lunara
audience: PUBLIC
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/public/services-catalog
---

# Danh mục dịch vụ Lunara

> [!NOTE]
> Đây là **bản nháp (draft) chưa được phê duyệt** (`approved_by: null`). Tài liệu này **không ghi giá cụ thể**. Giá và thời lượng của từng dịch vụ được lấy **theo thời gian thực** từ hệ thống đặt lịch; danh sách dịch vụ đang hoạt động cũng lấy từ hệ thống.

## 1. Giới thiệu

- Tài liệu mô tả các **nhóm dịch vụ** của Lunara, không liệt kê giá.
- Mục đích: giúp khách hiểu cấu trúc dịch vụ và cách tính thời lượng/giá.
- Danh sách dịch vụ có thể thay đổi; luôn kiểm tra trên ứng dụng để thấy thông tin mới nhất.

## 2. Các nhóm dịch vụ

| Nhóm | Mô tả chung | Điều chỉnh thời lượng |
| :--- | :--- | :--- |
| Massage cơ thể | Liệu trình thư giãn và tác động cơ | Thường có |
| Chăm sóc da mặt | Làm sạch, dưỡng và chăm sóc da | Tuỳ dịch vụ |
| Tẩy tế bào chết & ủ dưỡng | Làm sạch và dưỡng da toàn thân | Tuỳ dịch vụ |
| Chăm sóc vùng (đầu, cổ, vai, chân) | Tập trung giải toả vùng mỏi | Thường có |
| Liệu trình thư giãn chuyên sâu | Kết hợp nhiều bước chăm sóc | Tuỳ dịch vụ |

> [!NOTE]
> Tên nhóm dịch vụ trong tài liệu là mô tả khái quát. Tên chính xác của từng dịch vụ hiển thị trên ứng dụng đặt lịch.

## 3. Cách tính thời lượng

- Mỗi dịch vụ có **thời lượng tối thiểu** cố định.
- Một số dịch vụ **điều chỉnh được thời lượng** theo từng bước (ví dụ tăng theo bước cố định).
- Với dịch vụ không điều chỉnh được, khách dùng đúng thời lượng tối thiểu.

| Thuộc tính | Ý nghĩa |
| :--- | :--- |
| `minimum_duration_minutes` | Thời lượng tối thiểu |
| `is_duration_adjustable` | Dịch vụ có điều chỉnh thời lượng được không |
| `duration_step_minutes` | Số phút mỗi bước tăng thêm |

## 4. Cách tính giá

Công thức giá một dịch vụ:

> **Giá = Giá cơ bản + (Số bước tăng thêm × Giá mỗi bước)**

| Thuộc tính | Ý nghĩa |
| :--- | :--- |
| `base_price` | Giá tại thời lượng tối thiểu |
| `price_per_duration_step` | Giá cộng thêm cho mỗi bước thời lượng |
| Số bước tăng thêm | (Thời lượng chọn − Thời lượng tối thiểu) ÷ Bước thời lượng |

- Với dịch vụ thời lượng cố định, giá luôn bằng giá cơ bản.
- Giá hiển thị trong hệ thống là giá **chưa gồm** VAT 8% và phí phục vụ 5%.

## 5. Buffer chuẩn bị và dọn dẹp

- Mỗi dịch vụ có thời gian **chuẩn bị** (preparation buffer) và **dọn dẹp** (cleanup buffer).
- Hệ thống **tự cộng** các buffer này khi tính lịch trống.
- Buffer không được tính vào thời lượng khách trải nghiệm và không làm tăng giá dịch vụ.

| Loại buffer | Vai trò |
| :--- | :--- |
| Preparation buffer | Chuẩn bị phòng và dụng cụ trước liệu trình |
| Cleanup buffer | Dọn dẹp và làm sạch sau liệu trình |

## 6. Chọn kỹ thuật viên

- Hệ thống có thể tự gán kỹ thuật viên phù hợp với dịch vụ và khung giờ.
- Khách có thể nêu mong muốn về kỹ thuật viên khi đặt lịch; Lunara sắp xếp nếu còn phù hợp.
- Kỹ thuật viên chỉ nhận dịch vụ thuộc chuyên môn được phân công.

## 7. Ghép nhiều dịch vụ trong một lịch

- Khách có thể ghép nhiều dịch vụ trong cùng một lịch hẹn.
- Tổng thời lượng là tổng thời lượng các dịch vụ cộng buffer liên quan.
- Mỗi dịch vụ chỉ xuất hiện một lần trong cùng một lịch.

## 8. Xem giá và thời lượng theo thời gian thực

- Giá và thời lượng chính xác luôn hiển thị trên ứng dụng khi chọn dịch vụ.
- Trợ lý của Lunara có thể lấy danh mục dịch vụ trực tiếp từ hệ thống khi khách hỏi.
- Nếu không chắc chắn, khách nên hỏi lễ tân để được xác nhận.

## 9. Liên hệ

| Kênh | Thông tin |
| :--- | :--- |
| Hotline | 1900 0000 |
| Zalo OA | Lunara Spa |
| Email | hello@lunara-spa.demo |
