import type { RoleCode } from '@/types';

export const ROLE_HOME: Record<RoleCode, string> = {
  OWNER: '/admin/dashboard',
  MANAGER: '/admin/dashboard',
  RECEPTIONIST: '/admin/live',
  ACCOUNTANT: '/admin/payments',
  THERAPIST: '/staff/my-work',
  CUSTOMER: '/booking',
};

export const ADMIN_ROUTE_ROLES: Record<string, RoleCode[]> = {
  '/admin/dashboard': ['OWNER', 'MANAGER'],
  '/admin/live': ['OWNER', 'MANAGER', 'RECEPTIONIST'],
  '/admin/booking': ['OWNER', 'MANAGER', 'RECEPTIONIST'],
  '/admin/calendar': ['OWNER', 'MANAGER', 'RECEPTIONIST'],
  '/admin/customers': ['OWNER', 'MANAGER', 'RECEPTIONIST'],
  '/admin/staff': ['OWNER', 'MANAGER'],
  '/admin/services': ['OWNER', 'MANAGER'],
  '/admin/payments': ['OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'],
  '/admin/user-role': ['OWNER', 'MANAGER'],
  '/admin/reports': ['OWNER', 'MANAGER', 'ACCOUNTANT'],
};

export function canAccessAdminRoute(role: RoleCode, path: string): boolean {
  return ADMIN_ROUTE_ROLES[path]?.includes(role) ?? false;
}
