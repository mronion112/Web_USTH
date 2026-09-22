---
doc_id: payment-and-refund-sop
title: SOP thanh toán và hoàn tiền
audience: STAFF
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/staff/payment-and-refund-sop
---

# SOP thanh toán và hoàn tiền (nội bộ)

> [!NOTE]
> Đây là **SOP nội bộ dạng nháp chưa được phê duyệt** (`audience: STAFF`, `approved_by: null`). Liên quan tới tiền nên mọi thao tác phải được ghi nhận và đối soát. Backend là nguồn đúng duy nhất cho trạng thái payment.

## 1. Mục đích và phạm vi

- Chuẩn hoá quy trình thu tiền, xác nhận booking và hoàn tiền.
- Áp dụng cho `RECEPTIONIST`, `ACCOUNTANT`, `MANAGER`, `OWNER`.
- Không tự ý sửa giá hoặc hoàn tiền ngoài quy trình.

## 2. Phương thức thanh toán

| Phương thức | Mã | Khi nào dùng |
| :--- | :--- | :--- |
| Chuyển khoản QR | `QR` | Khách thanh toán online |
| Thẻ | `CARD` | Khách thanh toán bằng thẻ |
| Trả tại spa | `AT_SPA` | Khách trả khi đến |

## 3. Trạng thái thanh toán

| Trạng thái | Ý nghĩa |
| :--- | :--- |
| `UNPAID` | Chưa thanh toán |
| `PAID` | Đã thanh toán |
| `FAILED` | Thanh toán thất bại |
| `REFUNDED` | Đã hoàn tiền |

## 4. Quy trình thu tiền qua QR

| Bước | Thao tác |
| :--- | :--- |
| 1 | Xác nhận số tiền cần thu theo booking |
| 2 | Hiển thị mã QR cho khách |
| 3 | Kiểm tra hệ thống ghi nhận `PAID` |
| 4 | Xác nhận booking chuyển sang `CONFIRMED` |

- Chỉ xác nhận khi hệ thống đã ghi nhận thanh toán thành công.

## 5. Quy trình thu tiền qua thẻ

| Bước | Thao tác |
| :--- | :--- |
| 1 | Xác nhận số tiền và loại thẻ |
| 2 | Thực hiện giao dịch qua thiết bị thanh toán |
| 3 | Kiểm tra kết quả giao dịch |
| 4 | Nếu thất bại (`FAILED`), hướng dẫn khách thử lại |

## 6. Quy trình trả tại spa (AT_SPA)

- Khách thanh toán trực tiếp khi có mặt.
- Lễ tân thu tiền và ghi nhận thanh toán vào hệ thống.
- Đối với booking `PENDING_PAYMENT`, chỉ chuyển `CONFIRMED` sau khi thanh toán thành công.

## 7. Chuyển trạng thái booking sau thanh toán

- Booking khởi tạo ở `PENDING_PAYMENT`.
- Khi thanh toán thành công, booking chuyển sang `CONFIRMED` và ghi sự kiện nhận thanh toán.
- Nếu thanh toán thất bại, booking vẫn ở `PENDING_PAYMENT`; khách có thể thử lại.

## 8. Phí huỷ và đến muộn

| Tình huống | Mức thu |
| :--- | :--- |
| Huỷ/đổi báo trước ≥ 6 giờ | Miễn phí |
| Huỷ/đổi báo trước < 6 giờ | 50% giá trị dịch vụ |
| No-show | 100% giá trị dịch vụ |

- Phí tính trên giá trị dịch vụ đã đặt (chưa gồm VAT và phí phục vụ).
- Ghi nhận khoản thu rõ ràng để đối soát.

## 9. Quy trình hoàn tiền

| Bước | Thao tác |
| :--- | :--- |
| 1 | Xác định lý do và mức hoàn theo chính sách |
| 2 | Kiểm tra trạng thái payment hiện tại |
| 3 | Trình duyệt nếu vượt hạn mức cho phép |
| 4 | Ghi nhận hoàn tiền, đặt trạng thái `REFUNDED` |
| 5 | Thông báo cho khách và lưu vết |

> [!NOTE]
> Hoàn tiền là hành động tài chính nhạy cảm. Không thực hiện nếu chưa có phê duyệt đúng thẩm quyền và lưu vết audit.

## 10. VAT và phí phục vụ khi hoàn tiền

- VAT 8% và phí phục vụ 5% được xử lý theo số tiền thực thu.
- Khoản hoàn phản ánh đúng số tiền khách đã trả.

## 11. Đối soát cuối ca

| Hạng mục | Cần kiểm tra |
| :--- | :--- |
| Tiền mặt | Khớp với khoản thu AT_SPA |
| QR/CARD | Khớp với giao dịch hệ thống |
| Hoàn tiền | Có phê duyệt và ghi nhận đầy đủ |

- Ghi nhận chênh lệch (nếu có) và báo quản lý.

## 12. Xử lý sự cố thanh toán

- Khách bị trừ tiền nhưng hệ thống chưa ghi nhận: ghi nhận sự việc, kiểm tra giao dịch, không thu lần hai.
- Thanh toán trùng: xử lý hoàn theo quy trình.
- Mọi sự cố ghi vào sự kiện booking để theo dõi.
