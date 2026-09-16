package vn.edu.usth.lunara.spaservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.usth.lunara.spaservice.entity.SpaServiceEntity;

import java.util.List;
import java.util.Optional;

public interface SpaServiceRepository extends JpaRepository<SpaServiceEntity, Long> {

    List<SpaServiceEntity> findByActiveTrueOrderByDisplayOrderAscIdAsc();

    Optional<SpaServiceEntity> findByIdAndActiveTrue(Long id);

    boolean existsByNameIgnoreCase(String name);

    @Query(value = """
            SELECT a.id AS accountId, a.display_name AS displayName
            FROM staff_services ss
            JOIN staff_profiles sp ON sp.account_id = ss.staff_account_id
            JOIN accounts a ON a.id = sp.account_id
            WHERE ss.service_id = :serviceId
              AND sp.is_bookable = TRUE
              AND a.is_active = TRUE
            ORDER BY a.display_name, a.id
            """, nativeQuery = true)
    List<StaffSummaryProjection> findActiveBookableStaffByServiceId(@Param("serviceId") Long serviceId);
}
