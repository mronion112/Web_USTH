package com.kevin.lunaraspa.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.entity.StaffProfile;
import org.springframework.stereotype.Repository;

@Repository
public interface StaffProfileRepository extends BaseRepository<StaffProfile, Long> {
}
