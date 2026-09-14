export interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email: string;
  bookingsCount: number;
  completedCount: number;
  totalSpent: number;
  lastVisit: string;
  preferences: string;
  internalNotes: string;
}

export const MOCK_CUSTOMERS: CustomerDetail[] = [
  {
    id: 'cus-1',
    name: 'Nguyễn Văn An',
    phone: '0912 345 678',
    email: 'nguyen.an@gmail.com',
    bookingsCount: 8,
    completedCount: 7,
    totalSpent: 3200000,
    lastVisit: '09 Sep 2026',
    preferences: 'Ưu tiên kỹ thuật viên nữ · Khung giờ chiều tối (17h - 19h)',
    internalNotes: 'Khách hàng VIP, thường xuyên đi cùng phu nhân vào cuối tuần.'
  },
  {
    id: 'cus-2',
    name: 'Trần Thị Bích',
    phone: '0988 765 432',
    email: 'bich.tran@gmail.com',
    bookingsCount: 4,
    completedCount: 4,
    totalSpent: 1850000,
    lastVisit: '12 Sep 2026',
    preferences: 'Thích tinh dầu sả chanh · Da nhạy cảm',
    internalNotes: 'Hài lòng với dịch vụ chăm sóc da mặt chuyên sâu.'
  },
  {
    id: 'cus-3',
    name: 'Lê Minh Châu',
    phone: '0904 112 233',
    email: 'chau.le@gmail.com',
    bookingsCount: 12,
    completedCount: 11,
    totalSpent: 6400000,
    lastVisit: 'Hôm nay',
    preferences: 'KTV Linh hoặc Mai · Gói VIP',
    internalNotes: 'Thành viên Platinum, thích trà hoa cúc sau khi làm dịch vụ.'
  },
  {
    id: 'cus-4',
    name: 'Phạm Hồng Đức',
    phone: '0977 445 566',
    email: 'duc.pham@gmail.com',
    bookingsCount: 3,
    completedCount: 2,
    totalSpent: 1450000,
    lastVisit: 'Hôm nay',
    preferences: 'Massage lực mạnh giải cơ cổ vai gáy',
    internalNotes: 'Dân thể thao, chơi golf thường xuyên.'
  },
  {
    id: 'cus-5',
    name: 'Hoàng Kim Ngân',
    phone: '0933 889 900',
    email: 'ngan.hk@gmail.com',
    bookingsCount: 6,
    completedCount: 6,
    totalSpent: 4100000,
    lastVisit: 'Hôm nay',
    preferences: 'Phòng VIP couple · Nhiệt độ phòng 24°C',
    internalNotes: 'Rất đúng giờ, đánh giá 5 sao cho toàn bộ liệu trình.'
  }
];
