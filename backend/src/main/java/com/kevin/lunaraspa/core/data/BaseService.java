package com.kevin.lunaraspa.core.data;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.Serializable;
import java.util.List;
import java.util.Optional;

public interface BaseService<T, I extends Serializable> {
    Optional<T> findById(I id);
    List<T> findAll();
    Page<T> findAll(Pageable pageable);
    T save(T entity);
    void deleteById(I id);
}

