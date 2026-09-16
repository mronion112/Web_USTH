package vn.edu.usth.lunara.spaservice.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import vn.edu.usth.lunara.spaservice.entity.SpaServiceEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class SpaServiceRepositoryTest {

    @Autowired
    private SpaServiceRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void returnsOnlyActiveServicesInDisplayOrderThenIdOrder() {
        insertService(10, "Second", 2, true);
        insertService(20, "Inactive", 0, false);
        insertService(30, "First B", 1, true);
        insertService(25, "First A", 1, true);

        List<SpaServiceEntity> services = repository.findByActiveTrueOrderByDisplayOrderAscIdAsc();

        assertThat(services)
                .extracting(SpaServiceEntity::getName)
                .containsExactly("First A", "First B", "Second");
    }

    @Test
    void findsActiveServiceButHidesInactiveService() {
        insertService(1, "Active", 0, true);
        insertService(2, "Inactive", 0, false);

        assertThat(repository.findByIdAndActiveTrue(1L)).isPresent();
        assertThat(repository.findByIdAndActiveTrue(2L)).isEmpty();
    }

    @Test
    void returnsOnlyActiveBookableStaffForService() {
        insertService(7, "Facial Care", 0, true);
        insertStaff(21, "Tran Thi Lan", true, true, 7);
        insertStaff(22, "Inactive Account", false, true, 7);
        insertStaff(23, "Not Bookable", true, false, 7);

        List<StaffSummaryProjection> staff = repository.findActiveBookableStaffByServiceId(7L);

        assertThat(staff).hasSize(1);
        assertThat(staff.getFirst().getAccountId()).isEqualTo(21L);
        assertThat(staff.getFirst().getDisplayName()).isEqualTo("Tran Thi Lan");
    }

    private void insertService(long id, String name, int displayOrder, boolean active) {
        jdbcTemplate.update("""
                INSERT INTO services (
                    id, name, category, base_price, minimum_duration_minutes,
                    is_duration_adjustable, preparation_buffer_minutes,
                    cleanup_buffer_minutes, display_order, is_active
                ) VALUES (?, ?, 'TEST', 100000, 60, FALSE, 0, 0, ?, ?)
                """, id, name, displayOrder, active);
    }

    private void insertStaff(
            long accountId,
            String displayName,
            boolean accountActive,
            boolean bookable,
            long serviceId
    ) {
        jdbcTemplate.update(
                "INSERT INTO accounts (id, display_name, is_active) VALUES (?, ?, ?)",
                accountId,
                displayName,
                accountActive
        );
        jdbcTemplate.update(
                "INSERT INTO staff_profiles (account_id, is_bookable) VALUES (?, ?)",
                accountId,
                bookable
        );
        jdbcTemplate.update(
                "INSERT INTO staff_services (staff_account_id, service_id) VALUES (?, ?)",
                accountId,
                serviceId
        );
    }
}
