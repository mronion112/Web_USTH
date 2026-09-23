import { describe, expect, it } from 'vitest';
import { notificationEventLink, notificationEventTitle } from './AdminTopBar';

describe('payment notification presentation', () => {
  it('labels a newly initialized payment and links it to payment operations', () => {
    expect(notificationEventTitle('PAYMENT_INITIALIZED', 'LNR-001'))
      .toBe('Có thanh toán mới đang chờ xử lý (#LNR-001)');
    expect(notificationEventLink('PAYMENT_INITIALIZED')).toBe('/admin/payments');
  });
});
