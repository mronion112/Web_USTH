import { Booking } from '@/types';

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b-001',
    bookingCode: 'LNR-001',
    customerAccountId: 'acc-cus-1',
    staffAccountId: 'acc-stf-1',
    staffName: 'Linh Nguyễn',
    status: 'CONFIRMED',
    assignmentSource: 'CUSTOMER',
    customerNameSnapshot: 'Nguyễn Văn An',
    customerEmailSnapshot: 'nguyen.an@gmail.com',
    customerPhoneSnapshot: '0912 345 678',
    bookingStart: '2026-09-14 14:00:00',
    bookingEnd: '2026-09-14 15:00:00',
    customerNote: 'Ưu tiên phòng yên tĩnh, lực massage vừa phải.',
    totalDurationMinutes: 60,
    totalAmount: 450000,
    paymentStatus: 'PAID',
    items: [
      {
        id: 'bi-001',
        bookingId: 'b-001',
        serviceId: 'srv-1',
        serviceNameSnapshot: 'Massage Thư Giãn',
        durationMinutes: 60,
        basePriceSnapshot: 450000,
        additionalDurationSteps: 0,
        pricePerStepSnapshot: 200000,
        lineAmount: 450000
      }
    ]
  },
  {
    id: 'b-002',
    bookingCode: 'LNR-002',
    customerAccountId: 'acc-cus-2',
    staffAccountId: 'acc-stf-2',
    staffName: 'Mai Trần',
    status: 'CHECKED_IN',
    assignmentSource: 'SYSTEM',
    customerNameSnapshot: 'Trần Thị Bích',
    customerEmailSnapshot: 'bich.tran@gmail.com',
    customerPhoneSnapshot: '0988 765 432',
    bookingStart: '2026-09-14 14:15:00',
    bookingEnd: '2026-09-14 15:00:00',
    customerNote: 'Da dễ bị kích ứng với tinh dầu bạc hà.',
    totalDurationMinutes: 45,
    totalAmount: 350000,
    paymentStatus: 'PAID',
    items: [
      {
        id: 'bi-002',
        bookingId: 'b-002',
        serviceId: 'srv-2',
        serviceNameSnapshot: 'Chăm Sóc Da Mặt Chuyên Sâu',
        durationMinutes: 45,
        basePriceSnapshot: 350000,
        additionalDurationSteps: 0,
        pricePerStepSnapshot: 0,
        lineAmount: 350000
      }
    ]
  },
  {
    id: 'b-003',
    bookingCode: 'LNR-003',
    customerAccountId: 'acc-cus-3',
    status: 'PENDING',
    assignmentSource: 'SYSTEM',
    customerNameSnapshot: 'Lê Minh Châu',
    customerEmailSnapshot: 'chau.le@gmail.com',
    customerPhoneSnapshot: '0904 112 233',
    bookingStart: '2026-09-14 15:00:00',
    bookingEnd: '2026-09-14 16:30:00',
    customerNote: 'Lần đầu đến Lunara.',
    totalDurationMinutes: 90,
    totalAmount: 650000,
    paymentStatus: 'UNPAID',
    items: [
      {
        id: 'bi-003',
        bookingId: 'b-003',
        serviceId: 'srv-3',
        serviceNameSnapshot: 'Trị Liệu Thảo Dược Toàn Thân',
        durationMinutes: 90,
        basePriceSnapshot: 650000,
        additionalDurationSteps: 0,
        pricePerStepSnapshot: 0,
        lineAmount: 650000
      }
    ]
  },
  {
    id: 'b-004',
    bookingCode: 'LNR-004',
    customerAccountId: 'acc-cus-4',
    staffAccountId: 'acc-stf-3',
    staffName: 'Hoa Lê',
    status: 'IN_SERVICE',
    assignmentSource: 'ADMIN',
    customerNameSnapshot: 'Phạm Hồng Đức',
    customerEmailSnapshot: 'duc.pham@gmail.com',
    customerPhoneSnapshot: '0977 445 566',
    bookingStart: '2026-09-14 14:15:00',
    bookingEnd: '2026-09-14 15:15:00',
    totalDurationMinutes: 60,
    totalAmount: 500000,
    paymentStatus: 'PAID',
    items: [
      {
        id: 'bi-004',
        bookingId: 'b-004',
        serviceId: 'srv-4',
        serviceNameSnapshot: 'Đá Nóng Himalaya',
        durationMinutes: 60,
        basePriceSnapshot: 500000,
        additionalDurationSteps: 0,
        pricePerStepSnapshot: 220000,
        lineAmount: 500000
      }
    ]
  },
  {
    id: 'b-005',
    bookingCode: 'LNR-005',
    customerAccountId: 'acc-cus-5',
    staffAccountId: 'acc-stf-1',
    staffName: 'Linh Nguyễn',
    status: 'COMPLETED',
    assignmentSource: 'CUSTOMER',
    customerNameSnapshot: 'Hoàng Kim Ngân',
    customerEmailSnapshot: 'ngan.hk@gmail.com',
    customerPhoneSnapshot: '0933 889 900',
    bookingStart: '2026-09-14 10:00:00',
    bookingEnd: '2026-09-14 12:00:00',
    totalDurationMinutes: 120,
    totalAmount: 1200000,
    paymentStatus: 'PAID',
    items: [
      {
        id: 'bi-005',
        bookingId: 'b-005',
        serviceId: 'srv-6',
        serviceNameSnapshot: 'Gói VIP Thư Thái Toàn Thân',
        durationMinutes: 120,
        basePriceSnapshot: 1200000,
        additionalDurationSteps: 0,
        pricePerStepSnapshot: 300000,
        lineAmount: 1200000
      }
    ]
  }
];
