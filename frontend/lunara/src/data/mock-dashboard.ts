export const DASHBOARD_METRICS = {
  todayBookings: {
    value: 24,
    change: '+12%',
    trend: 'up' as const,
    subtext: 'so với hôm qua'
  },
  todayRevenue: {
    value: '8.400.000 đ',
    change: '+8.4%',
    trend: 'up' as const,
    subtext: 'mục tiêu: 10M'
  },
  customersToday: {
    value: 18,
    change: '+5 mới',
    trend: 'up' as const,
    subtext: 'tỷ lệ quay lại 72%'
  },
  staffUtilization: {
    value: '78%',
    change: '7/9 đang làm',
    trend: 'up' as const,
    subtext: '2 nhân viên nghỉ ca'
  }
};

export const REVENUE_CHART_DATA = [
  { day: 'Thứ 2', revenue: 4200000, bookings: 14 },
  { day: 'Thứ 3', revenue: 5800000, bookings: 18 },
  { day: 'Thứ 4', revenue: 7200000, bookings: 22 },
  { day: 'Thứ 5', revenue: 6100000, bookings: 19 },
  { day: 'Thứ 6', revenue: 5400000, bookings: 17 },
  { day: 'Thứ 7', revenue: 8900000, bookings: 26 },
  { day: 'Chủ Nhật', revenue: 8400000, bookings: 24 }
];

export const BOOKING_STATUS_DATA = [
  { name: 'Đã xác nhận', value: 14, color: '#1E3B2B' },
  { name: 'Đang chờ', value: 4, color: '#C5A880' },
  { name: 'Hoàn thành', value: 6, color: '#8EAA97' }
];

export const UPCOMING_BOOKINGS = [
  {
    time: '14:00',
    customer: 'Nguyễn Văn An',
    service: 'Massage Thư Giãn 60p',
    staff: 'Linh Nguyễn',
    payment: 'paid',
    status: 'confirmed'
  },
  {
    time: '14:30',
    customer: 'Trần Thị Bích',
    service: 'Chăm Sóc Da Mặt 45p',
    staff: 'Mai Trần',
    payment: 'paid',
    status: 'checked-in'
  },
  {
    time: '15:00',
    customer: 'Lê Minh Châu',
    service: 'Trị Liệu Thảo Dược 90p',
    staff: '—',
    payment: 'pending',
    status: 'pending'
  },
  {
    time: '15:30',
    customer: 'Hoàng Kim Ngân',
    service: 'Massage Thư Giãn 60p',
    staff: 'Hoa Lê',
    payment: 'paid',
    status: 'confirmed'
  },
  {
    time: '16:00',
    customer: 'Vũ Quốc Khánh',
    service: 'Đá Nóng Himalaya 60p',
    staff: 'Tùng Vũ',
    payment: 'paid',
    status: 'confirmed'
  }
];
