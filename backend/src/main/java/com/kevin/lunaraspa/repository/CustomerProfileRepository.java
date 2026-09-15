package com.kevin.lunaraspa.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.entity.CustomerProfile;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerProfileRepository extends BaseRepository<CustomerProfile, Long> {
}
