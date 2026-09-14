import { PaymentStatus, PaymentMethod } from './enums';

export interface Payment {
  id: string;
  transactionCode: string;
  bookingId: string;
  bookingCode?: string;
  customerName?: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  qrPayload?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
}
