---
doc_id: pricing-payment-vat-and-tips
title: Giá, thanh toán, VAT và tip
audience: PUBLIC
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/public/pricing-payment-vat-and-tips
---

# Giá, thanh toán, VAT và tip

> [!NOTE]
> Đây là **bản nháp (draft) chưa được phê duyệt** (`approved_by: null`). Giá cụ thể của từng dịch vụ **không** nằm trong tài liệu này; giá luôn được lấy theo thời gian thực từ hệ thống đặt lịch.

## 1. Tóm tắt nhanh

| Hạng mục | Giá trị |
| :--- | :--- |
| Đơn vị tiền tệ | VND |
| VAT | 8% |
| Phí phục vụ | 5% |
| Tip cho kỹ thuật viên | Tự nguyện |

- Giá niêm yết **chưa gồm** VAT 8% và phí phục vụ 5%.
- Tip không bắt buộc và không được cộng tự động vào hoá đơn.

## 2. Cấu trúc giá dịch vụ

Mỗi dịch vụ có giá cơ bản cho thời lượng tối thiểu. Nếu dịch vụ cho phép điều chỉnh thời lượng, giá tăng theo từng bước thời lượng.

| Thành phần | Ý nghĩa |
| :--- | :--- |
| Giá cơ bản (`base_price`) | Giá tại thời lượng tối thiểu |
| Thời lượng tối thiểu | Số phút ít nhất của dịch vụ |
| Bước thời lượng | Số phút mỗi lần tăng (nếu điều chỉnh được) |
| Giá mỗi bước | Số tiền cộng thêm cho mỗi bước |

Công thức tính giá một dịch vụ:

> **Giá dịch vụ = Giá cơ bản + (Số bước tăng thêm × Giá mỗi bước)**

- Số bước tăng thêm = (Thời lượng chọn − Thời lượng tối thiểu) ÷ Bước thời lượng.
- Với dịch vụ có thời lượng cố định, giá luôn bằng giá cơ bản.

## 3. Ví dụ minh hoạ cách tính (không phải bảng giá)

> [!NOTE]
> Ví dụ dưới đây chỉ minh hoạ công thức, **không phải giá niêm yết**. Số tiền thật của từng dịch vụ lấy theo thời gian thực từ hệ thống.

Giả sử một dịch vụ có giá cơ bản cho thời lượng tối thiểu là 60 phút, bước tăng 30 phút, giá mỗi bước là một mức cố định. Nếu khách tăng thêm 1 bước (30 phút), giá dịch vụ bằng giá cơ bản cộng một lần giá mỗi bước. Khi ghép nhiều dịch vụ, tổng tiền là tổng giá từng dịch vụ.

## 4. Nhiều dịch vụ trong một lịch

- Tổng tiền của lịch = tổng giá của các dịch vụ đã chọn.
- Mỗi dịch vụ có thể có thời lượng và bước tăng khác nhau.
- Thời gian chuẩn bị và dọn dẹp (buffer) ảnh hưởng đến lịch trống nhưng không làm tăng giá dịch vụ.

## 5. VAT và phí phục vụ

| Khoản | Tỷ lệ | Cách áp dụng |
| :--- | :--- | :--- |
| VAT | 8% | Cộng trên giá dịch vụ |
| Phí phục vụ | 5% | Cộng trên giá dịch vụ |

- Phí phục vụ và VAT được thể hiện rõ trên hoá đơn.
- Khách nhận hoá đơn điện tử khi cần.

## 6. Phương thức thanh toán

| Phương thức | Mã | Mô tả |
| :--- | :--- | :--- |
| Chuyển khoản QR | `QR` | Quét mã QR để chuyển khoản |
| Thẻ | `CARD` | Thanh toán bằng thẻ |
| Trả tại spa | `AT_SPA` | Thanh toán trực tiếp tại quầy |

- Khách chọn phương thức thanh toán khi đặt lịch hoặc tại quầy.
- Với `AT_SPA`, khách thanh toán khi có mặt tại spa.

## 7. Trạng thái thanh toán và xác nhận lịch

| Trạng thái | Ý nghĩa |
| :--- | :--- |
| `UNPAID` | Chưa thanh toán |
| `PAID` | Đã thanh toán |
| `FAILED` | Thanh toán thất bại |
| `REFUNDED` | Đã hoàn tiền |

- Lịch ở trạng thái `PENDING_PAYMENT` phải được thanh toán thì mới chuyển sang `CONFIRMED`.
- Nếu thanh toán thất bại (`FAILED`), khách có thể thử lại hoặc chọn phương thức khác.

## 8. Tip cho kỹ thuật viên

- Tip là **tự nguyện**, thể hiện sự hài lòng với dịch vụ.
- Tip không bắt buộc, không ảnh hưởng đến chất lượng phục vụ.
- Khách có thể tip trực tiếp cho kỹ thuật viên.

## 9. Hoàn tiền

- Hoàn tiền áp dụng theo chính sách huỷ lịch (xem `cancellation-late-arrival.md`).
- Khoản hoàn được ghi nhận trạng thái `REFUNDED` trong hệ thống.
- Thời gian hoàn tiền phụ thuộc phương thức thanh toán ban đầu.

## 10. Liên hệ về hoá đơn và thanh toán

| Kênh | Thông tin |
| :--- | :--- |
| Hotline | 1900 0000 |
| Zalo OA | Lunara Spa |
| Email | hello@lunara-spa.demo |
