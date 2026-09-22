import { RoleCode } from './enums';

export interface Account {
  id: string;
  roleId: string;
  roleCode: RoleCode;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

/** Thông tin chi tiết hồ sơ khách hàng */
export interface CustomerProfile {
  accountId: string;
  phone?: string;
  preferences?: string;
  internalNotes?: string;
  bookingsCount?: number;
  totalSpent?: number;
  lastVisit?: string;
}

/** Thông tin chi tiết hồ sơ kỹ thuật viên/nhân viên */
export interface StaffProfile {
  accountId: string;
  employeeCode: string;
  jobTitle: string;
  isBookable: boolean;
  specialties: string[];
  status?: 'Available' | 'In service' | 'Day off';
  todayBookings?: number;
  utilizationRate?: number;
}
