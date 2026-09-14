import { RoleCode } from '@/types';

export const APP_NAME = 'Lunara';
export const APP_TAGLINE = 'Serene Botanical Sanctuary';

export interface NavItem {
  title: string;
  href: string;
  iconName?: string;
  badge?: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export const CUSTOMER_NAV = [
  { title: 'Trang chủ', href: '/' },
  { title: 'Dịch vụ', href: '#services' },
  { title: 'Về Lunara', href: '#about' },
  { title: 'Đánh giá', href: '#reviews' }
];

export const ADMIN_SECTIONS: NavSection[] = [
  {
    section: 'OVERVIEW',
    items: [
      { title: 'Dashboard', href: '/admin/dashboard', iconName: 'LayoutDashboard' },
      { title: 'Live', href: '/admin/live', iconName: 'Radio', badge: 'Trực tiếp' }
    ]
  },
  {
    section: 'OPERATIONS',
    items: [
      { title: 'Đặt lịch', href: '/admin/booking', iconName: 'CalendarCheck' },
      { title: 'Lịch biểu', href: '/admin/calendar', iconName: 'Calendar' },
      { title: 'Khách hàng', href: '/admin/customers', iconName: 'Users' }
    ]
  },
  {
    section: 'MANAGEMENT',
    items: [
      { title: 'Nhân viên', href: '/admin/staff', iconName: 'UserCog' },
      { title: 'Dịch vụ', href: '/admin/services', iconName: 'Sparkles' },
      { title: 'Thanh toán', href: '/admin/payments', iconName: 'CreditCard' },
      { title: 'Phân quyền', href: '/admin/user-role', iconName: 'Shield' }
    ]
  },
  {
    section: 'ANALYTICS',
    items: [
      { title: 'Báo cáo', href: '/admin/reports', iconName: 'BarChart3' }
    ]
  }
];

export const ROLE_BASED_SECTIONS: Record<RoleCode, string[]> = {
  OWNER: ['Dashboard', 'Live', 'Đặt lịch', 'Lịch biểu', 'Khách hàng', 'Nhân viên', 'Dịch vụ', 'Thanh toán', 'Phân quyền', 'Báo cáo'],
  MANAGER: ['Dashboard', 'Live', 'Đặt lịch', 'Lịch biểu', 'Khách hàng', 'Nhân viên', 'Dịch vụ', 'Thanh toán', 'Phân quyền', 'Báo cáo'],
  RECEPTIONIST: ['Live', 'Đặt lịch', 'Lịch biểu', 'Khách hàng', 'Thanh toán'],
  ACCOUNTANT: ['Thanh toán', 'Báo cáo'],
  THERAPIST: ['Công việc của tôi', 'Lịch của tôi', 'Dịch vụ'],
  CUSTOMER: []
};

export const STAFF_NAV: NavItem[] = [
  { title: 'Công việc của tôi', href: '/staff/my-work', iconName: 'ClipboardList' },
  { title: 'Lịch của tôi', href: '/staff/calendar', iconName: 'Calendar' }
];
