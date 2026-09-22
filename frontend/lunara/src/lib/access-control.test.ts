import { describe, expect, it } from 'vitest';
import { canAccessAdminRoute, ROLE_HOME } from './access-control';

describe('admin route access', () => {
  it('gives owners and managers the management workspace', () => {
    expect(canAccessAdminRoute('OWNER', '/admin/user-role')).toBe(true);
    expect(canAccessAdminRoute('MANAGER', '/admin/staff')).toBe(true);
  });

  it('limits receptionist and accountant direct URLs', () => {
    expect(canAccessAdminRoute('RECEPTIONIST', '/admin/booking')).toBe(true);
    expect(canAccessAdminRoute('RECEPTIONIST', '/admin/staff')).toBe(false);
    expect(canAccessAdminRoute('ACCOUNTANT', '/admin/payments')).toBe(true);
    expect(canAccessAdminRoute('ACCOUNTANT', '/admin/booking')).toBe(false);
  });

  it('does not admit customer or therapist to admin routes', () => {
    expect(canAccessAdminRoute('CUSTOMER', '/admin/dashboard')).toBe(false);
    expect(canAccessAdminRoute('THERAPIST', '/admin/payments')).toBe(false);
    expect(ROLE_HOME.THERAPIST).toBe('/staff/my-work');
    expect(ROLE_HOME.CUSTOMER).toBe('/booking');
  });
});
