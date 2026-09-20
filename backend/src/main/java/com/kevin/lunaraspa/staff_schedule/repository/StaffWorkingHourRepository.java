package com.kevin.lunaraspa.staff_schedule.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.staff_schedule.entity.StaffWorkingHour;
import java.util.List;

public interface StaffWorkingHourRepository extends BaseRepository<StaffWorkingHour, Long> {
    List<StaffWorkingHour> findByStaffAccountIdOrderByDayOfWeekAscStartTimeAsc(Long staffAccountId);
    void deleteByStaffAccountId(Long staffAccountId);
}
