package com.kevin.lunaraspa.staff_schedule.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.staff_schedule.entity.StaffTimeOff;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface StaffTimeOffRepository extends BaseRepository<StaffTimeOff, Long> {
    List<StaffTimeOff> findByStaffAccountIdOrderByStartAtAsc(Long staffAccountId);
    @Query("SELECT COUNT(t) FROM StaffTimeOff t WHERE t.staffAccountId = :staffId AND t.startAt < :endAt AND t.endAt > :startAt")
    long countOverlap(@Param("staffId") Long staffId, @Param("startAt") LocalDateTime startAt,
                      @Param("endAt") LocalDateTime endAt);
}
