import { describe, expect, it } from 'vitest';
import { latestBookingsQuery, liveBookingsQuery } from './admin-booking-query';

describe('admin booking queries', () => {
  it('puts newly created bookings on the first management page', () => {
    expect(latestBookingsQuery({ search: '', status: 'ALL', page: 0 })).toEqual({
      page: 0,
      size: 50,
      sortBy: 'CREATED_AT',
      sortDirection: 'DESC',
    });
  });

  it('loads the next seven spa-local days for live operations', () => {
    expect(liveBookingsQuery(new Date('2026-09-20T18:00:00Z'))).toEqual({
      from: '2026-09-21T00:00:00',
      to: '2026-09-28T00:00:00',
      page: 0,
      size: 100,
      sortBy: 'BOOKING_START',
      sortDirection: 'ASC',
    });
  });
});
