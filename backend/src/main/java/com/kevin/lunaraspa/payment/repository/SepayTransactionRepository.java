package com.kevin.lunaraspa.payment.repository;

import com.kevin.lunaraspa.core.data.BaseRepository;
import com.kevin.lunaraspa.payment.entity.SepayTransaction;
import com.kevin.lunaraspa.payment.entity.SepayTransactionStatus;

import java.util.List;
import java.util.Optional;

public interface SepayTransactionRepository extends BaseRepository<SepayTransaction, Long> {
    Optional<SepayTransaction> findBySepayId(Long sepayId);

    List<SepayTransaction> findTop100ByStatusOrderByCreatedAtDesc(SepayTransactionStatus status);

    List<SepayTransaction> findTop100ByOrderByCreatedAtDesc();
}
