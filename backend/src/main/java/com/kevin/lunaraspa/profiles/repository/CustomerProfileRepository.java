package com.kevin.lunaraspa.profiles.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.profiles.entity.CustomerProfile;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerProfileRepository extends BaseRepository<CustomerProfile, Long> {
}
