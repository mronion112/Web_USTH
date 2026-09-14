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

export interface CustomerProfile {
  accountId: string;
  phone?: string;
  preferences?: string;
  internalNotes?: string;
  bookingsCount?: number;
  totalSpent?: number;
  lastVisit?: string;
}

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
