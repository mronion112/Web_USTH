package com.kevin.lunaraspa.spa_service.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.spa_service.entity.SpaService;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SpaServiceRepository extends BaseRepository<SpaService, Long> {
    List<SpaService> findByActiveTrueOrderByDisplayOrderAscIdAsc();
    boolean existsByNameIgnoreCase(String name);
    long countByActiveTrue();

    @Query(value = """
            SELECT a.id AS accountId, a.display_name AS displayName
            FROM staff_services ss
            JOIN staff_profiles sp ON sp.account_id = ss.staff_account_id AND sp.is_bookable = TRUE
            JOIN accounts a ON a.id = sp.account_id AND a.is_active = TRUE
            WHERE ss.service_id = :serviceId
            ORDER BY a.display_name
            """, nativeQuery = true)
    List<StaffView> findStaffForService(@Param("serviceId") Long serviceId);

    interface StaffView {
        Long getAccountId();
        String getDisplayName();
    }
}
