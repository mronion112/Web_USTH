package com.kevin.lunaraspa.booking.repository;

import com.kevin.lunaraspa.booking.entity.BookingEvent;
import com.kevin.lunaraspa.core.data.BaseRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingEventRepository extends BaseRepository<BookingEvent, Long> {
    long countByBookingIdAndEventType(Long bookingId, String eventType);
}
