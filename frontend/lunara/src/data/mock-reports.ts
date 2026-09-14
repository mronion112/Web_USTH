export const REPORT_METRICS = {
  revenue: {
    value: '124.8M',
    change: '+14.2%',
    trend: 'up' as const
  },
  bookings: {
    value: '382',
    change: '+8.1%',
    trend: 'up' as const
  },
  avgBooking: {
    value: '426K',
    change: '+2.1%',
    trend: 'up' as const
  },
  completionRate: {
    value: '94.8%',
    change: '-1.4%',
    trend: 'down' as const
  }
};

export const MONTHLY_REVENUE_TREND = [
  { date: '01/09', revenue: 3800000 },
  { date: '04/09', revenue: 4200000 },
  { date: '07/09', revenue: 5100000 },
  { date: '10/09', revenue: 4800000 },
  { date: '13/09', revenue: 6300000 },
  { date: '16/09', revenue: 5900000 },
  { date: '19/09', revenue: 7100000 },
  { date: '22/09', revenue: 6800000 },
  { date: '25/09', revenue: 8400000 },
  { date: '28/09', revenue: 7900000 },
  { date: '30/09', revenue: 9200000 }
];

export const BOOKINGS_BY_SERVICE = [
  { service: 'Massage Thư Giãn', percentage: 42, count: 160 },
  { service: 'Chăm Sóc Da Mặt', percentage: 28, count: 107 },
  { service: 'Trị Liệu Thảo Dược', percentage: 18, count: 69 },
  { service: 'Dịch Vụ Khác', percentage: 12, count: 46 }
];

export const PEAK_HOURS = [
  { hour: '09:00', bookings: 12 },
  { hour: '10:00', bookings: 24 },
  { hour: '11:00', bookings: 18 },
  { hour: '14:00', bookings: 36 },
  { hour: '15:00', bookings: 42 },
  { hour: '16:00', bookings: 38 },
  { hour: '17:00', bookings: 28 }
];

export const STAFF_UTILIZATION_DATA = [
  { name: 'Nguyễn Thị Linh', role: 'Senior Therapist', rate: 91, bookings: 78 },
  { name: 'Trần Thu Mai', role: 'Facial Specialist', rate: 84, bookings: 72 },
  { name: 'Lê Minh Hoa', role: 'Therapist', rate: 68, bookings: 56 },
  { name: 'Vũ Đức Tùng', role: 'Junior Therapist', rate: 55, bookings: 42 }
];
