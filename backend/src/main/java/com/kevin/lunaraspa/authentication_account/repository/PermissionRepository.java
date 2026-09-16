package com.kevin.lunaraspa.authentication_account.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.authentication_account.entity.Permission;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends BaseRepository<Permission, Short> {
}
