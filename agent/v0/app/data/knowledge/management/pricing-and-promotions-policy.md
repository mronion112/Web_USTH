---
doc_id: pricing-and-promotions-policy
title: Chính sách định giá và khuyến mãi
audience: MANAGEMENT
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/management/pricing-and-promotions-policy
---

# Chính sách định giá và khuyến mãi (quản trị)

> [!NOTE]
> Đây là **chính sách quản trị dạng nháp chưa được phê duyệt** (`audience: MANAGEMENT`, `approved_by: null`). Chỉ dùng nội bộ cho `OWNER`, `MANAGER`, `ACCOUNTANT`. Đây là bản đề xuất, chưa có hiệu lực chính thức.

## 1. Mục đích và phạm vi

- Đặt nguyên tắc định giá dịch vụ, điều chỉnh thời lượng và quản lý khuyến mãi.
- Áp dụng cho cấu hình dịch vụ trong hệ thống (`services`).
- Không đưa giá cụ thể vào tài liệu này; giá là dữ liệu cấu hình trong hệ thống.

## 2. Nguyên tắc định giá

- Giá niêm yết bằng VND, **chưa gồm** VAT 8% và phí phục vụ 5%.
- Mỗi dịch vụ có giá cơ bản tại thời lượng tối thiểu.
- Dịch vụ điều chỉnh được thời lượng thì giá tăng theo từng bước cố định.
- Mọi thay đổi giá phải có người phê duyệt và lịch sử thay đổi.

## 3. Cấu trúc thuộc tính giá dịch vụ

| Thuộc tính | Ý nghĩa |
| :--- | :--- |
| `base_price` | Giá tại thời lượng tối thiểu |
| `minimum_duration_minutes` | Thời lượng tối thiểu |
| `is_duration_adjustable` | Có điều chỉnh thời lượng được không |
| `duration_step_minutes` | Số phút mỗi bước (khi điều chỉnh được) |
| `price_per_duration_step` | Giá cộng thêm mỗi bước |
| `preparation_buffer_minutes` | Buffer chuẩn bị |
| `cleanup_buffer_minutes` | Buffer dọn dẹp |
| `is_active` | Dịch vụ có đang kinh doanh không |

## 4. Công thức giá và ràng buộc

> **Giá dịch vụ = `base_price` + (Số bước tăng thêm × `price_per_duration_step`)**

- Số bước tăng thêm = (`thời lượng chọn` − `minimum_duration_minutes`) ÷ `duration_step_minutes`.
- Dịch vụ không điều chỉnh được: `price_per_duration_step` và `duration_step_minutes` để trống, giá luôn bằng `base_price`.
- Dịch vụ điều chỉnh được: `duration_step_minutes > 0` và `price_per_duration_step ≥ 0`.

## 5. Ảnh hưởng của buffer tới năng lực phục vụ

| Loại buffer | Ảnh hưởng |
| :--- | :--- |
| Preparation buffer | Chiếm thời gian phòng/staff trước liệu trình |
| Cleanup buffer | Chiếm thời gian phòng/staff sau liệu trình |

- Buffer được cộng vào khi tính lịch trống nhưng không làm tăng giá dịch vụ.
- Đặt buffer hợp lý để tránh làm giảm năng lực phục vụ không cần thiết.

## 6. VAT, phí phục vụ và tip

| Khoản | Tỷ lệ | Ghi chú |
| :--- | :--- | :--- |
| VAT | 8% | Bắt buộc trên hoá đơn |
| Phí phục vụ | 5% | Áp dụng theo chính sách |
| Tip | Tự nguyện | Không cộng tự động |

- Giá hiển thị cho khách là giá chưa gồm VAT và phí phục vụ.
- Hoá đơn phải thể hiện rõ các khoản.

## 7. Nguyên tắc khuyến mãi

- Mỗi chương trình khuyến mãi có tên, thời hạn, phạm vi dịch vụ và điều kiện áp dụng.
- Khuyến mãi cần người phê duyệt (`MANAGER`/`OWNER`).
- Không để khuyến mãi chồng lấn gây giảm giá ngoài kiểm soát.
- Ghi nhận việc áp dụng khuyến mãi trên booking để đối soát.

## 8. Quy trình thay đổi giá

| Bước | Thao tác |
| :--- | :--- |
| 1 | Đề xuất thay đổi và lý do |
| 2 | Kiểm tra tác động tới năng lực và doanh thu |
| 3 | Phê duyệt bởi `OWNER`/`MANAGER` |
| 4 | Cập nhật cấu hình dịch vụ trong hệ thống |
| 5 | Lưu lịch sử thay đổi |

> [!NOTE]
> Booking đã tạo giữ **giá tại thời điểm đặt** (snapshot), không bị ảnh hưởng bởi thay đổi giá sau đó.

## 9. Kiểm soát và audit

- Giới hạn quyền sửa giá cho vai trò phù hợp.
- Ghi nhận ai thay đổi, thay đổi gì và khi nào.
- Định kỳ rà soát bất thường về giá và khuyến mãi.

## 10. Báo cáo doanh thu liên quan

- Doanh thu lấy từ báo cáo theo khoảng thời gian (`from`/`to`, `groupBy` DAY/WEEK/MONTH).
- Dashboard cung cấp các chỉ số tổng: số booking, booking hoàn thành, doanh thu, thanh toán chờ.
- Chi tiết xem tại `reporting-kpi-and-privacy.md`.
