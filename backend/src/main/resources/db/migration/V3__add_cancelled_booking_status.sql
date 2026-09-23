-- Issue #32: hoàn tiền phải huỷ lịch hẹn khi khách chưa được phục vụ.
-- Mở rộng ENUM là thao tác an toàn, không làm thay đổi dữ liệu sẵn có.
ALTER TABLE bookings
    MODIFY COLUMN status ENUM(
        'PENDING_PAYMENT',
        'PENDING',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_SERVICE',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING_PAYMENT';
