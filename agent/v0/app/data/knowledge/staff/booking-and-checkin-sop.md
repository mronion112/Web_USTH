---
doc_id: booking-and-checkin-sop
title: SOP đặt lịch và check-in
audience: STAFF
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/staff/booking-and-checkin-sop
---

# SOP đặt lịch và check-in (nội bộ)

> [!NOTE]
> Đây là **SOP nội bộ dạng nháp chưa được phê duyệt** (`audience: STAFF`, `approved_by: null`). Chỉ dùng cho nhân sự được cấp quyền vận hành booking. Hệ thống backend là nguồn đúng duy nhất cho business rule; SOP này chỉ hướng dẫn thao tác.

## 1. Mục đích và phạm vi

- Chuẩn hoá cách lễ tân tạo, sửa và check-in lịch hẹn cho khách.
- Áp dụng cho vai trò `RECEPTIONIST`, `MANAGER`, `OWNER` có quyền vận hành booking.
- Không áp dụng cho kỹ thuật viên (`THERAPIST`) trừ khi được cấp quyền bổ sung.

## 2. Vai trò liên quan

| Vai trò | Trách nhiệm chính |
| :--- | :--- |
| `RECEPTIONIST` | Tạo booking, check-in, gán kỹ thuật viên |
| `MANAGER` | Giám sát, xử lý ngoại lệ, gán/đổi staff |
| `THERAPIST` | Bắt đầu và hoàn thành dịch vụ được giao |
| `OWNER` | Toàn quyền, xử lý trường hợp đặc biệt |

## 3. Nguyên tắc chung

- Không tự tính giá hay kiểm tra slot ngoài hệ thống; luôn dùng chức năng của hệ thống.
- Mọi thay đổi trạng thái booking phải được ghi nhận trong lịch sử sự kiện.
- Xác minh danh tính khách trước khi tạo hoặc sửa booking.

## 4. Tạo booking hộ khách

| Bước | Thao tác |
| :--- | :--- |
| 1 | Xác minh khách (tên, số điện thoại, email) |
| 2 | Chọn dịch vụ và thời lượng mong muốn |
| 3 | Kiểm tra lịch trống theo khung giờ |
| 4 | Chọn hoặc để hệ thống gán kỹ thuật viên |
| 5 | Ghi chú sức khoẻ và yêu cầu đặc biệt |
| 6 | Xác nhận thông tin giá và khung giờ với khách |
| 7 | Lưu booking và hướng dẫn khách thanh toán nếu cần |

- Booking mới khởi tạo ở trạng thái `PENDING_PAYMENT`.
- Đọc lại tổng thời lượng, tổng tiền và buffer cho khách nghe trước khi lưu.

## 5. Kiểm tra lịch trống

- Dùng chức năng kiểm tra lịch trống của hệ thống, dựa trên: kỹ năng kỹ thuật viên, giờ làm việc, ngày nghỉ, booking đã có và buffer.
- Không tự suy đoán slot còn trống bằng cách cộng trừ thời gian thủ công.
- Nếu không có slot phù hợp, đề nghị khung giờ gần nhất hoặc danh sách chờ.

## 6. Vòng đời booking

| Trạng thái | Ai/điều kiện chuyển |
| :--- | :--- |
| `PENDING_PAYMENT` | Hệ thống tạo khi đặt lịch |
| `PENDING` | Đã ghi nhận, chờ xác nhận |
| `CONFIRMED` | Sau khi thanh toán thành công |
| `CHECKED_IN` | Lễ tân check-in khi khách đến |
| `IN_SERVICE` | Kỹ thuật viên bắt đầu dịch vụ |
| `COMPLETED` | Kỹ thuật viên hoàn thành dịch vụ |

- Booking `PENDING_PAYMENT` chưa thanh toán thì chưa được coi là đã xác nhận.
- Không tự đổi trạng thái ngoài luồng nghiệp vụ.

## 7. Quy trình check-in

| Bước | Thao tác |
| :--- | :--- |
| 1 | Tra cứu booking theo mã hoặc số điện thoại |
| 2 | Xác nhận booking ở trạng thái `CONFIRMED` |
| 3 | Xác nhận khách, dịch vụ và khung giờ |
| 4 | Xác nhận khai báo sức khoẻ đã hoàn tất |
| 5 | Thực hiện check-in để chuyển sang `CHECKED_IN` |
| 6 | Thông báo cho kỹ thuật viên phụ trách |

- Nếu booking chưa `CONFIRMED`, xử lý thanh toán trước khi check-in.
- Không check-in booking đã ở trạng thái `CHECKED_IN` trở lên.

## 8. Xử lý đến muộn

- Đến muộn quá 15 phút: thông báo kỹ thuật viên và xác nhận khách chấp nhận rút ngắn hoặc dời lịch.
- Ghi chú thời điểm khách đến vào sự kiện booking.
- Khách vẫn thanh toán đủ giá trị đã đặt.

## 9. Xử lý khách không đến (no-show)

- Sau thời gian chờ hợp lý, cập nhật trạng thái khách không đến theo quy trình.
- Ghi nhận khoản thu 100% theo chính sách.
- Thông báo cho quản lý nếu cần theo dõi.

## 10. Gán kỹ thuật viên

- Chỉ gán kỹ thuật viên có kỹ năng phù hợp dịch vụ và còn trống lịch.
- Ghi nhận nguồn gán: `SYSTEM`, `CUSTOMER` hoặc `ADMIN`.
- Không gán kỹ thuật viên cho booking đã `CHECKED_IN`, `IN_SERVICE` hoặc `COMPLETED`.

## 11. Bàn giao ca

- Bàn giao danh sách booking của ca tiếp theo, đặc biệt các booking chưa thanh toán.
- Ghi chú các trường hợp ngoại lệ cần theo dõi.

## 12. Ghi chú bất thường

- Mọi bất thường (khách đến muộn, đổi lịch đột xuất, sự cố thiết bị) ghi vào ghi chú booking.
- Không ghi thông tin nhạy cảm không cần thiết vào ghi chú nội bộ.
