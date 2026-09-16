package com.kevin.lunaraspa.spa_service.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.spa_service.entity.SpaService;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SpaServiceRepository extends BaseRepository<SpaService, Long> {

    List<SpaService> findByActiveTrueOrderByDisplayOrderAscIdAsc();

    Optional<SpaService> findByIdAndActiveTrue(Long id);

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
