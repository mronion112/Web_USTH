---
doc_id: cancellation-late-arrival
title: Huỷ lịch, đổi lịch và đến muộn
audience: PUBLIC
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/public/cancellation-late-arrival
---

# Huỷ lịch, đổi lịch và đến muộn

> [!NOTE]
> Đây là **bản nháp (draft) chưa được phê duyệt** (`approved_by: null`). Mức phí và mốc thời gian dưới đây là đề xuất của nhóm vận hành và có thể thay đổi trước khi ban hành chính thức.

## 1. Tóm tắt nhanh

| Tình huống | Mức thu |
| :--- | :--- |
| Huỷ/đổi lịch báo trước ≥ 6 giờ | Miễn phí |
| Huỷ/đổi lịch báo trước < 6 giờ | 50% giá trị dịch vụ |
| Không đến (no-show) | 100% giá trị dịch vụ |
| Đến muộn quá 15 phút | Vẫn thanh toán đủ giá trị đã đặt |

## 2. Cách đếm mốc “báo trước”

- Mốc báo trước được tính từ **thời điểm khách thông báo** đến **giờ bắt đầu lịch hẹn**.
- Thông báo được ghi nhận qua web/ứng dụng, hotline, Zalo OA hoặc tại quầy lễ tân.
- Thời điểm hệ thống ghi nhận yêu cầu huỷ/đổi là căn cứ chính thức để áp mức phí.

## 3. Huỷ hoặc đổi lịch miễn phí (≥ 6 giờ)

- Khách báo trước **từ 6 giờ trở lên**: huỷ hoặc đổi lịch **không mất phí**.
- Có thể đổi sang khung giờ khác trong vòng 30 ngày nếu còn chỗ.
- Nếu lịch đã thanh toán, số tiền được giữ để dùng cho lịch mới hoặc hoàn theo yêu cầu.

## 4. Huỷ hoặc đổi lịch muộn (< 6 giờ)

- Báo trước **dưới 6 giờ**: thu **50% giá trị dịch vụ** đã đặt.
- Phần phí này bù cho thời gian kỹ thuật viên và phòng đã được giữ.
- Nếu đã thanh toán đủ, Lunara hoàn lại 50% và giữ 50% theo quy định.

## 5. Không đến (no-show)

- Khách không đến và không thông báo: thu **100% giá trị dịch vụ**.
- Nếu đã thanh toán trước, khoản đã trả được xem là phí no-show và không hoàn lại.
- Khách no-show nhiều lần có thể bị yêu cầu xác nhận lại trước khi nhận lịch mới.

## 6. Đổi lịch

- Đổi lịch được thực hiện như huỷ lịch cũ và tạo lịch mới.
- Mức phí tính theo mốc báo trước của lịch cũ.
- Slot mới phải còn trống và đã qua bước kiểm tra lịch trống.
- Khi đổi lịch, khách có thể phải thanh toán lại nếu lịch mới ở trạng thái `PENDING_PAYMENT`.

## 7. Đến muộn

- Khách nên có mặt **trước giờ hẹn 10–15 phút** để check-in và chuẩn bị.
- Đến muộn **quá 15 phút**:
  - Kỹ thuật viên có thể **rút ngắn thời lượng** tương ứng để không ảnh hưởng khách sau; hoặc
  - Phải **dời lịch** sang khung giờ khác nếu không còn thời gian thực hiện đủ.
- Trong cả hai trường hợp, khách **vẫn thanh toán đủ giá trị đã đặt**.

## 8. Trường hợp bất khả kháng

- Tai nạn, cấp cứu, thiên tai hoặc sự kiện bất khả kháng được xem xét riêng.
- Khách nên liên hệ Lunara sớm nhất có thể và cung cấp thông tin cần thiết.
- Lunara có thể miễn phí huỷ trong các trường hợp này tuỳ từng tình huống.

## 9. Cách phí được xác định và thu

| Bước | Mô tả |
| :--- | :--- |
| 1 | Xác định thời điểm báo trước so với giờ hẹn |
| 2 | Áp mức phí 0% / 50% / 100% |
| 3 | Tính trên giá trị dịch vụ đã đặt (chưa gồm VAT và phí phục vụ) |
| 4 | Ghi nhận khoản thu/hoàn vào hệ thống thanh toán |

- Giá trị dịch vụ dùng để tính phí là giá của dịch vụ đã đặt.
- Phí huỷ/đến muộn được ghi nhận rõ ràng để khách đối chiếu.

## 10. Liên hệ

| Kênh | Thông tin |
| :--- | :--- |
| Hotline | 1900 0000 |
| Zalo OA | Lunara Spa |
| Email | hello@lunara-spa.demo |
