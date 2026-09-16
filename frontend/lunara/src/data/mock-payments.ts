import { Payment } from '@/types';

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    transactionCode: 'TX-001',
    bookingId: 'b-001',
    bookingCode: 'LNR-001',
    customerName: 'Nguyễn Văn An',
    status: 'PAID',
    method: 'QR',
    amount: 450000,
    paidAt: '2026-09-14 13:41:00',
    createdAt: '2026-09-14 13:35:00'
  },
  {
    id: 'pay-2',
    transactionCode: 'TX-002',
    bookingId: 'b-002',
    bookingCode: 'LNR-002',
    customerName: 'Trần Thị Bích',
    status: 'PAID',
    method: 'QR',
    amount: 350000,
    paidAt: '2026-09-14 13:52:00',
    createdAt: '2026-09-14 13:45:00'
  },
  {
    id: 'pay-3',
    transactionCode: 'TX-003',
    bookingId: 'b-003',
    bookingCode: 'LNR-003',
    customerName: 'Lê Minh Châu',
    status: 'FAILED',
    method: 'QR',
    amount: 650000,
    createdAt: '2026-09-14 14:02:00'
  },
  {
    id: 'pay-4',
    transactionCode: 'TX-004',
    bookingId: 'b-004',
    bookingCode: 'LNR-004',
    customerName: 'Phạm Hồng Đức',
    status: 'UNPAID',
    method: 'QR',
    amount: 500000,
    createdAt: '2026-09-14 14:10:00'
  },
  {
    id: 'pay-5',
    transactionCode: 'TX-005',
    bookingId: 'b-005',
    bookingCode: 'LNR-005',
    customerName: 'Hoàng Kim Ngân',
    status: 'PAID',
    method: 'QR',
    amount: 1200000,
    paidAt: '2026-09-14 09:45:00',
    createdAt: '2026-09-14 09:30:00'
  },
  {
    id: 'pay-6',
    transactionCode: 'TX-006',
    bookingId: 'b-006',
    bookingCode: 'LNR-006',
    customerName: 'Vũ Quốc Khánh',
    status: 'PAID',
    method: 'QR',
    amount: 850000,
    paidAt: '2026-09-14 11:20:00',
    createdAt: '2026-09-14 11:05:00'
  },
  {
    id: 'pay-7',
    transactionCode: 'TX-007',
    bookingId: 'b-007',
    bookingCode: 'LNR-007',
    customerName: 'Đặng Thùy Dương',
    status: 'REFUNDED',
    method: 'QR',
    amount: 450000,
    paidAt: '2026-09-14 08:30:00',
    refundedAt: '2026-09-14 09:10:00',
    createdAt: '2026-09-14 08:15:00'
  }
];
