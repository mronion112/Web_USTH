package com.example.fixtures;

import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;

/**
 * Khung mẫu nạp row trực tiếp cho test repository ({@code @DataJpaTest} + H2).
 *
 * <p>Cách dùng: copy file vào {@code src/test/java/<package-goc>/fixtures/},
 * đổi package, thay tên bảng và cột theo schema của module.
 * Mỗi phương thức nhận đúng tham số cần cho kịch bản, còn lại dùng default.
 * Thay thế các helper {@code insertX} private rải rác trong từng class test.
 *
 * <p>Ví dụ:
 * <pre>
 * DbFixtures.insertService(jdbcTemplate, 7L, "Facial Care", 0, true);
 * DbFixtures.assignStaff(jdbcTemplate, 21L, 7L);
 * </pre>
 */
public final class DbFixtures {

    private DbFixtures() {
    }

    /**
     * Chèn một service với giá trị tối thiểu đủ cho query, các cột còn lại default.
     */
    public static void insertService(JdbcTemplate jdbc, long id, String name, int displayOrder,
            boolean active) {
        jdbc.update("""
                INSERT INTO services (
                    id, name, category, base_price, minimum_duration_minutes,
                    is_duration_adjustable, preparation_buffer_minutes,
                    cleanup_buffer_minutes, display_order, is_active
                ) VALUES (?, ?, 'TEST', ?, 60, FALSE, 0, 0, ?, ?)
                """, id, name, new BigDecimal("100000"), displayOrder, active);
    }

    /**
     * Chèn một account staff và gán vào service, đủ điều kiện bookable mặc định.
     */
    public static void assignStaff(JdbcTemplate jdbc, long accountId, long serviceId) {
        jdbc.update("INSERT INTO accounts (id, display_name, is_active) VALUES (?, ?, ?)",
                accountId, "Staff " + accountId, true);
        jdbc.update("INSERT INTO staff_profiles (account_id, is_bookable) VALUES (?, ?)",
                accountId, true);
        jdbc.update("INSERT INTO staff_services (staff_account_id, service_id) VALUES (?, ?)",
                accountId, serviceId);
    }
}
