package com.kevin.lunaraspa.booking.repository;

import com.kevin.lunaraspa.booking.entity.BookingItem;
import com.kevin.lunaraspa.core.data.BaseRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingItemRepository extends BaseRepository<BookingItem, Long> {
}
