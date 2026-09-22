---
doc_id: staffing-roster-and-utilization
title: Xếp lịch nhân sự và mức sử dụng
audience: MANAGEMENT
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/management/staffing-roster-and-utilization
---

# Xếp lịch nhân sự và mức sử dụng (quản trị)

> [!NOTE]
> Đây là **chính sách quản trị dạng nháp chưa được phê duyệt** (`audience: MANAGEMENT`, `approved_by: null`). Chỉ dùng nội bộ cho `OWNER` và `MANAGER`. Đây là bản đề xuất, chưa có hiệu lực chính thức.

## 1. Mục đích và phạm vi

- Chuẩn hoá cách xếp ca, phân công và đo mức sử dụng nguồn lực.
- Áp dụng cho quản lý nhân sự và vận hành booking.
- Hướng tới cân bằng giữa phục vụ khách và giới hạn nguồn lực.

## 2. Khái niệm nền tảng

| Khái niệm | Ý nghĩa |
| :--- | :--- |
| Giờ làm việc (`staff_working_hours`) | Khung giờ nhân viên có thể nhận việc theo thứ |
| Ngày nghỉ (`staff_time_off`) | Khoảng thời gian nhân viên không làm việc |
| Kỹ năng (`staff_services`) | Dịch vụ nhân viên được phân công thực hiện |
| Bookable | Nhân viên có thể nhận booking hay không |

- Nhân viên `is_bookable = false` không được gán booking mới.
- Chỉ gán dịch vụ nằm trong danh sách kỹ năng của nhân viên.

## 3. Ca làm việc và ngày nghỉ

| Hạng mục | Quy tắc đề xuất |
| :--- | :--- |
| Khung giờ làm việc | Theo `day_of_week` 1–7 |
| Thời điểm bắt đầu/kết thúc | `start_time` < `end_time` |
| Ngày nghỉ | Khai báo trước theo `staff_time_off` |
| Thay đổi ca | Cập nhật trước để hệ thống tính lịch đúng |

- Lịch trống phải được tính dựa trên giờ làm việc, ngày nghỉ và booking đã có.

## 4. Phân công booking

| Nguồn gán | Ý nghĩa |
| :--- | :--- |
| `SYSTEM` | Hệ thống tự gán theo kỹ năng và lịch trống |
| `CUSTOMER` | Khách chọn kỹ thuật viên khi đặt |
| `ADMIN` | Nhân sự vận hành gán/đổi thủ công |

- Ưu tiên gán theo kỹ năng phù hợp và tải công việc cân bằng.
- Ghi nhận nguồn gán để phục vụ phân tích sau này.

## 5. Khớp kỹ năng

- Mỗi dịch vụ chỉ gán cho nhân viên có kỹ năng tương ứng.
- Khi thiếu nhân sự cho một dịch vụ, cân nhắc đào tạo hoặc điều chỉnh danh mục.
- Không gán nhân viên ngoài kỹ năng để tránh rủi ro chất lượng.

## 6. Định nghĩa mức sử dụng (utilisation)

> **Utilisation = Thời gian phục vụ có thể tính phí ÷ Thời gian làm việc có sẵn**

- Thời gian làm việc có sẵn = tổng giờ trong ca trừ ngày nghỉ.
- Thời gian phục vụ tính phí = tổng thời lượng dịch vụ đã hoàn thành.
- Có thể tính theo ngày, tuần, tháng.

## 7. Buffer và năng lực phục vụ

- Buffer chuẩn bị và dọn dẹp chiếm thời gian phòng/nhân sự.
- Buffer làm giảm số booking tối đa có thể xếp trong một ca.
- Khi tính utilisation, cân nhắc tách riêng thời gian phục vụ và thời gian buffer.

## 8. Chỉ tiêu đề xuất

| Chỉ số | Mục tiêu tham khảo |
| :--- | :--- |
| Utilisation theo kỹ thuật viên | Ở mức hợp lý, tránh vượt tải |
| Booking hoàn thành | Tỷ lệ hoàn thành cao |
| No-show | Theo dõi và giảm dần |

> [!NOTE]
> Chỉ tiêu mang tính định hướng; điều chỉnh theo quy mô và mùa vụ thực tế.

## 9. Xử lý thiếu hoặc thừa nhân sự

| Tình huống | Hướng xử lý |
| :--- | :--- |
| Thiếu nhân sự giờ cao điểm | Điều chỉnh ca, ưu tiên booking sớm |
| Nhân sự thấp tải | Phân bổ lại booking, cân nhắc ca linh hoạt |
| Thiếu kỹ năng chuyên biệt | Sắp xếp đào tạo hoặc tuyển dụng |

## 10. Tôn trọng giờ làm việc và an toàn

- Không xếp booking ngoài giờ làm việc đã khai báo.
- Không chồng lịch làm việc của cùng một nhân viên.
- Bảo đảm thời gian nghỉ hợp lý giữa các liệu trình.

## 11. Liên hệ với các chính sách khác

- Vòng đời booking và trạng thái: xem `booking-and-checkin-sop.md` (STAFF).
- Chỉ số và báo cáo: xem `reporting-kpi-and-privacy.md`.
