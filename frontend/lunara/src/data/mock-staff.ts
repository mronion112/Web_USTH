import { Account, StaffProfile } from '@/types';

export interface StaffMember {
  account: Account;
  profile: StaffProfile;
}

export const MOCK_STAFF: StaffMember[] = [
  {
    account: {
      id: 'acc-stf-1',
      roleId: 'r-therapist',
      roleCode: 'THERAPIST',
      email: 'linh.nguyen@lunara.vn',
      displayName: 'Nguyễn Thị Linh',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      lastLoginAt: '2026-09-14 08:30:00'
    },
    profile: {
      accountId: 'acc-stf-1',
      employeeCode: 'LNR-EMP-01',
      jobTitle: 'Senior Therapist',
      isBookable: true,
      specialties: ['Massage', 'Trị Liệu Thảo Dược', 'Đá Nóng'],
      status: 'Available',
      todayBookings: 5,
      utilizationRate: 82
    }
  },
  {
    account: {
      id: 'acc-stf-2',
      roleId: 'r-therapist',
      roleCode: 'THERAPIST',
      email: 'mai.tran@lunara.vn',
      displayName: 'Trần Thu Mai',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      lastLoginAt: '2026-09-14 09:15:00'
    },
    profile: {
      accountId: 'acc-stf-2',
      employeeCode: 'LNR-EMP-02',
      jobTitle: 'Facial Specialist',
      isBookable: true,
      specialties: ['Chăm Sóc Da Mặt', 'Phục Hồi', 'Gói VIP'],
      status: 'In service',
      todayBookings: 6,
      utilizationRate: 91
    }
  },
  {
    account: {
      id: 'acc-stf-3',
      roleId: 'r-therapist',
      roleCode: 'THERAPIST',
      email: 'hoa.le@lunara.vn',
      displayName: 'Lê Minh Hoa',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      lastLoginAt: '2026-09-14 09:45:00'
    },
    profile: {
      accountId: 'acc-stf-3',
      employeeCode: 'LNR-EMP-03',
      jobTitle: 'Therapist',
      isBookable: true,
      specialties: ['Massage', 'Body Therapy'],
      status: 'Available',
      todayBookings: 4,
      utilizationRate: 68
    }
  },
  {
    account: {
      id: 'acc-stf-4',
      roleId: 'r-therapist',
      roleCode: 'THERAPIST',
      email: 'an.pham@lunara.vn',
      displayName: 'Phạm Thuỳ An',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      lastLoginAt: '2026-09-13 18:00:00'
    },
    profile: {
      accountId: 'acc-stf-4',
      employeeCode: 'LNR-EMP-04',
      jobTitle: 'Specialist',
      isBookable: false,
      specialties: ['Gói VIP', 'Trị Liệu Toàn Thân'],
      status: 'Day off',
      todayBookings: 0,
      utilizationRate: 0
    }
  },
  {
    account: {
      id: 'acc-stf-5',
      roleId: 'r-therapist',
      roleCode: 'THERAPIST',
      email: 'tung.vu@lunara.vn',
      displayName: 'Vũ Đức Tùng',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      lastLoginAt: '2026-09-14 10:00:00'
    },
    profile: {
      accountId: 'acc-stf-5',
      employeeCode: 'LNR-EMP-05',
      jobTitle: 'Junior Therapist',
      isBookable: true,
      specialties: ['Massage Thư Giãn', 'Tẩy Tế Bào Chết'],
      status: 'Available',
      todayBookings: 3,
      utilizationRate: 55
    }
  }
];
