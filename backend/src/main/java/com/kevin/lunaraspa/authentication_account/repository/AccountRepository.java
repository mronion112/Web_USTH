package com.kevin.lunaraspa.authentication_account.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.authentication_account.entity.Account;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends BaseRepository<Account, Long> {
    Optional<Account> findByEmail(String email);
    Optional<Account> findByEmailIgnoreCase(String email);
}
