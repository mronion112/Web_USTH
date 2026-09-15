package com.kevin.lunaraspa.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.entity.Role;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends BaseRepository<Role, Byte> {
    Optional<Role> findByCode(String code);

    @EntityGraph(attributePaths = {"permissions"})
    Optional<Role> findByCodeIgnoreCase(String code);
}
