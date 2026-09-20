package com.kevin.lunaraspa.profiles.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.profiles.entity.CustomerProfile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerProfileRepository extends BaseRepository<CustomerProfile, Long> {
    Optional<CustomerProfile> findFirstByPhone(String phone);
}
